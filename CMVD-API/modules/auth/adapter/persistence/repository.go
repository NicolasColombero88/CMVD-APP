// auth/adapter/persistence/repository.go
package persistence

import (
    "api/modules/shared/adapter/persistence"
    "context"
    "time"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive" 
    "api/modules/auth/domain"
    "gopkg.in/gomail.v2"
    "strconv"
    "os"
    "github.com/joho/godotenv"
    "log"
    "fmt"
    "crypto/tls"
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
    usersCollection := r.database.GetCollection("users")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    _, err := usersCollection.InsertOne(ctx, userDocument)
    return err
}
func (r *Repository) GetUserByEmail(email string) (domain.User, error) {
    var user domain.User
    usersCollection := r.database.GetCollection("users")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    filter := bson.M{"email": email}
    err := usersCollection.FindOne(ctx, filter).Decode(&user)
	return user, err
}
func (r *Repository) GetCompanyEmail(email string) (domain.User, error) {
    var user domain.User
    companyCollection := r.database.GetCollection("companies")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    filter := bson.M{"email": email}
    err := companyCollection.FindOne(ctx, filter).Decode(&user)
    return user, err
}
func (r *Repository) InsertCompany(companyDocument interface{}) error {
    companyCollection := r.database.GetCollection("companies")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    _, err := companyCollection.InsertOne(ctx, companyDocument)
    return err
}
func (r *Repository) DeleteUser(userID primitive.ObjectID) error {
    usersCollection := r.database.GetCollection("users")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    filter := bson.M{"_id": userID}
    _, err := usersCollection.DeleteOne(ctx, filter)
    return err
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
func (r *Repository) UpdateUser(userID primitive.ObjectID, user interface{}) error {
	usersCollection := r.database.GetCollection("users")
	filter := bson.M{"_id": userID}
	update := bson.M{"$set": user}
	_, err := usersCollection.UpdateOne(context.TODO(), filter, update)
	return err
}
