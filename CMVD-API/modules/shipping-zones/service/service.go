package service

import (
    "log"
    "api/modules/shipping-zones/adapter/persistence"
    "api/modules/shipping-zones/domain"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "errors"
	"fmt"
)

type CompanyServiceImpl struct {
    companyRepository *persistence.Repository
}

func NewUserService() domain.UserService {
    repo, err := persistence.NewRepository()
    if err != nil {
        log.Fatal(err)
    }

    return &CompanyServiceImpl{
        companyRepository: repo,
    }
}

func (s *CompanyServiceImpl) CreateShippingZone(createShippingZone domain.SetShippingZone,  tokenClaims interface{})(primitive.ObjectID, error) {
	branchDocument, err := domain.CreateNewShippingZone(createShippingZone)
    if err != nil {
        return primitive.NilObjectID, err
    }
    claims, ok := tokenClaims.(map[string]interface{})
    if !ok {
        return primitive.NilObjectID, errors.New("invalid tokenClaims format")
    }
    userRole, ok := claims["role"].(string)
    if !ok {
        return primitive.NilObjectID, errors.New("role not found in tokenClaims")
    }
    if userRole != "Admin" && userRole != "Super Admin" {
        return primitive.NilObjectID, errors.New("user does not have the required permissions")
    }
    resp, err := s.companyRepository.InsertShippingZone(branchDocument)
    if err != nil {
        return primitive.NilObjectID, err
    }
    return resp, nil
}
func (s *CompanyServiceImpl) UpdateShippingZones(createShippingZone domain.SetShippingZone2, shippingZoneID string, tokenClaims interface{}) error {
	ShippingZonesDocument, err := domain.UpdateShippingZone(createShippingZone)
	if err != nil {
		return err
	}
	var shippingZoneId primitive.ObjectID
	_, ok := tokenClaims.(map[string]interface{})["role"].(string)
	if !ok {
		return errors.New("userRol not found in tokenClaims")
	}
	shippingZoneId, err = primitive.ObjectIDFromHex(shippingZoneID)
	if err != nil {
		return err
	}

	return s.companyRepository.UpdateShippingZones( shippingZoneId,ShippingZonesDocument)
}


func (s *CompanyServiceImpl) GetAllShippingZones(search string, page int, limit int,tokenClaims interface{}) ([]domain.ShippingZone, int, int, error) {
    _, ok := tokenClaims.(map[string]interface{})["role"].(string)
    if !ok {
        return []domain.ShippingZone{}, 0, 0, errors.New("userRol not found in tokenClaims")
    }

    shippingZone, totalPages, total, err := s.companyRepository.GetAllShippingZones(search, page, limit)
    if err != nil {
        return []domain.ShippingZone{}, 0, 0, err
    }

    return shippingZone, totalPages, total, nil
}

func (s *CompanyServiceImpl) DeleteShippingZones(shippingZoneID string, tokenClaims interface{}) error {

    var shippingZoneID2 primitive.ObjectID
    claimsMap, ok := tokenClaims.(map[string]interface{})
    if !ok {
        return errors.New("tokenClaims debe ser un map[string]interface{}")
    }
    userRole, ok := claimsMap["role"].(string)
    if !ok || userRole == "" {
        return errors.New("userRole no encontrado o vacío en tokenClaims")
    }
    var err error
    shippingZoneID2, err = primitive.ObjectIDFromHex(shippingZoneID)
    if err != nil {
        return fmt.Errorf("ID no válido: %w", err)
    }
    return s.companyRepository.DeleteShippingZones(shippingZoneID2)
}

func (s *CompanyServiceImpl) GetShippingZone(shippingZoneId primitive.ObjectID,tokenClaims interface{}) (domain.ShippingZone, error){
    shippingZone, err :=s.companyRepository.GetShippingZone(shippingZoneId)
    if err != nil {
        return domain.ShippingZone{}, err
    }
    return shippingZone, nil
}
func (s *CompanyServiceImpl) GetAllAreas(tokenClaims interface{}) ([]domain.ShippingZoneNeighborhood, error){
    areas, err :=s.companyRepository.GetAllAreas()
    if err != nil {
        return []domain.ShippingZoneNeighborhood{}, err
    }
    return areas, nil
}

