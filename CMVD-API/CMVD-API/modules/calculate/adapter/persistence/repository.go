package persistence

import (
    "api/modules/shared/adapter/persistence"
    "api/modules/companies/domain"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/mongo"
    "context"
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

func (r *Repository) GetPrice(companyId primitive.ObjectID) (float64, error) {
    var company domain.Company
    companyCollection := r.database.GetCollection("companies")
    err := companyCollection.FindOne(context.TODO(), bson.M{"_id": companyId}).Decode(&company)
    if err != nil {
        if err == mongo.ErrNoDocuments {
            return 0, fmt.Errorf("company with ID %s not found", companyId.Hex())
        }
        return 0, fmt.Errorf("error fetching company: %w", err)
    }
    if company.Price == 0 {
        return 0, nil
    }
    return company.Price, nil
}

