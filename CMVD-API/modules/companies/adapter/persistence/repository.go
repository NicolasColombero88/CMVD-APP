package persistence
import (
    "api/modules/shared/adapter/persistence"
    "api/modules/companies/domain"
    "context"
    "fmt"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "time"
    "errors"
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
func (r *Repository) GetCompany(companyId primitive.ObjectID) (domain.Company, error) {
	var company domain.Company

	companyCollection := r.database.GetCollection("companies")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"_id": companyId}
	err := companyCollection.FindOne(ctx, filter).Decode(&company)
	if err != nil {
		return domain.Company{}, err
	}
	return company, nil
}
func (r *Repository) GetAllCompanies(search string, page, limit int) ([]domain.Company, int, int, error) {
    var companies []domain.Company
    companyCollection := r.database.GetCollection("companies")

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    filter := bson.M{}
    if search != "" {
        filter = bson.M{
            "$or": []bson.M{
                {"name": bson.M{"$regex": search, "$options": "i"}},
                {"email": bson.M{"$regex": search, "$options": "i"}},
                {"phone": bson.M{"$regex": search, "$options": "i"}},
                {"user_name": bson.M{"$regex": search, "$options": "i"}},
            },
        }
    }

    totalRecords, err := companyCollection.CountDocuments(ctx, filter)
    if err != nil {
        return nil, 0, 0, err
    }

    var cursor *mongo.Cursor
    if limit > 0 {
        cursor, err = companyCollection.Find(ctx, filter, options.Find().
            SetSkip(int64((page-1)*limit)).
            SetLimit(int64(limit)),
        )
    } else {
        cursor, err = companyCollection.Find(ctx, filter)
    }
    if err != nil {
        return nil, 0, 0, err
    }
    defer cursor.Close(ctx)

    for cursor.Next(ctx) {
        var company domain.Company
        if err := cursor.Decode(&company); err != nil {
            return nil, 0, 0, err
        }
        companies = append(companies, company)
    }
    if err := cursor.Err(); err != nil {
        return nil, 0, 0, err
    }

    totalPages := 1
    if limit > 0 {
        totalPages = int((totalRecords + int64(limit) - 1) / int64(limit))
    }

    return companies, totalPages, int(totalRecords), nil
}

func (r *Repository) InsertCompany(companyDocument interface{}) error {
    companyCollection := r.database.GetCollection("companies")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    _, err := companyCollection.InsertOne(ctx, companyDocument)
    return err
}
func (r *Repository) UpdateCompany(companyId primitive.ObjectID, companyDocument interface{}) error {
    fmt.Println("Token companyId:", companyId)
    fmt.Println("== companyDocument:", companyDocument)
    companyCollection := r.database.GetCollection("companies")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    filter := primitive.M{"_id": companyId}

    update := primitive.M{"$set": companyDocument}
    _, err := companyCollection.UpdateOne(ctx, filter, update)

    return err
}

func (r *Repository) GetCompanyByEmail(email string) (domain.Company, error) {
    var company domain.Company

    companyCollection := r.database.GetCollection("companies")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    filter := bson.M{"email": email}
    err := companyCollection.FindOne(ctx, filter).Decode(&company)
    if err != nil {
        return domain.Company{}, err
    }

    return company, nil
}

func (r *Repository) GetAllBranches(companyId primitive.ObjectID, search string, page, limit int) ([]domain.Branch, int, int, error) {
    companyCollection := r.database.GetCollection("companies")

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    pipeline := mongo.Pipeline{
        bson.D{{"$match", bson.D{{"_id", companyId}}}},
        bson.D{{"$unwind", "$branches"}},
    }
    if search != "" {
        pipeline = append(pipeline, bson.D{{"$match", bson.D{
            {"branches.name", bson.D{{"$regex", search}, {"$options", "i"}}},
        }}})
    }
    pipelineCount := append(pipeline, bson.D{{"$count", "total"}})
    countCursor, err := companyCollection.Aggregate(ctx, pipelineCount)
    if err != nil {
        return nil, 0, 0, err
    }

    var countResult []struct {
        Total int `bson:"total"`
    }
    if err := countCursor.All(ctx, &countResult); err != nil {
        return nil, 0, 0, err
    }

    totalRecords := 0
    if len(countResult) > 0 {
        totalRecords = countResult[0].Total
    }

    // Paginación
    if limit > 0 {
        pipeline = append(pipeline, bson.D{{"$skip", int64((page - 1) * limit)}})
        pipeline = append(pipeline, bson.D{{"$limit", int64(limit)}})
    }

    // Proyección para solo devolver las sucursales
    pipeline = append(pipeline, bson.D{{"$replaceRoot", bson.D{{"newRoot", "$branches"}}}})

    // Consulta final
    cursor, err := companyCollection.Aggregate(ctx, pipeline)
    if err != nil {
        return nil, 0, 0, err
    }
    defer cursor.Close(ctx)

    var branches []domain.Branch
    if err := cursor.All(ctx, &branches); err != nil {
        return nil, 0, 0, err
    }

    totalPages := 1
    if limit > 0 && totalRecords > 0 {
        totalPages = (totalRecords + limit - 1) / limit
    }

    return branches, totalPages, totalRecords, nil
}

