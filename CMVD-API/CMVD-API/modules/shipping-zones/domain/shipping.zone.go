package domain

import (
    "time"
    "go.mongodb.org/mongo-driver/bson/primitive"
)
type ShippingZone struct {
    ID        primitive.ObjectID `json:"id" bson:"_id"`
    Name      string `json:"name" bson:"name"`
    Price      float64 `json:"price" bson:"price"`
    Status    string             `json:"status" bson:"status"`
    Areas     []Area `json:"areas" bson:"areas"`
    CreatedAt time.Time `json:"created_at" bson:"created_at"`
    UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}
type Area struct {
    ID        primitive.ObjectID `json:"id" bson:"_id"`
    City         string `json:"city" bson:"city"`
    Neighborhood string `json:"neighborhood" bson:"neighborhood"`
    Pincode      string    `json:"pincode" bson:"pincode"`
    Price         float64 `json:"price" bson:"price"`
    State string `json:"state" bson:"state"`
    CreatedAt time.Time `json:"created_at" bson:"created_at"`
    UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}
type UpdataShippingZone2 struct {
    Name      string `json:"name" bson:"name"`
    Price      float64 `json:"price" bson:"price"`
    Status      string `json:"status" bson:"status"`
    Areas     []Area `json:"areas" bson:"areas"`
    UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}

type ResultShippingZone struct {
    ID        primitive.ObjectID `json:"id" bson:"_id"`
    BranchId  string             `json:"branchId" bson:"branchId"`
    Name         string `json:"name" bson:"name"`
    City         string `json:"city" bson:"city"`
    Neighborhood string `json:"neighborhood" bson:"neighborhood"`
    Street       string `json:"street" bson:"street"`
    Pincode      int    `json:"pincode" bson:"pincode"`
    Rate         float64 `json:"rate" bson:"rate"`
    State string `json:"state" bson:"state"`
    CreatedAt time.Time `json:"created_at" bson:"created_at"`
    UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}
type CreateShippingZone struct {
    Name  string
    Rate  float64   `json:"rate" bson:"rate"`
    City         string `json:"city" bson:"city"`
    Neighborhood string `json:"neighborhood" bson:"neighborhood"`
    Street       string `json:"street" bson:"street"`
    Pincode      int    `json:"pincode" bson:"pincode"`
    State string `json:"state" bson:"state"`
    CreatedAt time.Time `json:"created_at" bson:"created_at"`
    UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}

type SetShippingZone struct {
    Name      string `json:"name" bson:"name"`
    Price      float64 `json:"price" bson:"price"`
    Status      string `json:"status" bson:"status"`
    Areas     []Area `json:"areas" bson:"areas"`
}
type SetShippingZone2 struct {
    Name      string `json:"name" bson:"name"`
    Price      float64 `json:"price" bson:"price"`
    Status      string `json:"status" bson:"status"`
    Areas     []Area `json:"areas" bson:"areas"`
}
type ShippingZoneNeighborhood struct {
    Name      string `json:"name" bson:"name"`
    Price      float64 `json:"price" bson:"price"`
    Status      string `json:"status" bson:"status"`
    City         string `json:"city" bson:"city"`
    Neighborhood string `json:"neighborhood" bson:"neighborhood"`
    Pincode      string    `json:"pincode" bson:"pincode"`
}
func CreateNewShippingZone(newShippingZone SetShippingZone) (*ShippingZone, error) {
    date := time.Now()
    id := primitive.NewObjectID()
    for i := range newShippingZone.Areas {
        newShippingZone.Areas[i].ID = primitive.NewObjectID()
    }
    shippingZone := ShippingZone{
        ID:        id,
        Name:      newShippingZone.Name,
        Price:      newShippingZone.Price, 
        Status:     newShippingZone.Status,
        Areas:     newShippingZone.Areas,
        CreatedAt: date,
        UpdatedAt: date,
    }
    return &shippingZone, nil
}
func UpdateShippingZone(newShippingZone SetShippingZone2) (*UpdataShippingZone2, error) {
    date := time.Now()
    for i := range newShippingZone.Areas {
        if newShippingZone.Areas[i].ID.IsZero() { 
            newShippingZone.Areas[i].ID = primitive.NewObjectID()
        }
    }
    shippingZone := UpdataShippingZone2{
        Name:      newShippingZone.Name,
        Price:     newShippingZone.Price, 
        Status:    newShippingZone.Status,
        Areas:     newShippingZone.Areas,
        UpdatedAt: date,
    }
    return &shippingZone, nil
}










