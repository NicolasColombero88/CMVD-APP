package persistence

import (
	"api/modules/shared/adapter/persistence"
	"api/modules/waybill/domain"
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"gopkg.in/gomail.v2"
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
func (r *Repository) GetWaybill(companyIDStr string, waybillID primitive.ObjectID) (domain.Waybill, error) {
	filter := bson.M{
		"_id": waybillID,
	}
	if companyIDStr != "" {
		companyID, err := primitive.ObjectIDFromHex(companyIDStr)
		if err != nil {
			return domain.Waybill{}, err
		}
		filter["company_id"] = companyID
	}
	WaybillsCollection := r.database.GetCollection("waybills")
	var waybill domain.Waybill
	err := WaybillsCollection.FindOne(context.TODO(), filter).Decode(&waybill)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return domain.Waybill{}, fmt.Errorf("waybill not found")
		}
		return domain.Waybill{}, err
	}
	return waybill, nil
}
func (r *Repository) GetAllWaybill(companyId primitive.ObjectID, status, search, withdrawalAfter string, withdrawalBefore string, deliveryAfter string, deliveryBefore string, page, limit int) ([]domain.Waybill, int, int, error) {
	waybillsCollection := r.database.GetCollection("waybills")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"company_id": companyId}

	if status != "" {
		switch status {
		case "Cancelado":
			// trae tanto los “canceled” antiguos como los nuevos
			filter["status"] = bson.M{"$in": []string{"canceled", "Cancelado"}}
		case "activas", "Activas":
			// tu lógica de activas
			filter["status"] = bson.M{"$in": []string{"Aceptado", "En camino"}}
		default:
			// cualquier otro estado por regex
			filter["status"] = bson.M{"$regex": primitive.Regex{Pattern: status, Options: "i"}}
		}
	} else {
		// por defecto excluye ambos “canceled” y “Cancelado”
		filter["status"] = bson.M{"$nin": []string{"canceled", "Cancelado"}}
	}

	if search != "" {
		orConditions := []bson.M{
			{"receiver_address": bson.M{"$regex": primitive.Regex{Pattern: search, Options: "i"}}},
			{"sender_address": bson.M{"$regex": primitive.Regex{Pattern: search, Options: "i"}}},
			{"status": bson.M{"$regex": primitive.Regex{Pattern: search, Options: "i"}}},
		}

		objectId, err := primitive.ObjectIDFromHex(search)
		if err == nil {
			orConditions = append(orConditions, bson.M{"_id": objectId})
		}

		filter["$or"] = orConditions
	}

	wf := bson.M{}
	if withdrawalAfter != "" {
		if t, err := time.Parse(time.RFC3339, withdrawalAfter); err == nil {
			wf["$gte"] = t
		}
	}
	if withdrawalBefore != "" {
		if t, err := time.Parse(time.RFC3339, withdrawalBefore); err == nil {
			wf["$lte"] = t
		}
	}
	if len(wf) > 0 {
		filter["withdrawal_date"] = wf
	}

	df := bson.M{}
	if deliveryAfter != "" {
		if t, err := time.Parse(time.RFC3339, deliveryAfter); err == nil {
			df["$gte"] = t
		}
	}
	if deliveryBefore != "" {
		if t, err := time.Parse(time.RFC3339, deliveryBefore); err == nil {
			df["$lte"] = t
		}
	}
	if len(df) > 0 {
		filter["delivery_date"] = df
	}

	opts := options.Find().SetSort(bson.D{{Key: "_id", Value: -1}})
	if limit > 0 && page > 0 {
		opts.SetSkip(int64((page - 1) * limit)).SetLimit(int64(limit))
	}

	cursor, err := waybillsCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, 0, err
	}
	defer cursor.Close(ctx)

	var waybillArray []domain.Waybill
	for cursor.Next(ctx) {
		var waybill domain.Waybill
		if err := cursor.Decode(&waybill); err != nil {
			return nil, 0, 0, err
		}
		waybillArray = append(waybillArray, waybill)
	}

	if err := cursor.Err(); err != nil {
		return nil, 0, 0, err
	}

	totalRecords, err := waybillsCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, 0, err
	}

	totalPages := 1
	if limit > 0 {
		totalPages = int((totalRecords + int64(limit) - 1) / int64(limit))
	}

	return waybillArray, totalPages, int(totalRecords), nil
}
func (r *Repository) GetAllWaybillAdmin(
	status, search, userId, role string,
	withdrawalAfter, withdrawalBefore, deliveryAfter, deliveryBefore string,
	page, limit int,
) ([]domain.Waybill, int, int, error) {
	waybillsCollection := r.database.GetCollection("waybills")

	filter := bson.M{}

	if status != "" {
		switch status {
		case "Cancelado":
			// trae tanto los “canceled” antiguos como los nuevos
			filter["status"] = bson.M{"$in": []string{"canceled", "Cancelado"}}
		case "activas", "Activas":
			// tu lógica de activas
			filter["status"] = bson.M{"$in": []string{"Aceptado", "En camino"}}
		default:
			// cualquier otro estado por regex
			filter["status"] = bson.M{"$regex": primitive.Regex{Pattern: status, Options: "i"}}
		}
	} else {
		// por defecto excluye ambos “canceled” y “Cancelado”
		filter["status"] = bson.M{"$nin": []string{"canceled", "Cancelado"}}
	}

	if role == "Cadete" {
		objectID, err := primitive.ObjectIDFromHex(userId)
		if err != nil {
			return nil, 0, 0, fmt.Errorf("invalid ObjectId format: %w", err)
		}
		filter["cadete_id"] = objectID
	}

	if search != "" {
		orConditions := []bson.M{
			{"company_name": bson.M{"$regex": primitive.Regex{Pattern: search, Options: "i"}}},
			{"receiver_address": bson.M{"$regex": primitive.Regex{Pattern: search, Options: "i"}}},
			{"sender_address": bson.M{"$regex": primitive.Regex{Pattern: search, Options: "i"}}},
			{"status": bson.M{"$regex": primitive.Regex{Pattern: search, Options: "i"}}},
		}

		objectId, err := primitive.ObjectIDFromHex(search)
		if err == nil {
			orConditions = append(orConditions, bson.M{"_id": objectId})
		}

		filter["$or"] = orConditions
	}

	wf := bson.M{}
	if withdrawalAfter != "" {
		if t, err := time.Parse(time.RFC3339, withdrawalAfter); err == nil {
			wf["$gte"] = t
		}
	}
	if withdrawalBefore != "" {
		if t, err := time.Parse(time.RFC3339, withdrawalBefore); err == nil {
			wf["$lte"] = t
		}
	}
	if len(wf) > 0 {
		filter["withdrawal_date"] = wf
	}

	// filtrado por delivery_date
	df := bson.M{}
	if deliveryAfter != "" {
		if t, err := time.Parse(time.RFC3339, deliveryAfter); err == nil {
			df["$gte"] = t
		}
	}
	if deliveryBefore != "" {
		if t, err := time.Parse(time.RFC3339, deliveryBefore); err == nil {
			df["$lte"] = t
		}
	}
	if len(df) > 0 {
		filter["delivery_date"] = df
	}

	opts := options.Find().SetSort(bson.D{{Key: "_id", Value: -1}})
	if limit > 0 && page > 0 {
		opts.SetSkip(int64((page - 1) * limit)).SetLimit(int64(limit))
	}

	cursor, err := waybillsCollection.Find(context.TODO(), filter, opts)
	if err != nil {
		return nil, 0, 0, err
	}
	defer cursor.Close(context.TODO())

	var waybillArray []domain.Waybill
	for cursor.Next(context.TODO()) {
		var waybill domain.Waybill
		if err := cursor.Decode(&waybill); err != nil {
			return nil, 0, 0, err
		}
		waybillArray = append(waybillArray, waybill)
	}

	if err := cursor.Err(); err != nil {
		return nil, 0, 0, err
	}

	totalRecords, err := waybillsCollection.CountDocuments(context.TODO(), filter)
	if err != nil {
		return nil, 0, 0, err
	}

	totalPages := 1
	if limit > 0 {
		totalPages = int((totalRecords + int64(limit) - 1) / int64(limit))
	}

	return waybillArray, totalPages, int(totalRecords), nil
}

