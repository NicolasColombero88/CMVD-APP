package service

import (
    "log"
    "api/modules/calculate/adapter/persistence"
    "api/modules/calculate/domain"
    "api/modules/companies/service" 
    "go.mongodb.org/mongo-driver/bson/primitive"
    ShippingZonesService"api/modules/shipping-zones/service" 
    "errors"
    "fmt"
    "strings"
)
var companyService = service.NewCompanyService()
var shippingZones = ShippingZonesService.NewUserService()
type CalculateServiceImpl struct {
    calculateRepository *persistence.Repository
}
func NewCalculateService() domain.CalculateService {
    repo, err := persistence.NewRepository()
    if err != nil {
        log.Fatal(err)
    }

    return &CalculateServiceImpl{
        calculateRepository: repo,
    }
}
func (s *CalculateServiceImpl) Calculate(calculate domain.Calculate, tokenClaims interface{}) (interface{}, error) {
    zones, err := shippingZones.GetAllAreas(tokenClaims)
    if err != nil {
        return nil, fmt.Errorf("error al obtener las zonas de envío: %w", err)
    }

    var selectedPrice float64
    var selectedShippingMethod string

    for _, zone := range zones {
        if strings.ToLower(zone.City) == strings.ToLower(calculate.RecipientCity) &&
            strings.ToLower(zone.Neighborhood) == strings.ToLower(calculate.RecipientNeighborhood) {
            selectedPrice = zone.Price
            selectedShippingMethod = zone.Name
            break
        }
    }

    if selectedPrice == 0 {
        return nil, errors.New("no matching shipping zone found")
    }

    if calculate.CompanyId != "" {
        companyId, err := primitive.ObjectIDFromHex(calculate.CompanyId)
        if err != nil {
            return nil, fmt.Errorf("error converting companyId to ObjectID: %w", err)
        }

        price, err := s.calculateRepository.GetPrice(companyId)
        if err != nil {
            return nil, fmt.Errorf("error fetching company price: %w", err)
        }

        if price > 0 {
            result := domain.Result{
                Price:          price,
                ShippingZone:   selectedShippingMethod,
            }
            return result, nil
        }
    }

    result := domain.Result{
        Price:          selectedPrice,
        ShippingZone:   selectedShippingMethod,
    }

    return result, nil
}



