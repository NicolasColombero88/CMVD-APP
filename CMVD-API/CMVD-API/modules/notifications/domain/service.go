package domain

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserService interface {
    TokenNotification(notification NotificationToken,tokenClaims interface{}) (primitive.ObjectID, error)
    NotificationPush(Message Message,tokenClaims interface{}) (primitive.ObjectID, error)
    GetAllNotifications(companyId string, role string, search string, tokenClaims interface{}) ([]Message, error)
    GetUnreadCount(tokenClaims interface{}) (NotificationsCount, error)
    MarkAllAsRead(tokenClaims interface{}) (NotificationsCount, error)      
}
