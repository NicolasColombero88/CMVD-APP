package service

import (
    "log"
    "api/modules/users/domain"
    "api/modules/users/adapter/persistence"
    "api/modules/auth/adapter"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "api/modules/users/seeder"
    "errors"
)

type UserServiceImpl struct {
    userRepository *persistence.Repository
}

func NewUserService() domain.UserService {
    repo, err := persistence.NewRepository()
    if err != nil {
        log.Fatal(err)
    }
    if err := seeder.SeedUser(repo); err != nil {
        log.Fatal("Error al ejecutar el seeder:", err)
    }
    return &UserServiceImpl{
        userRepository: repo,
    }
}

func (s *UserServiceImpl) CreateUser(user domain.CreateUser, tokenClaims interface{}) (primitive.ObjectID, error) {
    userRol, ok := tokenClaims.(map[string]interface{})["role"].(string)
    if !ok {
        return primitive.NilObjectID, errors.New("rol not found in tokenClaims")
    }
    if userRol != "Super Admin" && userRol != "Admin" {
        return primitive.NilObjectID, errors.New("El usuario no tiene permisos")
    }
    if userRol == "Admin" {
        companyId, ok := tokenClaims.(map[string]interface{})["companyId"].(string)
        if !ok {
            return primitive.NilObjectID, errors.New("CompanyId not found in tokenClaims")
        }
        user.CompanyId = companyId
    }

    hashedPassword, err := adapter.HashPassword(user.Password)
    if err != nil {
        return primitive.NilObjectID, err
    }
    user.Password = hashedPassword

    userDocument, err := domain.SetCreateUser(user, userRol)
    if err != nil {
        return primitive.NilObjectID, err
    }

    err = s.userRepository.InsertUser(userDocument)
    if err != nil {
        return primitive.NilObjectID, err
    }

    return userDocument.ID, nil
}
func (s *UserServiceImpl) GetAllUsers(companyID string, role string, search string, page int, limit int) ([]domain.User, int, int, error) {
    users, totalPages, totalUsers, err :=  s.userRepository.GetAllUsers(companyID, role,search,page, limit)
    if err != nil {
        return []domain.User{},0,0, err
    }

    return users, totalPages, totalUsers, nil
}
func (s *UserServiceImpl) UpdateUser(userID primitive.ObjectID, updatedUser domain.UpdateUser,tokenClaims interface{}) error {
    userRol, ok := tokenClaims.(map[string]interface{})["role"].(string)
    if !ok {
        return errors.New("rol not found in tokenClaims")
    }
    if userRol != "Super Admin" && userRol != "Admin" {
        return errors.New("El usuario no tiene permisos")
    }
    err := s.userRepository.UpdateUser(userID, updatedUser)
    if err != nil {
        log.Printf("Error al actualizar el usuario: %v", err)
    }
    return err
}
func (s *UserServiceImpl) UpdatePassword(updatedUser domain.UpdatePassword, tokenClaims interface{}) error {
    userId, ok := tokenClaims.(map[string]interface{})["id"].(string)
    if !ok {
        return errors.New("userId not found in tokenClaims")
    }
    id, err := primitive.ObjectIDFromHex(userId)
    if err != nil {
        return err 
    }
    user, err := s.userRepository.GetUserByID(id)
    if err != nil {
        return err
    }
    // Verificar si updatedUser.CurrentPassword es nil antes de desreferenciarlo
    if updatedUser.CurrentPassword == nil {
        return errors.New("CurrentPassword is nil")
    }
    // Desreferenciar el puntero para obtener el valor de string
    if err := adapter.VerifyPassword(user.Password,*updatedUser.CurrentPassword); err != nil {
        return errors.New("La contraseña actual no es válida")
    }
    hashedPassword, err := adapter.HashPassword(updatedUser.Password) 
    if err != nil {
        return err
    }
    updatedUser.Password = hashedPassword
    userDocument := domain.SetUpdatePassword(updatedUser)
    err = s.userRepository.UpdatePassword(id, userDocument)
    if err != nil {
        log.Printf("Error al actualizar el usuario: %v", err)
    }
    return err
}
func (s *UserServiceImpl) GetUser(userID primitive.ObjectID,tokenClaims interface{}) (domain.User, error) {
    user, err := s.userRepository.GetUserByID(userID)
    if err != nil {
        return domain.User{}, err
    }
    return user, nil
}
func (s *UserServiceImpl) GetUserEmail(email string,tokenClaims interface{}) (domain.User, error) {
    user, err := s.userRepository.GetUserByEmail(email)
    if err != nil {
        return domain.User{}, err
    }
    return user, nil
}
func (s *UserServiceImpl) GetAllUsersToken(roles []string) ([]domain.UserNotificationTokens, error) {
    tokens, err := s.userRepository.GetAllUsersToken(roles)
    if err != nil {
        return []domain.UserNotificationTokens{}, err
    }
    return tokens, nil
}
func (s *UserServiceImpl) DeleteUser(userID primitive.ObjectID,tokenClaims interface{}) error{
    err := s.userRepository.DeleteUser(userID)
    if err != nil {
        return  err
    }
    return nil
}
func (s *UserServiceImpl) UpdateAccount(user domain.UpdateAccount, tokenClaims interface{}) (primitive.ObjectID, error) {
    // Extract userId from tokenClaims
    userId, ok := tokenClaims.(map[string]interface{})["id"].(string)
    if !ok {
        return primitive.NilObjectID, errors.New("userId not found in tokenClaims")
    }

    // Convert string userId to ObjectID
    id, err := primitive.ObjectIDFromHex(userId)
    if err != nil {
        return primitive.NilObjectID, err
    }

    // Extract role from tokenClaims
    userRol, ok := tokenClaims.(map[string]interface{})["role"].(string)
    if !ok {
        return primitive.NilObjectID, errors.New("role not found in tokenClaims")
    }

    // Validate role permissions
    validRoles := []string{"Super Admin", "Admin", "Cliente"}
    isValidRole := false
    for _, role := range validRoles {
        if userRol == role {
            isValidRole = true
            break
        }
    }
    if !isValidRole {
        return primitive.NilObjectID, errors.New("El usuario no tiene permisos")
    }

    // Set updated user data
    updatedUser := domain.SetUpdateAccount(user)
    err = s.userRepository.UpdateUser(id, updatedUser)
    if err != nil {
        return primitive.NilObjectID, err
    }

    // Handle company update if the role is "Cliente"
    if userRol == "Cliente" {
        companyIdStr, ok := tokenClaims.(map[string]interface{})["companyId"].(string)
        if !ok {
            return primitive.NilObjectID, errors.New("CompanyId not found in tokenClaims")
        }

        companyId, err := primitive.ObjectIDFromHex(companyIdStr)
        if err != nil {
            return primitive.NilObjectID, err
        }
        updateCompany := domain.SetCompany(user)
        err = s.userRepository.UpdateCompany(companyId, updateCompany)
        if err != nil {
            return primitive.NilObjectID, err
        }
    }

    return id, nil
}