func (r *Repository) CreateBranches(companyId primitive.ObjectID, branchDocument interface{}) error {
    companyCollection := r.database.GetCollection("companies")

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    filter := bson.M{"_id": companyId}

  
    update := bson.M{
        "$push": bson.M{
            "branches": branchDocument,
        },
    }
    _, err := companyCollection.UpdateOne(ctx, filter, update)
    return err
}

func (r *Repository) DeleteBranches(companyId primitive.ObjectID, branchId primitive.ObjectID) error {
    companyCollection := r.database.GetCollection("companies")

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    filter := bson.M{"_id": companyId}
    update := bson.M{
        "$pull": bson.M{
            "branches": bson.M{"_id": branchId},
        },
    }
    _, err := companyCollection.UpdateOne(ctx, filter, update)
    return err
}

func (r *Repository) GetBranche(companyId primitive.ObjectID, branchId primitive.ObjectID) (domain.Branch, error) {
    companyCollection := r.database.GetCollection("companies")

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    filter := bson.M{"_id": companyId}
    projection := bson.M{"branches": bson.M{"$elemMatch": bson.M{"_id": branchId}}}

    var result struct {
        Branches []domain.Branch `bson:"branches"`
    }

    err := companyCollection.FindOne(ctx, filter, options.FindOne().SetProjection(projection)).Decode(&result)
    if err != nil {
        return domain.Branch{}, err
    }

    if len(result.Branches) == 0 {
        return domain.Branch{}, fmt.Errorf("branch not found")
    }

    return result.Branches[0], nil
}
func (r *Repository) UpdateBranches(branchId primitive.ObjectID, companyId primitive.ObjectID, branchDocument interface{}) error {
    companyCollection := r.database.GetCollection("companies")

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    filter := bson.M{
        "_id":          companyId,
        "branches._id": branchId,
    }

    update := bson.M{
        "$set": bson.M{
            "branches.$": branchDocument,
        },
    }

    _, err := companyCollection.UpdateOne(ctx, filter, update)
    return err
}
func (r *Repository) DeleteCompany(companyId primitive.ObjectID) error {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    companyCollection := r.database.GetCollection("companies")
    usersCollection := r.database.GetCollection("users")
    waybillsCollection := r.database.GetCollection("waybills")

    _, err := companyCollection.DeleteOne(ctx, bson.M{"_id": companyId})
    if err != nil {
        return fmt.Errorf("error deleting company: %v", err)
    }

    _, err = usersCollection.DeleteMany(ctx, bson.M{"companyId": companyId.Hex()})
    if err != nil {
        return fmt.Errorf("error deleting users: %v", err)
    }

    _, err = waybillsCollection.DeleteMany(ctx, bson.M{"company_id": companyId})
    if err != nil {
        return fmt.Errorf("error deleting waybills: %v", err)
    }
    return nil
}
func (r *Repository) UpdateUserCompanyID(userID primitive.ObjectID, companyID primitive.ObjectID) error {
    userCollection := r.database.GetCollection("users")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    filter := bson.M{"_id": userID}
    update := bson.M{"$set": bson.M{"companyId": companyID}}

    result, err := userCollection.UpdateOne(ctx, filter, update)
    if err != nil {
        return fmt.Errorf("error al actualizar el usuario: %v", err)
    }
    if result.MatchedCount == 0 {
        return errors.New("usuario no encontrado")
    }

    return nil
}
