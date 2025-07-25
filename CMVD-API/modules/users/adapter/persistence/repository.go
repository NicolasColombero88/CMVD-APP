// auth/adapter/persistence/repository.go
package persistence

import (
    "api/modules/shared/adapter/persistence"
    "context"
    "api/modules/users/domain"
    "go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/bson"
    "time"
    "strings"
    "errors"
    "fmt"
    "go.mongodb.org/mongo-driver/mongo/options"
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
func (r *Repository) InsertUser(userDocument interface{}) error {
    user, ok := userDocument.(*domain.User)
    if !ok {
        return errors.New("El tipo de userDocument no es *domain.User")
    }

    usersCollection := r.database.GetCollection("users")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    filter := bson.M{"email": user.Email}
    existingUser := usersCollection.FindOne(ctx, filter)
    if existingUser.Err() == nil {
        return errors.New("El correo electrónico ya está registrado")
    }
    
    if user.CompanyId != "" {
        if !r.CompanyExists(user.CompanyId) {
            return errors.New("No se encontró una empresa con el CompanyId proporcionado")
        }
    }
    _, err := usersCollection.InsertOne(ctx, userDocument)
    return err
}

func (r *Repository) CompanyExists(companyId string) bool {
    objID, err := primitive.ObjectIDFromHex(companyId)
    if err != nil {
        return false
    }
    companyCollection := r.database.GetCollection("companies")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    filter := bson.M{"_id": objID}
    errFind := companyCollection.FindOne(ctx, filter).Err()
    return errFind == nil
}

func (r *Repository) GetAllUsers(companyID string, role string, search string, page int, limit int) ([]domain.User, int, int, error) {
    usersCollection := r.database.GetCollection("users")
    filter := bson.M{}

    if role != "" {
        if strings.ToLower(role) == "internal" {
            filter["role"] = bson.M{"$in": []string{"Super Admin", "Delivery Driver"}}
        } else {
            filter["role"] = bson.M{"$regex": primitive.Regex{Pattern: "(?i)^" + role + "$"}}
        }
    }

    if companyID != "" {
        filter["companyId"] = companyID
    }

    if search != "" {
        regex := primitive.Regex{Pattern: search, Options: "i"}
        filter["$or"] = []bson.M{
            {"name": bson.M{"$regex": regex}},
            {"email": bson.M{"$regex": regex}},
            {"phone": bson.M{"$regex": regex}},
        }
    }

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    totalUsers, err := usersCollection.CountDocuments(ctx, filter)
    if err != nil {
        return nil, 0, 0, err
    }

    options := options.Find()
    if limit > 0 {
        options.SetLimit(int64(limit))
        options.SetSkip(int64((page - 1) * limit))
    }

    cursor, err := usersCollection.Find(ctx, filter, options)
    if err != nil {
        return nil, 0, 0, err
    }
    defer cursor.Close(ctx)

    var users []domain.User
    for cursor.Next(ctx) {
        var user domain.User
        if err := cursor.Decode(&user); err != nil {
            return nil, 0, 0, err
        }
        users = append(users, user)
    }

    totalPages := 1
    if limit > 0 {
        totalPages = int((totalUsers + int64(limit) - 1) / int64(limit))
    }

    return users, totalPages, int(totalUsers), nil
}
func (r *Repository) UpdateUser(userID primitive.ObjectID, updatedUser domain.UpdateUser) error {
    usersCollection := r.database.GetCollection("users")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    if updatedUser.Email != nil && *updatedUser.Email != "" {
        filter := bson.M{
            "email": *updatedUser.Email,
            "_id":   bson.M{"$ne": userID},
        }

        existingUser := usersCollection.FindOne(ctx, filter)
        if existingUser.Err() == nil {
            return errors.New("El correo electrónico ya está registrado por otro usuario")
        }
    }
    filter := bson.D{primitive.E{Key: "_id", Value: userID}}
    update := bson.M{
        "$set": updatedUser,
    }
    _, err := usersCollection.UpdateOne(ctx, filter, update)
    return err
}
func (r *Repository) UpdatePassword(userID primitive.ObjectID, updatedUser domain.UpdatePassword) error {
    usersCollection := r.database.GetCollection("users")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    filter := bson.D{primitive.E{Key: "_id", Value: userID}}
    update := bson.M{
        "$set": updatedUser,
    }

    _, err := usersCollection.UpdateOne(ctx, filter, update)
    return err
}
func (r *Repository) GetUserByID(userID primitive.ObjectID) (domain.User, error) {
    var user domain.User

    usersCollection := r.database.GetCollection("users")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    filter := bson.M{"_id": userID}
    err := usersCollection.FindOne(ctx, filter).Decode(&user)
    return user, err
}
type UserWithTokens struct {
    NotificationTokens []domain.NotificationToken `bson:"notification_tokens"`
}
func (r *Repository) GetAllUsersToken(roles []string) ([]domain.UserNotificationTokens, error) {
    fmt.Println("Tokens de notificación para los roles:", roles)
    usersCollection := r.database.GetCollection("users")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    var filter bson.M
    if len(roles) == 0 {
        filter = bson.M{}
    } else {
        filter = bson.M{
            "role": bson.M{"$in": roles},
        }
    }
    cursor, err := usersCollection.Find(ctx, filter)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    var userNotificationTokens []domain.UserNotificationTokens

    for cursor.Next(ctx) {
        var user domain.User // Asegúrate de que 'User' tenga el campo 'NotificationTokens'
        if err := cursor.Decode(&user); err != nil {
            return nil, err
        }
        
        if len(user.NotificationTokens) > 0 {
            for _, token := range user.NotificationTokens {
                userNotificationToken := domain.UserNotificationTokens{
                    UserId:  user.ID,
                    Tokens: token, // Suponiendo que el campo 'Tokens' en 'UserNotificationTokens' sea de tipo NotificationToken
                }
                userNotificationTokens = append(userNotificationTokens, userNotificationToken)
            }
        }
    }

    if err := cursor.Err(); err != nil {
        return nil, err
    }
    return userNotificationTokens, nil
}

func (r *Repository) GetUserByEmail(email string) (domain.User, error) {
    var user domain.User

    usersCollection := r.database.GetCollection("users")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    filter := bson.M{"email": email}
    err := usersCollection.FindOne(ctx, filter).Decode(&user)
    
    if err != nil {
        return domain.User{}, err
    }

   
    return user, nil
}
func (r *Repository) DeleteUser(userID primitive.ObjectID) error {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    usersCollection := r.database.GetCollection("users")
    companyCollection := r.database.GetCollection("companies")
    waybillsCollection := r.database.GetCollection("waybills")

    var user bson.M
    err := usersCollection.FindOne(ctx, bson.M{"_id": userID}).Decode(&user)
    if err != nil {
        return errors.New("usuario no encontrado")
    }

    role, ok := user["role"].(string)
    if !ok {
        return errors.New("el usuario no tiene un rol válido")
    }
    if role == "Cliente" {
        var company bson.M
        err := companyCollection.FindOne(ctx, bson.M{"user_id": userID}).Decode(&company)
        if err == nil {
            companyID, ok := company["_id"].(primitive.ObjectID)
            if ok {
                _, err = waybillsCollection.DeleteMany(ctx, bson.M{"company_id": companyID})
                if err != nil {
                    return fmt.Errorf("error al eliminar guías: %v", err)
                }
                _, err = companyCollection.DeleteOne(ctx, bson.M{"_id": companyID})
                if err != nil {
                    return fmt.Errorf("error al eliminar empresa: %v", err)
                }
            }
        }
    }
    result, err := usersCollection.DeleteOne(ctx, bson.M{"_id": userID})
    if err != nil {
        return fmt.Errorf("error al eliminar usuario: %v", err)
    }
    if result.DeletedCount == 0 {
        return errors.New("el usuario no fue eliminado")
    }

    return nil
}

func (r *Repository) UpdateCompany(companyId primitive.ObjectID, companyDocument interface{}) error {
    // Obtén la colección de empresas
    companyCollection := r.database.GetCollection("companies")

    // Crea un filtro para identificar el documento por su ID
    filter := bson.M{"_id": companyId}

    // Crea el documento de actualización, utilizando el operador $set
    update := bson.M{"$set": companyDocument}

    // Realiza la operación de actualización
    result, err := companyCollection.UpdateOne(context.TODO(), filter, update)
    if err != nil {
        return fmt.Errorf("error al actualizar la empresa: %v", err)
    }

    // Comprueba si no se actualizó ningún documento
    if result.MatchedCount == 0 {
        return fmt.Errorf("no se encontró ninguna empresa con el ID proporcionado")
    }

    return nil
}
