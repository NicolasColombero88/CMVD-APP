package persistence

import (
	"context"
	"fmt"
	"net/url"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
	"os"
	"github.com/joho/godotenv"
	"log"
)

type Database struct {
	client *mongo.Client
	ctx    context.Context
	db     *mongo.Database
}

func NewDatabase() (*Database, error) {
	ctx := context.TODO()
	environment := os.Getenv("APP_ENV")
	var connectionURI string
	var dataBase string

	if environment == "production" {
		log.Println("Este es un entorno de producción")
		if err := godotenv.Load(".env.production"); err != nil {
			log.Fatalf("Error loading .env.production file: %v", err)
		}
		dbUser := os.Getenv("MONGO_DB_USERNAME")
		dbPassword := os.Getenv("MONGO_DB_PASSWORD")
		authDatabase := os.Getenv("MONGO_DB_DATABASE")
		user := url.UserPassword(dbUser, dbPassword)
		connectionURI = fmt.Sprintf("mongodb://%s@localhost:27017/%s?authSource=%s", user.String(), dataBase, authDatabase)
	} else {
		log.Println("Este es un entorno local")
		if err := godotenv.Load(".env"); err != nil {
			log.Fatalf("Error loading .env file: %v", err)
		}
		connectionURI = "mongodb://localhost:27017"
	}
	dataBase = os.Getenv("MONGO_DB_DATABASE")
	if dataBase == "" {
		log.Printf("Base de datos '%s' no reconocida. Usando configuración por defecto.", dataBase)
		dataBase = "default_database_name"
	}
	clientOptions := options.Client().ApplyURI(connectionURI)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, fmt.Errorf("error al conectar a MongoDB: %v", err)
	}
	err = client.Ping(ctx, readpref.Primary())
	if err != nil {
		return nil, fmt.Errorf("error al hacer ping a MongoDB: %v", err)
	}
	
	log.Printf("Conectado a la base de datos '%s' en '%s'", dataBase, connectionURI)
	db := client.Database(dataBase)

	return &Database{
		client: client,
		ctx:    ctx,
		db:     db,
	}, nil
}

func (db *Database) Close() {
	if err := db.client.Disconnect(db.ctx); err != nil {
		log.Printf("Error al desconectar de la base de datos: %v", err)
	} else {
		log.Println("Desconectado de la base de datos correctamente")
	}
}

func (db *Database) GetCollection(collectionName string) *mongo.Collection {
	return db.db.Collection(collectionName)
}
