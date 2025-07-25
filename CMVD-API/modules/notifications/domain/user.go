package domain
import (
    "time"
    "go.mongodb.org/mongo-driver/bson/primitive"
)
const (
    AdminRole      = "Admin"
    SuperAdminRole = "Super Admin"
    ClientRole     = "Client"
    DeliveryDriver     = "Delivery Driver"
)
type UserToken struct { 
    NotificationTokens []NotificationToken `json:"notification_tokens" bson:"notification_tokens"`
}

type NotificationToken struct {
    ID        primitive.ObjectID `json:"id" bson:"_id"`
    Token     string             `json:"token" bson:"token"`
    CreatedAt time.Time          `json:"created_at" bson:"created_at"`
}

type Message struct {
    ID           primitive.ObjectID `json:"id" bson:"_id"`
    Title        string             `json:"title" bson:"title"`
    Body         string             `json:"body" bson:"body"`
    Data         map[string]string `json:"data" bson:"data"` 
    Icon         string             `json:"icon" bson:"icon"`
    Type         string             `json:"type" bson:"type"`
    NotifiableId string             `json:"notifiable_id" bson:"notifiable_id"`
    Recipients   []primitive.ObjectID  `json:"recipients" bson:"recipients"`
    Roles        []string           `json:"roles" bson:"roles"`
    SeenBy       []primitive.ObjectID `json:"seen_by" bson:"seen_by"`
    TotalRecipients int                 `json:"total_recipients" bson:"total_recipients"`
    UnreadCount    int                  `json:"unread_count" bson:"unread_count"`
    CreatedAt    time.Time          `json:"created_at" bson:"created_at"`
    UpdatedAt    time.Time          `json:"updated_at" bson:"updated_at"`
}
type NotificationsCount struct {
    UnreadNotificationsCount int               `json:"unread_notifications_count" bson:"unread_notifications_count"`
}
func SetTokenNotification(notificationToken *NotificationToken) (*NotificationToken, error) {
    date := time.Now()
    id := primitive.NewObjectID()
    newNotificationToken := &NotificationToken{
        ID:        id,
        Token:     notificationToken.Token,
        CreatedAt: date,
    }
    return newNotificationToken, nil
}

func SetMessage(message *Message) (*Message, error) {
    date := time.Now()
    id := primitive.NewObjectID()
    newMessage := &Message{
        ID:           id,
        Title:        message.Title,
        Body:         message.Body,
        Data:         message.Data,
        Icon:         "new",
        Type:         "push",
        NotifiableId: "orders",
        Roles:        message.Roles,
        CreatedAt:    date,
        UpdatedAt:    date,
    }
    return newMessage, nil
}
