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

// Servicio de compañías
var companyService = companySv.NewCompanyService()

type CreateWaybillHook func(waybill *domain.Waybill, tokenClaims interface{}) error

var createWaybillHooks []CreateWaybillHook

// -----------------------------------------------------------------------------
// Helpers de fecha (sólidos para PUT/POST)
// -----------------------------------------------------------------------------

// parseToStartOfDayFlexible intenta varias entradas comunes:
//   - "2006-01-02"
//   - "02-01-2006"
//   - RFC3339 completo
//   - "2006-01-02 15:04" (solo toma la fecha)
//
// Devuelve siempre el inicio del día en UTC.
func parseToStartOfDayFlexible(s string, loc *time.Location) (time.Time, error) {
	val := strings.TrimSpace(s)
	if val == "" {
		return time.Time{}, fmt.Errorf("empty")
	}

	// YYYY-MM-DD
	if t, err := time.ParseInLocation("2006-01-02", val, loc); err == nil {
		return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, loc).UTC(), nil
	}

	// DD-MM-YYYY
	if t, err := time.ParseInLocation("02-01-2006", val, loc); err == nil {
		return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, loc).UTC(), nil
	}

	// YYYY-MM-DD HH:mm (descartamos hora, solo fecha)
	if t, err := time.ParseInLocation("2006-01-02 15:04", val, loc); err == nil {
		return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, loc).UTC(), nil
	}

	// RFC3339 (con o sin milisegundos)
	if t, err := time.Parse(time.RFC3339, val); err == nil {
		t = t.In(loc)
		return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, loc).UTC(), nil
	}

	return time.Time{}, fmt.Errorf("invalid date: %q", s)
}

// toStartOfDayUTC lleva un time.Time cualquiera al inicio de día local y lo pasa a UTC.
func toStartOfDayUTC(t time.Time) time.Time {
	if t.IsZero() {
		return t
	}
	loc := time.Now().Location()
	local := t.In(loc)
	return time.Date(local.Year(), local.Month(), local.Day(), 0, 0, 0, 0, loc).UTC()
}

// -----------------------------------------------------------------------------
// Límite diario por compañía
// -----------------------------------------------------------------------------

// checkDailyLimit lanza error si ya se alcanzó el máximo del día
func (s *WaybillServiceImpl) checkDailyLimit(companyID primitive.ObjectID, date time.Time) error {
	// Inicio de día en la zona local del sistema
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

// -----------------------------------------------------------------------------
// Servicio
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Create
// -----------------------------------------------------------------------------

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
		log.Printf("CreateWaybill: companyId (Cliente) = %v", companyId)
	} else {
		if waybill.CompanyId.IsZero() {
			return primitive.NilObjectID, errors.New("waybill.CompanyId is not set")
		}
		companyId = waybill.CompanyId
	}

	// Traer datos de la compañía
	companyDoc, err := companyService.GetCompany(companyId.Hex(), tokenClaims)
	if err != nil {
		return primitive.NilObjectID, fmt.Errorf("error fetching company: %w", err)
	}

	// Armar documento de guía desde dominio
	branchDocument, err := domain.CreateNewWaybill(waybill, companyId, companyDoc)
	if err != nil {
		return primitive.NilObjectID, fmt.Errorf("error creating waybill document: %w", err)
	}

	// Validar límite diario para la fecha de retiro
	if err := s.checkDailyLimit(companyId, branchDocument.WithdrawalDate); err != nil {
		return primitive.NilObjectID, err
	}

	// La fecha de entrega no puede ser anterior a la de retiro
	if branchDocument.DeliveryDate.Before(branchDocument.WithdrawalDate) {
		return primitive.NilObjectID, errors.New("la fecha de delivery no puede ser anterior a la de pickup")
	}

	// Validar límite diario para la fecha de entrega
	if err := s.checkDailyLimit(companyId, branchDocument.DeliveryDate); err != nil {
		return primitive.NilObjectID, err
	}

	// Insertar en BD
	if err := s.userRepository.InsertWaybill(branchDocument); err != nil {
		return primitive.NilObjectID, fmt.Errorf("error al insertar la waybill: %w", err)
	}

	// Ejecutar hooks (no bloqueantes)
	var hookErrors []error
	for _, hook := range createWaybillHooks {
		if hookErr := hook(branchDocument, tokenClaims); hookErr != nil {
			hookErrors = append(hookErrors, hookErr)
		}
	}
	if len(hookErrors) > 0 {
		for _, hookErr := range hookErrors {
			log.Printf("Error in CreateWaybill hook: %v", hookErr)
		}
	}

	// Enviar correo de confirmación al cliente (no bloqueante)
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

