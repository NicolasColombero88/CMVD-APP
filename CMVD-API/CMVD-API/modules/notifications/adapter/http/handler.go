// En api/modules/auth/adapter/http/handler.go

package http

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"api/modules/notifications/service" 
	"api/modules/notifications/domain" 
)
var  notificationService = service.NewUserService()

func TokenNotification(c *gin.Context) {
    var userToken domain.NotificationToken
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    if err := c.ShouldBindJSON(&userToken); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Datos de usuario no válidos"})
        return
    }
    tokenId, err := notificationService.TokenNotification(userToken, tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"Mensaje": "Error al guardar el token", "Error": err.Error()})
    } else {
        c.JSON(http.StatusOK, gin.H{"Mensaje": "Token guardado exitosamente", "id": tokenId})
    }
}
func CreateNotification(c *gin.Context) {
    var userToken domain.Message
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    if err := c.ShouldBindJSON(&userToken); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Datos de usuario no válidos"})
        return
    }
    tokenId, err := notificationService.NotificationPush(userToken, tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"Mensaje": "Error al guardar la Notificacion", "Error": err.Error()})
    } else {
        c.JSON(http.StatusOK, gin.H{"Mensaje": "Notificacion guardado exitosamente", "id": tokenId})
    }
}
func GetAllNotifications(c *gin.Context) {
    companyID := c.Query("company_id")
    role := c.Query("role")
    search := c.Query("search")
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    users, err := notificationService.GetAllNotifications(companyID,role,search,tokenClaims)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"Mensaje": "Error al obtener las notificaciones"})
        return
    }
   c.JSON(http.StatusOK, gin.H{"data": users})
}
func GetUnreadCount(c *gin.Context) {
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    users, err := notificationService.GetUnreadCount(tokenClaims)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"Mensaje": "Error al obtener las notificaciones"})
        return
    }
   c.JSON(http.StatusOK, gin.H{"data": users})
}
func MarkAllAsRead(c *gin.Context) {
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    users, err := notificationService.MarkAllAsRead(tokenClaims)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"Mensaje": "Error al obtener las notificaciones"})
        return
    }
   c.JSON(http.StatusOK, gin.H{"data": users})
}