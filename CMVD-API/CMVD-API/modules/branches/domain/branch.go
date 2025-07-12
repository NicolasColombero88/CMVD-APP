package domain

import (
    "time"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "reflect"
)

type ShippingZone struct {
    Name  string
    Rate  float64
    State string `json:"state" bson:"state"`
    CreatedAt time.Time `json:"created_at" bson:"created_at"`
    UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}

type Address struct {
    City         string `json:"city" bson:"city"`
    Neighborhood string `json:"neighborhood" bson:"neighborhood"`
    Street       string `json:"street" bson:"street"`
    Pincode      int    `json:"pincode" bson:"pincode"`
    CreatedAt    time.Time `json:"created_at" bson:"created_at"`
    UpdatedAt    time.Time `json:"updated_at" bson:"updated_at"`
}

type Branch struct {
    ID           primitive.ObjectID `json:"id" bson:"_id"`
    Name         string             `json:"name" bson:"name"`
    Address      Address           `json:"address" bson:"address"`
    ShippingZones []ShippingZone   `json:"shippingZones" bson:"shippingZones"`
    State        string            `json:"state" bson:"state"`
    CreatedAt    time.Time          `json:"created_at" bson:"created_at"`
    UpdatedAt    time.Time          `json:"updated_at" bson:"updated_at"`
    
}

type Company struct {
    ID        primitive.ObjectID `json:"id" bson:"_id"`
    UserId    primitive.ObjectID `json:"user_id" bson:"user_id"`
    Name      string             `json:"name" bson:"name"`
    Email     string             `json:"email" bson:"email"`
    Phone     string             `json:"phone" bson:"phone"`
    Whatsapp  string             `json:"whatsapp" bson:"whatsapp"`
    Status    string             `json:"status" bson:"status"`
    CreatedAt time.Time          `json:"created_at" bson:"created_at"`
    UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}
type CreateBranch struct {
    CompanyId string             `json:"companyId,omitempty" bson:"companyId,omitempty"`
    Name      string             `json:"name" bson:"name"`
    Address   Address            `json:"address" bson:"address"`
    Status    string             `json:"status" bson:"status"`
    CreatedAt time.Time          `json:"created_at" bson:"created_at"`
    UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}
type SetBranch struct {
    Name      *string             `json:"name" bson:"name"`
    Address   *Address            `json:"address" bson:"address"`
    Status    *string             `json:"status" bson:"status"`
    CreatedAt time.Time          `json:"created_at" bson:"created_at"`
    UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}
func CreateNewBranch(newBranch CreateBranch) (*Branch, error) {
    date := time.Now()
    id := primitive.NewObjectID()
    branch := Branch{
        ID:        id,
        Name:      newBranch.Name,
        Address:   newBranch.Address,
        State:     newBranch.Status, 
        CreatedAt: date,
        UpdatedAt: date,
    }
    return &branch, nil
}
func SetUpdateBranch(newBranch SetBranch) (map[string]interface{}, error) {
    date := time.Now()
    newUpdatedBranch := make(map[string]interface{})
    targetType := reflect.TypeOf(struct {
        Name         *string  `json:"name" bson:"name"`
        Address      *Address `json:"address" bson:"address"`
        State        *string  `json:"state" bson:"state"`
        UpdatedAt    *time.Time `json:"updated_at" bson:"updated_at"`
    }{})
    for i := 0; i < targetType.NumField(); i++ {
        targetField := targetType.Field(i)
        fieldName := targetField.Tag.Get("json") // Obtener el nombre del campo según la etiqueta json
        value := reflect.ValueOf(newBranch).FieldByName(targetField.Name) // Usar el nombre del campo del struct original
        if value.IsValid() && value.Kind() == reflect.Ptr && !value.IsNil() {
            newUpdatedBranch[fieldName] = value.Elem().Interface() // Usar el nombre del campo en minúscula
        }
    }
    newUpdatedBranch["updated_at"] = date // Usar el nombre del campo en minúscula
    return newUpdatedBranch, nil
}