// -----------------------------------------------------------------------------
// Listado
// -----------------------------------------------------------------------------

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
	}

	userId, ok := tokenClaims.(map[string]interface{})["id"].(string)
	if !ok {
		return nil, 0, 0, errors.New("userId not found in tokenClaims")
	}

	// Si filtran por cadeteId, forzamos el rol
	if cadeteId != "" {
		userRol = "Cadete"
		userId = cadeteId
	}

	return s.userRepository.GetAllWaybillAdmin(status, search, userId, userRol, withdrawalAfter, withdrawalBefore, deliveryAfter, deliveryBefore, page, limit)
}

// -----------------------------------------------------------------------------
// Get
// -----------------------------------------------------------------------------

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
	}

	return s.userRepository.GetWaybill("", waybillObjID)
}

// -----------------------------------------------------------------------------
// Update  (fix: siempre actualiza WithdrawalDate correctamente)
// -----------------------------------------------------------------------------

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

	// Determinar companyId
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
		companyId = waybill.CompanyId
	}

	// Traer datos de la compañía
	companyData, err := companyService.GetCompany(companyId.Hex(), tokenClaims)
	if err != nil {
		return fmt.Errorf("failed to get company data: %w", err)
	}

	// Generar struct de actualización según dominio (struct tipado, no map)
	waybillData, err := domain.UpdateWaybillWithInput(waybill, companyData)
	if err != nil {
		return fmt.Errorf("failed to transform waybill data: %w", err)
	}
	if waybillData == nil {
		return errors.New("domain.UpdateWaybillWithInput devolvió nil")
	}

	// --------- Normalización robusta de fechas ---------
	loc := time.Now().Location()

	// a) Si vino pickup_datetime, recalculamos WithdrawalDate desde ahí (soporta YYYY-MM-DD / DD-MM-YYYY / RFC3339 / YYYY-MM-DD HH:mm)
	if strings.TrimSpace(waybill.PickupDatetime) != "" {
		if t, err := parseToStartOfDayFlexible(waybill.PickupDatetime, loc); err == nil {
			waybillData.WithdrawalDate = t
		} else {
			fmt.Printf("WARN UpdateWaybill: pickup_datetime inválido (%s): %v\n", waybill.PickupDatetime, err)
		}
		// Aseguramos que se persista el texto si el dominio no lo dejó
		if strings.TrimSpace(waybillData.PickupDatetime) == "" {
			waybillData.PickupDatetime = waybill.PickupDatetime
		}
	}

	// b) Si NO vino pickup_datetime pero sí WithdrawalDate (en el payload), normalizamos a inicio de día
	if waybillData.WithdrawalDate.IsZero() && !waybill.WithdrawalDate.IsZero() {
		waybillData.WithdrawalDate = toStartOfDayUTC(waybill.WithdrawalDate)
	}

	// c) DeliveryDate + DeliveryHour (si corresponde). Si entra solo la fecha, la dejamos a 00:00 UTC
	if !waybill.DeliveryDate.IsZero() {
		if strings.TrimSpace(waybill.DeliveryHour) != "" {
			if hhmm, err := time.Parse("15:04", waybill.DeliveryHour); err == nil {
				dl := waybill.DeliveryDate.In(loc)
				combined := time.Date(dl.Year(), dl.Month(), dl.Day(), hhmm.Hour(), hhmm.Minute(), 0, 0, loc)
				waybillData.DeliveryDate = combined.UTC()
			} else {
				// si la hora vino inválida, guardamos la fecha al inicio del día
				waybillData.DeliveryDate = toStartOfDayUTC(waybill.DeliveryDate)
			}
		} else {
			waybillData.DeliveryDate = toStartOfDayUTC(waybill.DeliveryDate)
		}
	}

	// d) updated_at siempre
	waybillData.UpdatedAt = time.Now().UTC()

	// Guardar
	if err := s.userRepository.UpdateWaybill(waybillObjID, waybillData); err != nil {
		return fmt.Errorf("failed to update waybill: %w", err)
	}
	return nil
}