func (r *Repository) InsertWaybill(waybill interface{}) error {
	WaybillsCollection := r.database.GetCollection("waybills")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := WaybillsCollection.InsertOne(ctx, waybill)
	return err
}
func (r *Repository) UpdateWaybill(waybillID primitive.ObjectID, updatedData interface{}) error {
	WaybillsCollection := r.database.GetCollection("waybills")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	filter := bson.M{"_id": waybillID}
	update := bson.M{"$set": updatedData}
	_, err := WaybillsCollection.UpdateOne(ctx, filter, update)
	return err
}
func (r *Repository) InsertStatusHistory(companyId primitive.ObjectID, statusHistory domain.StatusHistory) error {
	companyCollection := r.database.GetCollection("waybills")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Paso 1: Inicializar `status_history` si no es un array o es null
	filter := bson.M{"_id": companyId, "$or": bson.A{
		bson.M{"status_history": bson.M{"$exists": false}}, // No existe
		bson.M{"status_history": nil},                      // Es null
	}}
	initializeUpdate := bson.M{
		"$set": bson.M{"status_history": bson.A{}}, // Inicializar como array vacío
	}
	_, err := companyCollection.UpdateOne(ctx, filter, initializeUpdate)
	if err != nil {
		fmt.Println("Error al inicializar status_history:", err)
		return err
	}

	// Paso 2: Insertar en la posición 1 del array
	filter = bson.M{"_id": companyId} // Filtrar por `_id`
	pushUpdate := bson.M{
		"$push": bson.M{
			"status_history": bson.M{
				"$each":     bson.A{statusHistory}, // Objeto a insertar
				"$position": 1,                     // Insertar en la posición 1
			},
		},
	}
	result, err := companyCollection.UpdateOne(ctx, filter, pushUpdate)
	if err != nil {
		fmt.Println("Error al insertar en status_history:", err)
		return err
	}

	if result.ModifiedCount == 0 {
		fmt.Println("No se encontró el documento con el ID proporcionado")
		return errors.New("No se encontró el documento con el ID proporcionado")
	}

	fmt.Println("Actualización exitosa")
	return nil
}

