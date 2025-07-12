package domain

import (
    "time"
    "go.mongodb.org/mongo-driver/bson/primitive"
	"reflect"
    "errors"
)
const (
    AdminRole      = "Admin"
    SuperAdminRole = "Super Admin"
    ClientRole     = "Cliente"
    DeliveryDriver     = "Cadete"
)
type Address struct {
    State        string `json:"state" bson:"state"`
    City         string `json:"city" bson:"city"`
    Neighborhood string `json:"neighborhood" bson:"neighborhood"`
    Address      string `json:"address" bson:"address"`
    Pincode      int    `json:"pincode" bson:"pincode"`
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
    CreatedAt time.Time          `json:"created_at" bson:"created_at"`
    UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}

type UserLogin struct {
    Email    string `json:"email" binding:"required"`
    Password string `json:"password" binding:"required"`
}
type NotificationToken struct {
    ID        primitive.ObjectID `json:"id" bson:"_id"`
    Token     string `json:"token" bson:"token"`
    CreatedAt time.Time `json:"created_at" bson:"created_at"`
}
type UserNotificationTokens struct {
    UserId  primitive.ObjectID `json:"user_id" bson:"user_id"`
    Tokens  NotificationToken `json:"tokens" bson:"tokens"`
}

type CreateUser struct {
    CompanyId string   `json:"companyId,omitempty" bson:"companyId,omitempty"`
    Name      string   `json:"name" bson:"name"`
    Email     string   `json:"email" bson:"email"`
    Password  string   `json:"password" bson:"password"`
    Role      string   `json:"role" bson:"role"`
    Phone     string   `json:"phone" bson:"phone"`
    Whatsapp  string   `json:"whatsapp,omitempty" bson:"whatsapp,omitempty"`
    Age       int      `json:"age,omitempty" bson:"age,omitempty"`
    Address   Address  `json:"address" bson:"address"`
    Status    string   `json:"status" bson:"status"`
    CreatedAt time.Time `json:"created_at,omitempty" bson:"created_at,omitempty"`
    UpdatedAt time.Time `json:"updated_at,omitempty" bson:"updated_at,omitempty"`
}
type UpdateUser struct {
    CompanyId string    `json:"companyId,omitempty" bson:"companyId,omitempty"`
	Name      *string   `json:"name,omitempty" bson:"name,omitempty"`
    Email     *string   `json:"email,omitempty" bson:"email,omitempty"`
    Password  *string   `json:"password,omitempty" bson:"password,omitempty"`
    Role      *string   `json:"role,omitempty" bson:"role,omitempty"`
    Phone     *string   `json:"phone,omitempty" bson:"phone,omitempty"`
    Whatsapp  *string   `json:"whatsapp,omitempty" bson:"whatsapp,omitempty"`
    Age       *int      `json:"age,omitempty" bson:"age,omitempty"`
    Address   *Address  `json:"address,omitempty" bson:"address,omitempty"`
    Status    *string   `json:"status" bson:"status"`
    CreatedAt time.Time `json:"created_at,omitempty" bson:"created_at,omitempty"`
    UpdatedAt time.Time `json:"updated_at,omitempty" bson:"updated_at,omitempty"`
}
type UpdatePassword struct {
    Password  string   `json:"password" bson:"password"`
    CurrentPassword  *string    `json:"current_password,omitempty" bson:"current_password,omitempty"`
    UpdatedAt time.Time `json:"updated_at,omitempty" bson:"updated_at,omitempty"`
}
type UpdateAccount struct {
  Name        string   `json:"name,omitempty" bson:"name,omitempty"`
  Email       string   `json:"email,omitempty" bson:"email,omitempty"`
  Phone     string   `json:"phone,omitempty" bson:"phone,omitempty"`
  CompanyName string   `json:"company_name" bson:"company_name"`
}
type Company struct {
    Name      string             `json:"name" bson:"name"`
    UserName  string  `json:"user_name" bson:"user_name"`
    Email     string             `json:"email" bson:"email"`
    Phone     string             `json:"phone" bson:"phone"`
    Whatsapp  string             `json:"whatsapp" bson:"whatsapp"`
    UpdatedAt time.Time `json:"updated_at,omitempty" bson:"updated_at,omitempty"`
}
func SetUpdateUser(updatedUser UpdateUser) *User {
    date := time.Now()
    updated := User{
        UpdatedAt: date,
    }
    updatedUserValue := reflect.ValueOf(updatedUser)
    updatedValue := reflect.ValueOf(&updated).Elem()
    for i := 0; i < updatedUserValue.NumField(); i++ {
        field := updatedUserValue.Field(i)
        if field.IsNil() {
            continue
        }
        updatedField := updatedValue.Field(i)
        updatedField.Set(field.Elem())
    }
    return &updated
}
func ValidateUserRole(creatorRole, newUserRole string, companyId string) error {
    if creatorRole == SuperAdminRole {
        return nil
    }
    if creatorRole == AdminRole {
        if newUserRole == SuperAdminRole {
            return errors.New("Admins no pueden crear Super Admins")
        }
        return nil 
    }
    return errors.New("Solo Admins o SuperAdmins pueden crear usuarios")
}


