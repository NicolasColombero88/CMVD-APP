package service

import (
	companySv "api/modules/companies/service"
	"api/modules/waybill/adapter/persistence"
	"api/modules/waybill/domain"
	"errors"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

var company = companySv.NewCompanyService()

type CreateWaybillHook func(waybill *domain.Waybill, tokenClaims interface{}) error

var createWaybillHooks []CreateWaybillHook

// checkDailyLimit lanza error si ya se alcanzó el máximo del día
func (s *WaybillServiceImpl) checkDailyLimit(companyID primitive.ObjectID, date time.Time) error {
	// 1) Calculamos inicio de día
	start := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	dateKey := start.Format("2006-01-02")
	count, err := s.userRepository.GetCountDailyShipments(companyID, dateKey)
	if err != nil {
		return fmt.Errorf("falló conteo diario: %w", err)
	}
	// Día en mayúsculas: MONDAY, TUESDAY, ...
	day := strings.ToUpper(start.Weekday().String())
	maxEnvios, err := strconv.Atoi(os.Getenv("MAX_DAILY_SHIPMENTS_" + day))
	if err != nil {
		return fmt.Errorf("configuración inválida para %s: %w", day, err)
	}
	if count >= int64(maxEnvios) {
		return fmt.Errorf("límite diario (%d) alcanzado para %s", maxEnvios, day)
	}
	return nil
}

// timeMustParse es helper para parsear sin propagar error
/*func timeMustParse(dateStr string) time.Time {
	t, _ := time.Parse("2006-01-02", dateStr)
	return t
}*/

func AddCreateWaybillHook(hook CreateWaybillHook) {
	createWaybillHooks = append(createWaybillHooks, hook)
}

type WaybillServiceImpl struct {
	userRepository *persistence.Repository
}

func NewWaybillService() domain.WaybillService {
	repo, err := persistence.NewRepository()
	if err != nil {
		log.Fatal(err)
	}

	return &WaybillServiceImpl{
		userRepository: repo,
	}
}
func (s *WaybillServiceImpl) CreateWaybill(waybill domain.Waybill, tokenClaims interface{}) (primitive.ObjectID, error) {
	claims, ok := tokenClaims.(map[string]interface{})
	if !ok {
		return primitive.NilObjectID, errors.New("invalid tokenClaims format")
	}
	userRole, ok := claims["role"].(string)
	if !ok {
		return primitive.NilObjectID, errors.New("userRole not found in tokenClaims")
	}
	var companyId primitive.ObjectID
	if userRole == "Cliente" {
		companyIdHex, ok := claims["companyId"].(string)
		if !ok {
			return primitive.NilObjectID, errors.New("companyId not found in tokenClaims")
		}
		var err error
		companyId, err = primitive.ObjectIDFromHex(companyIdHex)
		if err != nil {
			return primitive.NilObjectID, fmt.Errorf("invalid companyId format: %w", err)
		}
		log.Printf("Error companyId========: %v", companyId)
	} else {
		if waybill.CompanyId.IsZero() {
			return primitive.NilObjectID, errors.New("waybill.CompanyId is not set")
		}
		companyId = waybill.CompanyId
	}

	company, err := company.GetCompany(companyId.Hex(), tokenClaims)
	if err != nil {
		return primitive.NilObjectID, fmt.Errorf("error fetching company: %w", err)
	}

	branchDocument, err := domain.CreateNewWaybill(waybill, companyId, company)
	if err != nil {
		return primitive.NilObjectID, fmt.Errorf("error creating waybill document: %w", err)
	}

	// Validar límite diario para la fecha de retiro
	if err := s.checkDailyLimit(companyId, branchDocument.WithdrawalDate); err != nil {
		return primitive.NilObjectID, err
	}

	// 1) Validar que la fecha de delivery no sea anterior a la de pickup
	if branchDocument.DeliveryDate.Before(branchDocument.WithdrawalDate) {
		return primitive.NilObjectID, errors.New("la fecha de delivery no puede ser anterior a la de pickup")
	}

	// 2) Validar límite diario para la fecha de RETIRO
	if err := s.checkDailyLimit(companyId, branchDocument.WithdrawalDate); err != nil {
		return primitive.NilObjectID, err
	}
	// 3) Validar límite diario para la fecha de ENTREGA
	if err := s.checkDailyLimit(companyId, branchDocument.DeliveryDate); err != nil {

		return primitive.NilObjectID, err
	}

	err = s.userRepository.InsertWaybill(branchDocument)

	var hookErrors []error
	for _, hook := range createWaybillHooks {
		if err := hook(branchDocument, tokenClaims); err != nil {
			hookErrors = append(hookErrors, err)
		}
	}

	if len(hookErrors) > 0 {
		for _, hookErr := range hookErrors {
			log.Printf("Error in CreateWaybill hook: %v", hookErr)
		}
	}

	// Enviar correo de confirmación al cliente
	if err := s.userRepository.Email(
		branchDocument.Sender.Email,
		branchDocument.Sender.Name,
		"Confirmación de creación de guía",
		fmt.Sprintf("Hola %s,\n\nTu guía %s ha sido creada exitosamente.\n\nSaludos,\nCadetería MVD", branchDocument.Sender.Name, branchDocument.WaybillNumber),
	); err != nil {
		log.Printf("Error al enviar correo de confirmación: %v", err)
	}

	return branchDocument.ID, nil
}
func (s *WaybillServiceImpl) GetAllWaybill(
	tokenClaims interface{},
	status string,
	search string,
	cadeteId string,
	withdrawalAfter string,
	withdrawalBefore string,
	deliveryAfter string,
	deliveryBefore string,
	page int,
	limit int,
) ([]domain.Waybill, int, int, error) {
	userRol, ok := tokenClaims.(map[string]interface{})["role"].(string)
	if !ok {
		return nil, 0, 0, errors.New("userRol not found in tokenClaims")
	}
	if userRol == "Cliente" {
		companyIdStr, ok := tokenClaims.(map[string]interface{})["companyId"].(string)
		if !ok {
			return nil, 0, 0, errors.New("companyId not found in tokenClaims")
		}

		companyId, err := primitive.ObjectIDFromHex(companyIdStr)
		if err != nil {
			return nil, 0, 0, err
		}

		return s.userRepository.GetAllWaybill(companyId, status, search, withdrawalAfter, withdrawalBefore, deliveryAfter, deliveryBefore, page, limit)
	} else {
		userId, ok := tokenClaims.(map[string]interface{})["id"].(string)
		if !ok {
			return nil, 0, 0, errors.New("userId not found in tokenClaims")
		}

		if cadeteId != "" {
			userRol = "Cadete"
			userId = cadeteId
		}

		return s.userRepository.GetAllWaybillAdmin(status, search, userId, userRol, withdrawalAfter, withdrawalBefore, deliveryAfter, deliveryBefore, page, limit)
	}
}

func (s *WaybillServiceImpl) GetWaybill(waybillID string, tokenClaims interface{}) (domain.Waybill, error) {
	userRol, ok := tokenClaims.(map[string]interface{})["role"].(string)
	if !ok {
		return domain.Waybill{}, errors.New("userRol not found in tokenClaims")
	}
	fmt.Println("WaybillServiceImpl GetWaybill: 1")
	waybillObjID, err := primitive.ObjectIDFromHex(waybillID)
	if err != nil {
		return domain.Waybill{}, err
	}
	fmt.Println("WaybillServiceImpl GetWaybill: 1")
	if userRol == "Admin" {
		companyIdStr, ok := tokenClaims.(map[string]interface{})["companyId"].(string)
		if !ok {
			return domain.Waybill{}, errors.New("companyId not found in tokenClaims")
		}
		return s.userRepository.GetWaybill(companyIdStr, waybillObjID)
	} else {
		return s.userRepository.GetWaybill("", waybillObjID)
	}
}
func (s *WaybillServiceImpl) UpdateWaybill(waybillID string, waybill domain.UpdateWaybill, tokenClaims interface{}) error {
	waybillObjID, err := primitive.ObjectIDFromHex(waybillID)
	if err != nil {
		return fmt.Errorf("invalid waybillID: %w", err)
	}

	claimsMap, ok := tokenClaims.(map[string]interface{})
	if !ok {
		return errors.New("invalid tokenClaims format")
	}

	userRole, ok := claimsMap["role"].(string)
	if !ok {
		return errors.New("userRole not found in tokenClaims")
	}

	var companyId primitive.ObjectID
	if userRole == "Admin" {
		companyIdStr, ok := claimsMap["companyId"].(string)
		if !ok {
			return errors.New("companyId not found in tokenClaims")
		}

		companyId, err = primitive.ObjectIDFromHex(companyIdStr)
		if err != nil {
			return fmt.Errorf("invalid companyId in tokenClaims: %w", err)
		}
	} else {
		// Usar el CompanyId del objeto waybill
		companyId = waybill.CompanyId
	}

	// Convertir companyId de ObjectID a string
	companyIdStr := companyId.Hex()

	// Obtener los datos de la compañía
	companyData, err := company.GetCompany(companyIdStr, tokenClaims) // Ahora se pasa como string
	if err != nil {
		return fmt.Errorf("failed to get company data: %w", err)
	}

	// Actualizar los datos de la guía de envío
	waybillData, err := domain.UpdateWaybillWithInput(waybill, companyData)
	if err != nil {
		return fmt.Errorf("failed to transform waybill data: %w", err)
	}

	// Guardar los cambios en el repositorio
	err = s.userRepository.UpdateWaybill(waybillObjID, waybillData)
	if err != nil {
		return fmt.Errorf("failed to update waybill: %w", err)
	}

	return nil
}

func (s *WaybillServiceImpl) CreateStatusHistory(
	waybillID string,
	statusHistory domain.SetStatusHistory,
	tokenClaims interface{},
) error {
	// 1. Validar y generar el objeto de historial de estado
	waybillUpdate, err := domain.UpdateWaybillWithInput2(statusHistory.Status)
	if err != nil {
		return err
	}
	statusHistoryObj, err := domain.CreateStatusHistory(statusHistory)
	if err != nil {
		return err
	}
	if statusHistoryObj == nil {
		return errors.New("Error: statusHistoryObj es nil")
	}

	// 2. Verificar permisos de rol
	claimsMap, ok := tokenClaims.(map[string]interface{})
	if !ok {
		return errors.New("Formato de tokenClaims inválido")
	}
	userRol, ok := claimsMap["role"].(string)
	if !ok {
		return errors.New("userRole not found in tokenClaims")
	}
	if userRol != "Super Admin" && userRol != "Cadete" {
		return errors.New("No tienes permiso para cambiar este estado")
	}

	// 3. Parsear ID de la guía y actualizar el estado
	waybillObjID, err := primitive.ObjectIDFromHex(waybillID)
	if err != nil {
		return fmt.Errorf("ID de guía inválido: %v", err)
	}
	if err := s.userRepository.UpdateWaybill(waybillObjID, waybillUpdate); err != nil {
		return fmt.Errorf("error updating waybill status: %v", err)
	}

	// 4. Recuperar guía para obtener datos de la compañía/usuario (comentado)
	// waybillT, err := s.userRepository.GetWaybill("", waybillObjID)
	// if err != nil {
	//     return fmt.Errorf("Error al obtener guía: %v", err)
	// }

	// 5. Recuperar datos del usuario para email (comentado)
	// user, err := s.userRepository.GetCompany(waybillT.CompanyId)
	// if err != nil {
	//     return fmt.Errorf("error al obtener el usuario: %v", err)
	// }

	// 6. Generar contenido HTML para el correo (comentado)
	// htmlContent := fmt.Sprintf(
	//     "<html><head></head><body><p>La guía %s cambió al estado: <b>%s</b>.</p><p>Revisa la plataforma para más detalles.</p></body></html>",
	//     waybillID,
	//     statusHistory.Status,
	// )

	// 7. Enviar correo al usuario (comentado)
	// if err := s.userRepository.Email(user.Email, user.Name, "Cambio de estado de Envío", htmlContent); err != nil {
	//     fmt.Printf("Error al enviar el correo: %v\n", err)
	// }

	// 8. Guardar el historial de cambios de estado en BD
	return s.userRepository.InsertStatusHistory(waybillObjID, *statusHistoryObj)
}

func (s *WaybillServiceImpl) CreatePayment(waybillID string, payment domain.Payment, tokenClaims interface{}) (primitive.ObjectID, error) {

	waybillObjID, err := primitive.ObjectIDFromHex(waybillID)
	if err != nil {
		return primitive.NilObjectID, err
	}
	_, err = s.GetWaybill(waybillID, tokenClaims)
	if err != nil {
		return primitive.NilObjectID, fmt.Errorf("error al obtener la waybill: %v", err)
	}
	waybillDocument, err := domain.CreatePayment(payment)
	if err != nil {
		return primitive.NilObjectID, err
	}
	err = s.userRepository.UpdateWaybill(waybillObjID, waybillDocument)
	if err != nil {
		return primitive.NilObjectID, fmt.Errorf("error al actualizar la waybill: %v", err)
	}
	return waybillObjID, nil
}
func (s *WaybillServiceImpl) DeleteWaybill(waybillID string, tokenClaims interface{}) error {
	waybillObjID, err := primitive.ObjectIDFromHex(waybillID)
	if err != nil {
		return err
	}

	err = s.userRepository.DeleteWaybill(waybillObjID) // Se usa la variable err ya declarada
	if err != nil {
		return err
	}
	return nil
}
func (s *WaybillServiceImpl) UpdateCadete(waybillID string, waybill domain.Cadete, tokenClaims interface{}) error {
	waybillObjID, err := primitive.ObjectIDFromHex(waybillID)
	if err != nil {
		return fmt.Errorf("invalid waybillID: %w", err)
	}

	claimsMap, ok := tokenClaims.(map[string]interface{})
	if !ok {
		return errors.New("invalid tokenClaims format")
	}

	userRole, ok := claimsMap["role"].(string)
	if !ok {
		return errors.New("userRole not found in tokenClaims")
	}

	if userRole != "Admin" && userRole != "Super Admin" {
		return errors.New("permission denied: user does not have the required role")
	}

	waybillIn, err := s.userRepository.GetWaybill("", waybillObjID)
	if err != nil {
		return fmt.Errorf("error getting waybill: %w", err)
	}

	waybillData := domain.SetCadete(waybill, waybillIn.Status)
	log.Printf("waybillData after setting cadete: %v", waybillData)

	err = s.userRepository.UpdateWaybill(waybillObjID, waybillData)
	if err != nil {
		return fmt.Errorf("failed to update waybill: %w", err)
	}

	user, err := s.userRepository.GetUserByID(waybill.CadeteId)
	if err != nil {
		return fmt.Errorf("error retrieving cadete user: %w", err)
	}

	htmlContent := fmt.Sprintf("<html><head></head><body><p>El Envio #%s,</p><p>Se te asignó un nuevo envío, revisa la plataforma.</p></body></html>", waybillID)
	err = s.userRepository.Email(user.Email, user.Name, "Asignación de Envío", htmlContent)
	if err != nil {
		fmt.Printf("Error sending email: %v\n", err)
	}

	return nil
}
func (s *WaybillServiceImpl) GetCountWithdrawalDate(fechaminimaStr string) ([]map[string]interface{}, error) {
	return s.userRepository.GetCountWithdrawalDate(fechaminimaStr)
}
