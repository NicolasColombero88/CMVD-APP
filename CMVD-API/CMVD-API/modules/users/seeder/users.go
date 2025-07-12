package seeder

import (
    "api/modules/users/domain"
    "api/modules/users/adapter/persistence"
    "api/modules/auth/adapter"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "time"
    "errors"
    "go.mongodb.org/mongo-driver/mongo"
)

func SeedUser(userRepo *persistence.Repository) error {
    users := []domain.User{
        {
            ID:        primitive.NewObjectID(),
            Name:      "Edinson",
            Email:     "admin@cadeteria.com",
            Password:  "12345678",
            Role:      "Super Admin",
            CreatedAt: time.Now(),
            UpdatedAt: time.Now(),
        },
    }

    for _, userToCreate := range users {
        _, err := userRepo.GetUserByEmail(userToCreate.Email)
        if err != nil {
            if !errors.Is(err, mongo.ErrNoDocuments) {
                return err
            }
        } else {
            // El usuario ya existe, continúa con el siguiente usuario
            continue
        }

        hashedPassword, err := adapter.HashPassword(userToCreate.Password)
        if err != nil {
            return err
        }
        userToCreate.Password = hashedPassword

        err = userRepo.InsertUser(&userToCreate)
        if err != nil {
            return err
        }
    }
    return nil
}