func SetCreateUser(newUser CreateUser,creatorUserRole string) (*User, error) {
    date := time.Now()
    if err := ValidateUserRole(creatorUserRole,newUser.Role, newUser.CompanyId); err != nil {
        return nil, err
    }
   
    user := User{
		ID:        primitive.NewObjectID(),
        CompanyId:  newUser.CompanyId,
        Name:      newUser.Name,
        Email:     newUser.Email,
        Password:  newUser.Password,
        Role:      newUser.Role,
        Phone:     newUser.Phone,
        Whatsapp:  newUser.Whatsapp,
        Age:       newUser.Age,
        Address:   newUser.Address,
        Status:    newUser.Status,
        CreatedAt: date,
        UpdatedAt: date,
    }
    return &user, nil
}

type UserResponse struct {
    ID        primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
    CompanyId string             `json:"companyId,omitempty" bson:"companyId,omitempty"`
    Name      string             `json:"name,omitempty" bson:"name,omitempty"`
    Email     string             `json:"email,omitempty" bson:"email,omitempty"`
    Role      string             `json:"role,omitempty" bson:"role,omitempty"`
    Phone     string             `json:"phone" bson:"phone"`
    Whatsapp  string             `json:"whatsapp" bson:"whatsapp"`
    Age       int                `json:"age" bson:"age"`
    Status    string             `json:"status" bson:"status"`
    CreatedAt time.Time          `json:"created_at" bson:"created_at"`
    UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}
func FilteredResponse(user *User) UserResponse {
    return UserResponse{
        ID:        user.ID,
        Name:      user.Name,
        Email:     user.Email,
        Role:      user.Role,
        Phone:     user.Phone,
        Whatsapp:  user.Whatsapp,
        Age:       user.Age,
        Status:    user.Status,
        CreatedAt: user.CreatedAt,
        UpdatedAt: user.UpdatedAt,
    }
}
func SetUpdatePassword(newUpdatePassword UpdatePassword) UpdatePassword {
    date := time.Now()
    update := UpdatePassword{
        Password:   newUpdatePassword.Password,
        UpdatedAt:  date,
    }
    return update
}
func SetUpdateAccount(updateAccount UpdateAccount) UpdateUser {
    date := time.Now()
    user := UpdateUser{
        Name:      &updateAccount.Name,
        Email:     &updateAccount.Email,
        Phone:     &updateAccount.Phone,
        Whatsapp:  &updateAccount.Phone,
        UpdatedAt: date,
    }
    return user
}
func SetCompany(company UpdateAccount) Company {
    date := time.Now()
    update := Company{
        Name:      company.CompanyName,
        UserName:     company.Name,
        Email: company.Email,
        Phone:  company.Phone,
        Whatsapp:  company.Phone,
        UpdatedAt:  date,
    }
    return update
}