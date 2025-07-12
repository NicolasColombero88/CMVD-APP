package http

import (
    "fmt"
    "github.com/gin-gonic/gin"
    "net/http"
    "api/modules/shipping-zones/service" 
    "api/modules/shipping-zones/domain"
    "strconv"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

var userService = service.NewUserService()

func CreateShippingZones(c *gin.Context) {
    var createShippingZone domain.SetShippingZone
    tokenClaims, exists := c.Get("tokenClaims")
    fmt.Println("Token completo:", tokenClaims)
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    if err := c.ShouldBindJSON(&createShippingZone); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"mensaje":err.Error(),"error": "Datos de zona no válidos" })
        return
    }
    shippingZoneId,err := userService.CreateShippingZone(createShippingZone,tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"error": "Error al crear la Zona", "mensaje": err.Error()})
    } else {
        c.JSON(http.StatusOK, gin.H{"mensaje": "Zona creada exitosamente", "id": shippingZoneId})
    }
}
func UpdateShippingZones(c *gin.Context) {
    shippingZoneID := c.Param("id")
    var createShippingZone domain.SetShippingZone2
    tokenClaims, exists := c.Get("tokenClaims")
    fmt.Println("Token completo:", tokenClaims)
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    if err := c.ShouldBindJSON(&createShippingZone); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Datos de zona no válidos"})
        return
    }

    err := userService.UpdateShippingZones(createShippingZone, shippingZoneID, tokenClaims)

    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"Mensaje": "Error al crear la zona", "Error": err.Error()})
    } else {
        c.JSON(http.StatusOK, gin.H{"mensaje": "Zona actulizada exitosamente", "id": shippingZoneID})
    }
}
func DeleteShippingZones(c *gin.Context) {
    shippingZoneID := c.Param("id")
    tokenClaims, exists := c.Get("tokenClaims")
    fmt.Println("Token completo:", tokenClaims)
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    err := userService.DeleteShippingZones( shippingZoneID, tokenClaims)

    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"Mensaje": "Error al crear la zona", "Error": err.Error()})
    } else {
        c.JSON(http.StatusOK, gin.H{"Mensaje": "zona Eliminada exitosamente"})
    }
}
func GetAllShippingZones(c *gin.Context) {
    search := c.Query("search")
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }

    page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
    if err != nil || page < 1 {
        c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid page parameter"})
        return
    }

    limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
    if err != nil || limit < 1 {
        c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid limit parameter"})
        return
    }

    shippingZones, totalPages, totalRecords, err := userService.GetAllShippingZones(search, page, limit,tokenClaims)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"message": "Error retrieving shipping zones", "error": err.Error()})
        return
    }
    if len(shippingZones) == 0 {
        c.JSON(http.StatusOK, gin.H{
            "data":          []interface{}{},
            "total_pages":   0,
            "total_records": 0,
        })
        return
    }
    c.JSON(http.StatusOK, gin.H{
        "data":         shippingZones,
        "total_pages":  totalPages,
        "total_records": totalRecords,
    })
}
func GetShippingZone(c *gin.Context) {
    userID := c.Param("id")
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    objectID, err := primitive.ObjectIDFromHex(userID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "ID de usuario no válido"})
        return
    }
    users, err := userService.GetShippingZone(objectID,tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"Mensaje": "Usuario no encontrado"})
    } else {
        c.JSON(http.StatusOK, gin.H{"data": users})
    }
}
func GetAllAreas(c *gin.Context) {
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        tokenClaims = nil
    }

    areas, err := userService.GetAllAreas(tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"Mensaje": "Usuario no encontrado"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"data": areas})
}
