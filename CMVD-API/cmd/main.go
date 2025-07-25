package main

import (
    "log"
    "github.com/gin-gonic/gin"
    authHTTP "api/modules/auth/adapter/http"
    userHTTP "api/modules/users/adapter/http"
    companyHTTP "api/modules/companies/adapter/http"
    waybillHTTP "api/modules/waybill/adapter/http"
    zoneHTTP "api/modules/shipping-zones/adapter/http"
    calculateHTTP "api/modules/calculate/adapter/http"
    settingsHTTP "api/modules/settings/adapter/http"
    "github.com/joho/godotenv"
    "github.com/gin-contrib/cors"
    "time"
    "os"
)

var (
    server *gin.Engine
    err    error
)
func main() {
   
    appEnv := os.Getenv("APP_ENV")
    if appEnv == "env" {
        if err := godotenv.Load(".env"); err != nil {
            log.Fatalf("Error loading .env file: %v", err)
        }
    } else if appEnv == "production" {
        if err := godotenv.Load(".env.production"); err != nil {
            log.Fatalf("Error loading .env.production file: %v", err)
        }
    } else {
        if err := godotenv.Load(".env"); err != nil {
            log.Fatalf("Error loading .env file: %v", err)
        }
        log.Printf("APP_ENV '%s' is not recognized. Using default configuration.", appEnv)
    }
    appPort := os.Getenv("PORT")
    appEnv = os.Getenv("APP_ENV")
    log.Printf("APP_ENV: %v", appEnv)
    server = gin.Default()
    server.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"*"}, 
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Content-Type", "Authorization"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
        MaxAge:           12 * time.Hour,
    }))
    basepath := server.Group("/v1")
    authHTTP.ConfigureRouter(basepath)
    userHTTP.ConfigureRouter(basepath)
    companyHTTP.ConfigureRouter(basepath)
    waybillHTTP.ConfigureRouter(basepath)
    zoneHTTP.ConfigureRouter(basepath)
    calculateHTTP.ConfigureRouter(basepath)
    settingsHTTP.ConfigureRouter(basepath)
    if err := server.Run(appPort); err != nil {
        log.Fatal("Error al iniciar el servidor:", err)
    }
}
