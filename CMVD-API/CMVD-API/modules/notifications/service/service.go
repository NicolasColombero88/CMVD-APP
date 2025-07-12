package service

import (
    "log"
    "api/modules/notifications/domain"
    "api/modules/notifications/adapter/persistence"
    "go.mongodb.org/mongo-driver/bson/primitive"
    userServiceTem "api/modules/users/service" 
    "errors"
    "fmt"
)

var userServiceInstance = userServiceTem.NewUserService()
type UserServiceImpl struct {
    userRepository *persistence.Repository
}

func NewUserService() domain.UserService {
    repo, err := persistence.NewRepository()
    if err != nil {
        log.Fatal(err)
    }

    return &UserServiceImpl{
        userRepository: repo,
    }
}

func (s *UserServiceImpl) TokenNotification(notification domain.NotificationToken, tokenClaims interface{}) (primitive.ObjectID, error) {
    userId, ok := tokenClaims.(map[string]interface{})["id"].(string)
    if !ok {
        return primitive.NilObjectID, errors.New("userId not found in tokenClaims")
    }
    id, err := primitive.ObjectIDFromHex(userId)
    if err != nil {
        return primitive.NilObjectID, err
    }
    NotificatioTokenDocument, err := domain.SetTokenNotification(&notification)
    if err != nil {
        return primitive.NilObjectID, err
    }
    err = s.userRepository.AddNotificationToken(id,*NotificatioTokenDocument)
    if err != nil {
        return primitive.NilObjectID, err
    }
    return NotificatioTokenDocument.ID, nil
}
func (s *UserServiceImpl) NotificationPush(message domain.Message, tokenClaims interface{}) (primitive.ObjectID, error) {
    userId, ok := tokenClaims.(map[string]interface{})["id"].(string)
    if !ok {
        return primitive.NilObjectID, errors.New("userId not found in tokenClaims")
    }
    id, err := primitive.ObjectIDFromHex(userId)
    if err != nil {
        return primitive.NilObjectID, err
    }

    notificationMessage, err := domain.SetMessage(&message)
    if err != nil {
        return primitive.NilObjectID, err
    }
    fmt.Println("UserID:", id.Hex())
    err = s.userRepository.NotificationPush(*notificationMessage)
    if err != nil {
        return primitive.NilObjectID, err
    }

    // Cambiar la forma en que se obtienen los tokens
    userNotificationTokens,err := userServiceInstance.GetAllUsersToken(message.Roles)
    if err != nil {
        return primitive.NilObjectID, fmt.Errorf("error al obtener usuarios: %v", err)
    }
    
    // Comprobar si hay tokens disponibles
    if len(userNotificationTokens) == 0 {
        errorMsg := fmt.Sprintf("No hay tokens disponibles para enviar la notificación para los roles: %v", message.Roles)
        return primitive.NilObjectID, errors.New(errorMsg)
    }
    
    for _, userToken := range userNotificationTokens {
        err = s.userRepository.UpdateUnreadNotificationsCount(userToken.UserId, 1)
        if err != nil {
            fmt.Printf("Error al actualizar el contador de notificaciones no leídas para el usuario %s: %v\n", userToken.UserId.Hex(), err)
            return primitive.NilObjectID, err
        }
        err := s.userRepository.PushMovil(userToken.Tokens.Token, *notificationMessage)
        if err != nil {
            fmt.Printf("Error al enviar la notificación al usuario con token %s: %v\n", userToken.Tokens.Token, err)
            return primitive.NilObjectID, err
        }
    }

    return notificationMessage.ID, nil
}

func (s *UserServiceImpl) GetAllNotifications(companyId string, role string, search string, tokenClaims interface{}) ([]domain.Message, error) {
    userId, ok := tokenClaims.(map[string]interface{})["id"].(string)
    if !ok {
        return nil, errors.New("userId not found in tokenClaims")
    }
    userRol, ok := tokenClaims.(map[string]interface{})["role"].(string)
    if !ok {
        return nil, errors.New("role not found in tokenClaims")
    }

    if userRol == "Super Admin" {
        if role == "" {
            role = "Super Admin"
        }
    } else if userRol == "Admin" {
        companyID, ok := tokenClaims.(map[string]interface{})["companyId"].(string)
        if !ok {
            return nil, errors.New("CompanyId not found in tokenClaims")
        }
        companyId = companyID 
    } else if userRol == "Delivery Driver" {
        companyId = ""
    }

    users, err := s.userRepository.GetAllNotifications(companyId, userId, role, search)
    if err != nil {
        return []domain.Message{}, err
    }
    return users, nil
}
func (s *UserServiceImpl) GetUnreadCount(tokenClaims interface{}) (domain.NotificationsCount, error) {
    userId, ok := tokenClaims.(map[string]interface{})["id"].(string)
    if !ok {
        return domain.NotificationsCount{}, errors.New("userId not found in tokenClaims") // Cambiado a un valor vacío
    }
    id, err := primitive.ObjectIDFromHex(userId)
    if err != nil {
        return domain.NotificationsCount{}, err
    }
    users, err := s.userRepository.GetUnreadCount(id)
    if err != nil {
        return domain.NotificationsCount{}, err
    }
    return users, nil
}
func (s *UserServiceImpl) MarkAllAsRead(tokenClaims interface{}) (domain.NotificationsCount, error) {
    userId, ok := tokenClaims.(map[string]interface{})["id"].(string)
    if !ok {
        return domain.NotificationsCount{}, errors.New("userId not found in tokenClaims") // Cambiado a un valor vacío
    }
    id, err := primitive.ObjectIDFromHex(userId)
    if err != nil {
        return domain.NotificationsCount{}, err
    }
    err = s.userRepository.UpdateUnreadNotificationsCount(id,0)
    if err != nil {
        return domain.NotificationsCount{}, err
    }
    return domain.NotificationsCount{}, nil
}