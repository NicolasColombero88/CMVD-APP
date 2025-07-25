// auth/adapter/persistence/repository.go
package persistence

import (
    "api/modules/shared/adapter/persistence"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "go.mongodb.org/mongo-driver/bson"
    "context"
    "time"
    "fmt"
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

func (r *Repository) InsertBranch(companyId primitive.ObjectID, branch interface{}) error {
    companyCollection := r.database.GetCollection("companies")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    fmt.Println("companyId:", companyId)

    // Paso 1: Actualizar a un array vacío solo si branches es null
    emptyArrayUpdate := bson.M{
        "$set": bson.M{
            "branches": bson.A{}, // Establecer el campo branches como un array vacío
        },
    }
    filter := bson.M{"_id": companyId, "branches": nil}
    _, err := companyCollection.UpdateOne(ctx, filter, emptyArrayUpdate)
    if err != nil {
        return err
    }

    // Paso 2: Insertar el nuevo branch en el array
    pushUpdate := bson.M{
        "$push": bson.M{
            "branches": branch,
        },
    }
    _, err = companyCollection.UpdateOne(ctx, bson.M{"_id": companyId}, pushUpdate)
    if err != nil {
        return err
    }

    return nil
}
// Repositorio Repository
func (r *Repository) UpdateBranche(companyID, branchID primitive.ObjectID, updatedBranch map[string]interface{}) error {
    companyCollection := r.database.GetCollection("companies")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    // Construir el filtro
    filter := bson.M{"branches._id": branchID}
    if !companyID.IsZero() {
        filter["_id"] = companyID
    }

    // Construir el mapa de actualización
    update := bson.M{}
    for field, value := range updatedBranch {
        updateKey := fmt.Sprintf("branches.$.%s", field)
        update[updateKey] = value
    }
    fmt.Println("companyId:", update)
    // Ejecutar la actualización
    _, err := companyCollection.UpdateOne(ctx, filter, bson.M{"$set": update})
    return err
}