func (r *Repository) DeleteWaybill(waybillID primitive.ObjectID) error {
	waybillsCollection := r.database.GetCollection("waybills")
	filter := bson.M{"_id": waybillID}
	update := bson.M{"$set": bson.M{
		"status":     domain.GuideCancelado,
		"updated_at": time.Now(),
	}}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := waybillsCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("error cancelando la guía: %w", err)
	}
	if result.ModifiedCount == 0 {
		return fmt.Errorf("no se encontró guía con id: %s", waybillID.Hex())
	}
	return nil
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
func (r *Repository) Email(toEmail, toName, subject, htmlContent string) error {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
		return err
	}

	smtpHost := os.Getenv("SMTP_HOST")
	smtpPortStr := os.Getenv("SMTP_PORT")
	username := os.Getenv("SMTP_USER")
	password := os.Getenv("SMTP_PASSWORD")
	from := os.Getenv("SMTP_FROM")

	if smtpHost == "" || smtpPortStr == "" || username == "" || password == "" || from == "" {
		log.Fatal("Missing required SMTP configuration variables.")
		return fmt.Errorf("missing required SMTP configuration variables")
	}

	smtpPort, err := strconv.Atoi(smtpPortStr)
	if err != nil {
		log.Printf("Error converting SMTP_PORT to integer: %v", err)
		return fmt.Errorf("error converting SMTP_PORT to integer: %w", err)
	}

	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", htmlContent)

	d := gomail.NewDialer(smtpHost, smtpPort, username, password)
	d.TLSConfig = &tls.Config{InsecureSkipVerify: true}

	err = d.DialAndSend(m)
	if err != nil {
		log.Printf("Error sending email: %v", err)
		return fmt.Errorf("error sending email: %w", err)
	}

	log.Printf("Email sent successfully to: %s", toEmail)
	return nil
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
func (r *Repository) GetCountWithdrawalDate(fechaminimaStr string) ([]map[string]interface{}, error) {
	waybillsCollection := r.database.GetCollection("waybills")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var fechaminima time.Time
	var err error

	// Cargar límites máximos de envíos por día desde las variables de entorno
	maxDailyShipments := map[time.Weekday]int{
		time.Monday:    getEnvAsInt("MAX_DAILY_SHIPMENTS_MONDAY"),
		time.Tuesday:   getEnvAsInt("MAX_DAILY_SHIPMENTS_TUESDAY"),
		time.Wednesday: getEnvAsInt("MAX_DAILY_SHIPMENTS_WEDNESDAY"),
		time.Thursday:  getEnvAsInt("MAX_DAILY_SHIPMENTS_THURSDAY"),
		time.Friday:    getEnvAsInt("MAX_DAILY_SHIPMENTS_FRIDAY"),
		time.Saturday:  getEnvAsInt("MAX_DAILY_SHIPMENTS_SATURDAY"),
		time.Sunday:    getEnvAsInt("MAX_DAILY_SHIPMENTS_SUNDAY"),
	}

	if fechaminimaStr == "" {
		fechaminima = time.Now().Add(-24 * time.Hour).Truncate(24 * time.Hour)
	} else {
		fechaminima, err = time.Parse("2006-01-02", fechaminimaStr)
		if err != nil {
			return nil, fmt.Errorf("error al convertir la fecha: %v", err)
		}
	}

	fechaminima = fechaminima.UTC()
	fechaminimaMongo := primitive.NewDateTimeFromTime(fechaminima)

	pipeline := bson.A{
		bson.M{
			"$match": bson.M{
				"withdrawal_date": bson.M{"$gte": fechaminimaMongo},
			},
		},
		bson.M{
			"$group": bson.M{
				"_id": bson.M{
					"$dateToString": bson.M{
						"format": "%Y/%m/%d",
						"date":   "$withdrawal_date",
					},
				},
				"count": bson.M{"$sum": 1},
			},
		},
		bson.M{
			"$project": bson.M{
				"date":  "$_id",
				"count": 1,
				"_id":   0,
			},
		},
	}

	cursor, err := waybillsCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []map[string]interface{}
	if err = cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	// Agregar el día de la semana y el límite máximo de envíos por día
	for i, item := range results {
		dateStr, ok := item["date"].(string)
		if !ok {
			continue
		}
		date, err := time.Parse("2006/01/02", dateStr)
		if err != nil {
			continue
		}
		day := date.Weekday()
		results[i]["day"] = day.String() // Día en inglés

		// Si quieres en español, usa un mapa de traducción
		daysInSpanish := map[time.Weekday]string{
			time.Sunday:    "Domingo",
			time.Monday:    "Lunes",
			time.Tuesday:   "Martes",
			time.Wednesday: "Miércoles",
			time.Thursday:  "Jueves",
			time.Friday:    "Viernes",
			time.Saturday:  "Sábado",
		}
		results[i]["day_es"] = daysInSpanish[day]

		// Agregar el máximo de envíos permitidos ese día
		results[i]["max_shipments"] = maxDailyShipments[day]
	}

	jsonData, _ := json.MarshalIndent(results, "", "  ")
	log.Println(string(jsonData))
	return results, nil
}
func getEnvAsInt(key string) int {
	value, err := strconv.Atoi(os.Getenv(key))
	if err != nil {
		return 0 // Retorna 0 si la variable de entorno no es válida
	}
	return value
}
