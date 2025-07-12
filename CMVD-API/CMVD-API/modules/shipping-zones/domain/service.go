package domain
import (
    "go.mongodb.org/mongo-driver/bson/primitive"
  
)
type UserService interface {
    CreateShippingZone(branch SetShippingZone, tokenClaims interface{}) (primitive.ObjectID, error)
    UpdateShippingZones(branch SetShippingZone2, shippingZoneID string, tokenClaims interface{}) error
    GetShippingZone(shippingZoneId primitive.ObjectID,tokenClaims interface{}) (ShippingZone, error)
    GetAllShippingZones(search string, page int, limit int,tokenClaims interface{}) ([]ShippingZone, int, int, error)
    GetAllAreas(tokenClaims interface{}) ([]ShippingZoneNeighborhood,error)
    DeleteShippingZones(shippingZoneID string,tokenClaims interface{}) error
}
