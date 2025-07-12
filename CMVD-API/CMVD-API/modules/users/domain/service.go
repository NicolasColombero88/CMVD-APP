package domain

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserService interface {
    CreateUser(user CreateUser,tokenClaims interface{}) (primitive.ObjectID, error)
    GetAllUsers(companyID string,role string,search string,page int, limit int) ([]User, int, int, error)
    UpdateUser(id primitive.ObjectID, user UpdateUser,tokenClaims interface{}) error
    GetUser(userID primitive.ObjectID,tokenClaims interface{}) (User, error)
    GetUserEmail(email string,tokenClaims interface{}) (User, error)
    UpdatePassword(user UpdatePassword,tokenClaims interface{}) error
    DeleteUser(userID primitive.ObjectID,tokenClaims interface{}) error
    GetAllUsersToken(roles []string) ([]UserNotificationTokens, error)  
    UpdateAccount(user UpdateAccount,tokenClaims interface{}) (primitive.ObjectID, error)
}