// -----------------------------------------------------------------------------
// Status History
// -----------------------------------------------------------------------------

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

	// 4. Guardar historial
	return s.userRepository.InsertStatusHistory(waybillObjID, *statusHistoryObj)
}

// -----------------------------------------------------------------------------
// Payment
// -----------------------------------------------------------------------------

func (s *WaybillServiceImpl) CreatePayment(waybillID string, payment domain.Payment, tokenClaims interface{}) (primitive.ObjectID, error) {
	waybillObjID, err := primitive.ObjectIDFromHex(waybillID)
	if err != nil {
		return primitive.NilObjectID, err
	}

	// Validar que exista la guía y que el usuario tenga acceso
	if _, err := s.GetWaybill(waybillID, tokenClaims); err != nil {
		return primitive.NilObjectID, fmt.Errorf("error al obtener la waybill: %v", err)
	}

	waybillDocument, err := domain.CreatePayment(payment)
	if err != nil {
		return primitive.NilObjectID, err
	}

	if err := s.userRepository.UpdateWaybill(waybillObjID, waybillDocument); err != nil {
		return primitive.NilObjectID, fmt.Errorf("error al actualizar la waybill: %v", err)
	}

	return waybillObjID, nil
}

// -----------------------------------------------------------------------------
// Delete
// -----------------------------------------------------------------------------

func (s *WaybillServiceImpl) DeleteWaybill(waybillID string, tokenClaims interface{}) error {
	waybillObjID, err := primitive.ObjectIDFromHex(waybillID)
	if err != nil {
		return err
	}

	if err := s.userRepository.DeleteWaybill(waybillObjID); err != nil {
		return err
	}
	return nil
}

// -----------------------------------------------------------------------------
// Update Cadete
// -----------------------------------------------------------------------------

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

	// Obtener la guía actual
	waybillIn, err := s.userRepository.GetWaybill("", waybillObjID)
	if err != nil {
		return fmt.Errorf("error getting waybill: %w", err)
	}

	// Sobrescribir el campo CadeteId con el nuevo
	waybillIn.CadeteId = waybill.CadeteId
	waybillIn.UpdatedAt = time.Now().UTC()

	// Guardar los cambios en BD
	if err := s.userRepository.UpdateWaybill(waybillObjID, &waybillIn); err != nil {
		return fmt.Errorf("failed to update cadete assignment: %w", err)
	}

	// Obtener datos del usuario/cadete para notificarlo
	user, err := s.userRepository.GetUserByID(waybill.CadeteId)
	if err != nil {
		return fmt.Errorf("error retrieving cadete user: %w", err)
	}

	htmlContent := fmt.Sprintf(`
		<html><head></head><body>
		<p>Se te ha asignado una nueva guía de envío (#%s).</p>
		<p>Por favor, revisá tu panel para más detalles.</p>
		</body></html>
	`, waybillID)

	if err := s.userRepository.Email(user.Email, user.Name, "Nueva asignación de envío", htmlContent); err != nil {
		log.Printf("Error al enviar correo de asignación: %v\n", err)
	}

	return nil
}

// -----------------------------------------------------------------------------
// Métricas
// -----------------------------------------------------------------------------

func (s *WaybillServiceImpl) GetCountWithdrawalDate(fechaminimaStr string) ([]map[string]interface{}, error) {
	return s.userRepository.GetCountWithdrawalDate(fechaminimaStr)
}
