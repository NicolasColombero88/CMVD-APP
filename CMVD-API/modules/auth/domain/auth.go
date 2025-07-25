package domain

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
	"time"
	"fmt"
	"math/rand"
)

type SignUpInput struct {
	Email    string `json:"email" bson:"email" binding:"required"`
	Password string `json:"password" bson:"password" binding:"required"`
}
type RecoveryInput struct {
	Email    string `json:"email" bson:"email" binding:"required"`
}

type User struct {
	ID        primitive.ObjectID `json:"id" bson:"_id"`
	CompanyId string             `json:"companyId,omitempty" bson:"companyId,omitempty"`
	Name      string             `json:"name" bson:"name"`
	Email     string             `json:"email" bson:"email"`
	Password  string             `json:"password" bson:"password"`
	Role      string             `json:"role" bson:"role"`
	Phone     string             `json:"phone" bson:"phone"`
	Whatsapp  string             `json:"whatsapp" bson:"whatsapp"`
	Age       int                `json:"age" bson:"age"`
	Address   Address            `json:"address" bson:"address"`
	Status    string             `json:"status" bson:"status"`
	NotificationTokens []NotificationToken `json:"notification_tokens" bson:"notification_tokens"`
	UnreadNotificationsCount int               `json:"unread_notifications_count" bson:"unread_notifications_count"`
	RecoveryPin     string     `json:"recovery_pin" bson:"recovery_pin"`
    RecoveryDate    time.Time  `json:"recovery_date" bson:"recovery_date"`
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}

func UserAuth(user User) map[string]interface{} {
	authData := map[string]interface{}{
		"id":        user.ID,
		"companyId": user.CompanyId,
		"name":      user.Name,
		"email":     user.Email,
		"role":      user.Role,
	}
	return authData
}

type Address struct {
	State       string `json:"state" bson:"state"`
	City        string `json:"city" bson:"city"`
	Neighborhood string `json:"neighborhood" bson:"neighborhood"`
	Street      string `json:"street" bson:"street"`
	Postcode    string `json:"postcode" bson:"postcode"`
}

type Branch struct {
	ID      primitive.ObjectID `json:"id" bson:"_id"`
	Name    string             `json:"name" bson:"name"`
	Address Address            `json:"address" bson:"address"`
	State   string             `json:"state" bson:"state"`
}

type UserProfile struct {
	Name            string   `json:"name" bson:"name"`
	UserName        string   `json:"user_name" bson:"user_name"`
	UserID          string   `json:"user_id" bson:"user_id"`
	Email           string   `json:"email" bson:"email"`
	Phone           string   `json:"phone" bson:"phone"`
	Whatsapp        string   `json:"whatsapp" bson:"whatsapp"`
	Password        string   `json:"password" bson:"password"`
	ConfirmPassword string   `json:"confirm_password" bson:"confirm_password"`
	Status          string   `json:"status" bson:"status"`
	Branches        []Branch `json:"branches" bson:"branches"`
	Address         Address  `json:"address" bson:"address"`
}
type UserPin struct {
   	RecoveryPin     string     `json:"recovery_pin" bson:"recovery_pin"`
    RecoveryDate    time.Time  `json:"recovery_date" bson:"recovery_date"`
}
type RecoveryPassword struct {
 Password        string   `json:"password" bson:"password"`
 RecoveryPin     string     `json:"recovery_pin" bson:"recovery_pin"`
 UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}
type UserPassword struct {
	RecoveryPin     string     `json:"recovery_pin" bson:"recovery_pin"`
	Email     string             `json:"email" bson:"email"`
	Password        string   `json:"password" bson:"password"`
}
type NotificationToken struct {
	ID        primitive.ObjectID `json:"id" bson:"_id"`
	Token     string             `json:"token" bson:"token"`
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
}

type Company struct {
	ID        primitive.ObjectID `json:"id" bson:"_id"`
	UserId    primitive.ObjectID `json:"user_id" bson:"user_id"`
	UserName  string             `json:"user_name" bson:"user_name"`
	Name      string             `json:"name" bson:"name"`
	Email     string             `json:"email" bson:"email"`
	Phone     string             `json:"phone" bson:"phone"`
	Whatsapp  string             `json:"whatsapp" bson:"whatsapp"`
	Status    string             `json:"status" bson:"status"`
	Branches  []Branch           `json:"branches" bson:"branches"`
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}
func SetRecovery() UserPin {
	rand.Seed(time.Now().UnixNano())
	randomPin := fmt.Sprintf("%05d", rand.Intn(100000))
	return UserPin{
		RecoveryPin:  randomPin,
		RecoveryDate: time.Now(),
	}
}
func SetRecoveryPassword(recovery UserPassword) RecoveryPassword {
	date := time.Now()
	return RecoveryPassword{
		Password:  recovery.Password,
		RecoveryPin:"",
		UpdatedAt: date,
	}
}
func Register(newUser UserProfile) (*User, *Company, error) {
	date := time.Now()
	userId := primitive.NewObjectID()
	companyId := primitive.NewObjectID()
	user := User{
		ID:        userId,
		CompanyId: companyId.Hex(), 
		Name:      newUser.UserName,
		Email:     newUser.Email,
		Password:  newUser.Password,
		Role:      "Cliente",
		Phone:     newUser.Phone,
		Whatsapp:  newUser.Whatsapp,
		Age:       0,
		Address:   newUser.Address,
		Status:    "activo",
		CreatedAt: date,
		UpdatedAt: date,
	}
	for i := range newUser.Branches {
		newUser.Branches[i].ID = primitive.NewObjectID()
	}
	company := Company{
		ID:        companyId,
		UserId:    userId,
		UserName:  newUser.UserName,
		Name:      newUser.Name,
		Email:     newUser.Email,
		Phone:     newUser.Phone,
		Whatsapp:  newUser.Phone, 
		Status:    "activo",
		Branches:  newUser.Branches,
		CreatedAt: date,
		UpdatedAt: date,
	}

	return &user, &company, nil
}
