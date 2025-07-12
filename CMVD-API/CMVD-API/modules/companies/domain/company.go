package domain

import (
    "time"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

type ShippingZone struct {
    ID        primitive.ObjectID `json:"id" bson:"_id"`
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

type Address struct {
    State         string `json:"state" bson:"state"`
    City         string `json:"city" bson:"city"`
    Neighborhood string `json:"neighborhood" bson:"neighborhood"`
    Street       string `json:"street" bson:"street"`
    Postcode      string    `json:"postcode" bson:"postcode"`
    CreatedAt    time.Time `json:"created_at" bson:"created_at"`
    UpdatedAt    time.Time `json:"updated_at" bson:"updated_at"`
}

type Branch struct {
    ID           primitive.ObjectID `json:"id" bson:"_id"`
    Name         string             `json:"name" bson:"name"`
    Address      Address           `json:"address" bson:"address"`
    ShippingZones []ShippingZone   `json:"shippingZones" bson:"shippingZones"`
    CreatedAt    time.Time          `json:"created_at" bson:"created_at"`
    UpdatedAt    time.Time          `json:"updated_at" bson:"updated_at"`
    State        string            `json:"state" bson:"state"`
}

type Company struct {
    ID        primitive.ObjectID `json:"id" bson:"_id"`
    UserId    primitive.ObjectID `json:"user_id" bson:"user_id"`
    UserName  string  `json:"user_name" bson:"user_name"`
    Name      string             `json:"name" bson:"name"`
    Email     string             `json:"email" bson:"email"`
    Phone     string             `json:"phone" bson:"phone"`
    Whatsapp  string             `json:"whatsapp" bson:"whatsapp"`
    Price     float64           `json:"price" bson:"price"`
    Status    string             `json:"status" bson:"status"`
    Branches  []Branch            `json:"branches" bson:"branches"`
    CreatedAt time.Time          `json:"created_at" bson:"created_at"`
    UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}
type CreateCompany struct {
    ID        primitive.ObjectID `json:"id" bson:"_id"`
    UserId    primitive.ObjectID `json:"user_id" bson:"user_id"`
    UserName  string  `json:"user_name" bson:"user_name"`
    Name      string             `json:"name" bson:"name"`
    Email     string             `json:"email" bson:"email"`
    Phone     string             `json:"phone" bson:"phone"`
    Whatsapp  string             `json:"whatsapp" bson:"whatsapp"`
    Price     float64           `json:"price" bson:"price"`
    Status    string             `json:"status" bson:"status"`
    Branches  []Branch            `json:"branches" bson:"branches"`
    CreatedAt time.Time          `json:"created_at" bson:"created_at"`
    UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}
type SetCompany struct {
    UserId    primitive.ObjectID `json:"user_id" bson:"user_id"`
    Name      string             `json:"name" bson:"name"`
    Email     string             `json:"email" bson:"email"`
    Phone     string             `json:"phone" bson:"phone"`
    Whatsapp  string             `json:"whatsapp" bson:"whatsapp"`
    Price     float64           `json:"price" bson:"price"`
    Status    string             `json:"status" bson:"status"`
    Branches  []Branch     `json:"branches,omitempty" bson:"branches,omitempty"`
    UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}
func CreateNewCompany(newCompany CreateCompany) (*Company, error) {
    date := time.Now()
    id := primitive.NewObjectID()
    for i := range newCompany.Branches {
        newCompany.Branches[i].ID = primitive.NewObjectID()
    }
    company := Company{
        ID:        id,
        UserId:    newCompany.UserId,
        UserName:  newCompany.UserName,
        Name:      newCompany.Name,
        Email:     newCompany.Email,
        Phone:     newCompany.Phone,
        Whatsapp:  newCompany.Whatsapp,
        Status:    newCompany.Status,
        Branches:   newCompany.Branches,
        Price: newCompany.Price,
        CreatedAt: date,
        UpdatedAt: date,
    }
    return &company, nil
}
func UpdateCompany(newCompany CreateCompany) (*SetCompany, error) {
    date := time.Now()
    for i := range newCompany.Branches {
        if newCompany.Branches[i].ID.IsZero() {  
            newCompany.Branches[i].ID = primitive.NewObjectID()
        }
    }
    company := SetCompany{
        UserId:    newCompany.UserId,
        Name:      newCompany.Name,
        Email:     newCompany.Email,
        Phone:     newCompany.Phone,
        Whatsapp:  newCompany.Whatsapp,
        Price:     newCompany.Price,
        Status:    newCompany.Status,
        Branches:   newCompany.Branches,
        UpdatedAt: date,
    }
    return &company, nil
}
func CreateBranches(newBranch Branch) (*Branch, error) {
    date := time.Now()
    id := primitive.NewObjectID()
    branch := Branch{
        ID:        id,
        Name:      newBranch.Name,
        Address:   newBranch.Address,
        CreatedAt:  date,
        UpdatedAt:  date,
    }
    return &branch, nil
}
func UpdateBranches(newBranch Branch) (*Branch, error) {
    date := time.Now()
    id := primitive.NewObjectID()
    branch := Branch{
        ID:        id,
        Name:      newBranch.Name,
        Address:   newBranch.Address,
        UpdatedAt:  date,
    }
    return &branch, nil
}
