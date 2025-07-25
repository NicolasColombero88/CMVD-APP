package persistence

import (
    "api/modules/shared/adapter/persistence"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "context"
    "time"
    "go.mongodb.org/mongo-driver/bson"
    "api/modules/shipping-zones/domain"
    "go.mongodb.org/mongo-driver/mongo/options"
    "fmt"
    "errors"
    "math"
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
func (r *Repository) GetAllShippingZones(search string, page int, limit int) ([]domain.ShippingZone, int, int, error) {
    ShippingZoneCollection := r.database.GetCollection("shipping_zone")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    filter := bson.M{}
    if search != "" {
        filter["name"] = bson.M{"$regex": search, "$options": "i"}
        filter["state"] = bson.M{"$regex": search, "$options": "i"}
    }
    totalRecords, err := ShippingZoneCollection.CountDocuments(ctx, filter)
    if err != nil {
        return nil, 0, 0, err
    }
    totalPages := int(math.Ceil(float64(totalRecords) / float64(limit)))

    skip := (page - 1) * limit
    options := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit))

    cursor, err := ShippingZoneCollection.Find(ctx, filter, options)
    if err != nil {
        return nil, 0, 0, err
    }
    defer cursor.Close(ctx)
    var shippingZones []domain.ShippingZone
    for cursor.Next(ctx) {
        var zone domain.ShippingZone
        if err := cursor.Decode(&zone); err != nil {
            return nil, 0, 0, err
        }
        shippingZones = append(shippingZones, zone)
    }
    return shippingZones, totalPages, int(totalRecords), nil
}

func (r *Repository) InsertShippingZone(shippingZone interface{}) (primitive.ObjectID, error) {
    ShippingZoneCollection := r.database.GetCollection("shipping_zone")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    result, err := ShippingZoneCollection.InsertOne(ctx, shippingZone)
    if err != nil {
        return primitive.NilObjectID, err
    }
    insertedID, ok := result.InsertedID.(primitive.ObjectID)
    if !ok {
        return primitive.NilObjectID, errors.New("failed to retrieve inserted ID")
    }
    return insertedID, nil
}

func (r *Repository) DeleteShippingZones(shippingZoneID primitive.ObjectID) error {

    companyCollection := r.database.GetCollection("shipping_zone")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    filter := bson.M{"_id": shippingZoneID}
    result, err := companyCollection.DeleteOne(ctx, filter)
    if err != nil {
        return fmt.Errorf("error al eliminar la zona de envío: %w", err)
    }
    if result.DeletedCount == 0 {
        return fmt.Errorf("no se encontró ninguna zona de envío con el ID proporcionado")
    }

    return nil
}


func (r *Repository) UpdateShippingZones(shippingZoneID primitive.ObjectID, updatedShippingZone interface{}) error {
    ShippingZoneCollection := r.database.GetCollection("shipping_zone")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    filter := bson.M{"_id": shippingZoneID}
    update := bson.M{
        "$set": updatedShippingZone,
    }
    result, err := ShippingZoneCollection.UpdateOne(ctx, filter, update)
    if err != nil {
        return fmt.Errorf("failed to update shipping zone: %w", err)
    }
    if result.MatchedCount == 0 {
        return fmt.Errorf("no shipping zone found with the specified ID: %s", shippingZoneID.Hex())
    }
    return nil
}

func (r *Repository) GetShippingZone(shippingZoneId primitive.ObjectID) (domain.ShippingZone, error) {
    var shippingZone domain.ShippingZone

    ShippingZoneCollection := r.database.GetCollection("shipping_zone")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    filter := bson.M{"_id": shippingZoneId}
    err := ShippingZoneCollection.FindOne(ctx, filter).Decode(&shippingZone)
    return shippingZone, err
}

func (r *Repository) GetAllAreas() ([]domain.ShippingZoneNeighborhood, error) {
    ShippingZoneCollection := r.database.GetCollection("shipping_zone")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    cursor, err := ShippingZoneCollection.Find(ctx, bson.M{})
    if err != nil {
        return nil, fmt.Errorf("error al obtener las zonas de envío: %w", err)
    }
    defer cursor.Close(ctx)

    var areas []domain.ShippingZoneNeighborhood

    for cursor.Next(ctx) {
        var zone domain.ShippingZone
        if err := cursor.Decode(&zone); err != nil {
            return nil, fmt.Errorf("error al decodificar la zona de envío: %w", err)
        }

        for _, area := range zone.Areas {
            areaNeighborhood := domain.ShippingZoneNeighborhood{
                Name:         zone.Name,
                Price:        zone.Price,
                Status:       zone.Status,
                City:         area.City,
                Neighborhood: area.Neighborhood,
                Pincode:      area.Pincode,
            }
            areas = append(areas, areaNeighborhood)
        }
    }

    if err := cursor.Err(); err != nil {
        return nil, fmt.Errorf("error al iterar por el cursor: %w", err)
    }

    return areas, nil
}








