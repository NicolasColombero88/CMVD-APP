// auth/adapter/persistence/repository.go
package persistence

import (
    "api/modules/shared/adapter/persistence"
    "context"
    "api/modules/notifications/domain"
    "go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/bson"
    "time"
    "fmt"
    "go.mongodb.org/mongo-driver/mongo/options"
    "go.mongodb.org/mongo-driver/mongo"
     expo "github.com/oliveroneill/exponent-server-sdk-golang/sdk"

)

type Repository struct {
    database *persistence.Database
}

func NewRepository() (*Repository, error) {
    db, err := persistence.NewDatabase()
    if err != nil {
        return nil, err
    }
    return &Repository{database: db}, nil
}
func (r *Repository) AddNotificationToken(userID primitive.ObjectID, token domain.NotificationToken) error {
    usersCollection := r.database.GetCollection("users")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    filter := bson.M{"_id": userID}
    var user domain.UserToken
    if err := usersCollection.FindOne(ctx, filter).Decode(&user); err != nil {
        return err
    }
    for _, existingToken := range user.NotificationTokens {
        if existingToken.Token == token.Token {
            return nil 
        }
    }
    threeDaysAgo := time.Now().Add(-72 * time.Hour)
    var validTokens []domain.NotificationToken
    for _, existingToken := range user.NotificationTokens {
        if existingToken.CreatedAt.After(threeDaysAgo) {
            validTokens = append(validTokens, existingToken) 
        }
    }
    validTokens = append(validTokens, token)
    update := bson.M{
        "$set": bson.M{"notification_tokens": validTokens},
    }

    _, err := usersCollection.UpdateOne(ctx, filter, update)
    return err
}
func (r *Repository) NotificationPush(message domain.Message) error {
    notificationsCollection := r.database.GetCollection("notifications")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    _, err := notificationsCollection.InsertOne(ctx, message)
    return err
}
func (r *Repository) PushMovil(token string, message domain.Message) error {
    data := make(map[string]string)
    for key, value := range message.Data {
        data[key] = value
    }
    pushToken, err := expo.NewExponentPushToken(token)
    if err != nil {
        panic(err)
    }
    client := expo.NewPushClient(nil)
    response, err := client.Publish(
        &expo.PushMessage{
            To: []expo.ExponentPushToken{pushToken},
            Body:     message.Body,
            Data:     data,   
            Title:    message.Title,
            Priority: expo.DefaultPriority,
        },
    )
    
    // Check errors
    if err != nil {
        panic(err)
    }
    
    // Validate responses
    if response.ValidateResponse() != nil {
        return response.ValidateResponse()
    }
   
    return nil
}
func (r *Repository) GetAllNotifications(companyID string, userID string, role string, search string) ([]domain.Message, error) {
    notificationsCollection := r.database.GetCollection("notifications")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    fmt.Println(companyID + userID + search)
    filter := bson.M{
        "roles": role,
    }
    opts := options.Find().SetSort(bson.D{{Key: "_id", Value: -1}})
    cursor, err := notificationsCollection.Find(ctx, filter, opts)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    var notifications []domain.Message
    for cursor.Next(ctx) {
        var notification domain.Message
        if err := cursor.Decode(&notification); err != nil {
            return nil, err
        }
        notifications = append(notifications, notification)
    }

    return notifications, nil
}
func (r *Repository) UpdateUnreadNotificationsCount(userID primitive.ObjectID, tipo int) error {
    usersCollection := r.database.GetCollection("users")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    var newCount int
    if tipo == 1 {
        var user domain.NotificationsCount
        if err := usersCollection.FindOne(ctx, bson.M{"_id": userID}).Decode(&user); err != nil {
            return err
        }
        newCount = user.UnreadNotificationsCount + 1
    } else {
        newCount = 0
    }
    update := bson.M{
        "$set": bson.M{"unread_notifications_count": newCount},
    }

    _, err := usersCollection.UpdateOne(ctx, bson.M{"_id": userID}, update)
    return err
}
func (r *Repository) GetUnreadCount(userID primitive.ObjectID) (domain.NotificationsCount, error) {
    usersCollection := r.database.GetCollection("users")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    var user domain.NotificationsCount
    // Intenta encontrar al usuario en la colección
    err := usersCollection.FindOne(ctx, bson.M{"_id": userID}).Decode(&user)
    if err != nil {
        // Si no se encuentra al usuario, retornar un error significativo
        if err == mongo.ErrNoDocuments {
            return domain.NotificationsCount{}, fmt.Errorf("usuario no encontrado con ID: %v", userID.Hex())
        }
        return domain.NotificationsCount{}, fmt.Errorf("error al obtener el conteo de notificaciones no leídas: %v", err)
    }
    if user.UnreadNotificationsCount < 0 {
        return domain.NotificationsCount{}, fmt.Errorf("el conteo de notificaciones no leídas no puede ser negativo")
    }

    return user, nil
}
