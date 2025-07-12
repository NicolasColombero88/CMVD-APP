// En api/modules/auth/adapter/http/handler.go

package http

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"api/modules/users/service" 
	"api/modules/users/domain" 
    "go.mongodb.org/mongo-driver/bson/primitive" 
    "strconv"
)
var userService = service.NewUserService()
func CreateUser(c *gin.Context) {
    var createUser domain.CreateUser
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"mensaje": "Token claims not found"})
        return
    }
    if err := c.ShouldBindJSON(&createUser); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"mensaje": "Datos de usuario no válidos"})
        return
    }
    userId, err := userService.CreateUser(createUser, tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"mensaje":err.Error(), "error":"Error al crear Usuario"})
    } else {
        c.JSON(http.StatusOK, gin.H{"mensaje": "Usuario creado exitosamente", "id": userId})
    }
}
func GetAllUsers(c *gin.Context) {
    companyID := c.Query("company_id")
    role := c.Query("role")
    search := c.Query("search")
    page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
    if err != nil || page < 1 {
        c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid page parameter"})
        return
    }
    limit, err := strconv.Atoi(c.DefaultQuery("limit", "0"))
    if err != nil || limit < 0 {
        c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid limit parameter"})
        return
    }
    users, totalPages, totalUsers, err := userService.GetAllUsers(companyID, role, search, page, limit)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"message": "Error retrieving users", "error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{
        "data":       users,
        "total_pages": totalPages,
        "total_users": totalUsers,
    })
}
func GetUser(c *gin.Context) {
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
    users, err := userService.GetUser(objectID,tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"Mensaje": "Usuario no encontrado"})
    } else {
        c.JSON(http.StatusOK, gin.H{"data": users})
    }
}
func GetUserEmail(c *gin.Context) {
    email := c.Param("email")
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    users, err := userService.GetUserEmail(email,tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"Mensaje": "Usuario no encontrado"})
    } else {
        c.JSON(http.StatusOK, gin.H{"data": users})
    }
}
func UpdateUser(c *gin.Context) {
    userID := c.Param("id")
    var updatedUser domain.UpdateUser
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    if err := c.ShouldBindJSON(&updatedUser); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Datos de usuario no válidos"})
        return
    }

    objectID, err := primitive.ObjectIDFromHex(userID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "ID de usuario no válido 11"})
        return
    }
    err = userService.UpdateUser(objectID, updatedUser,tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"Mensaje": "Error al actualizar el usuario"})
    } else {
        c.JSON(http.StatusOK, gin.H{"Mensaje": "Usuario actualizado exitosamente","id":userID})
    }
}
func UpdatePassword(c *gin.Context) {
    var updatedUser domain.UpdatePassword
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"mensaje": "Token claims not found"})
        return
    }
    if err := c.ShouldBindJSON(&updatedUser); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"mensaje": "Datos de usuario no válidos"})
        return
    }

    err := userService.UpdatePassword(updatedUser, tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"mensaje": err.Error(),"error":"Error al actulizar"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"mensaje": "Usuario actualizado exitosamente"})
}
func GetAllUsersToken(c *gin.Context) {
    roles := []string{"Super Admin"}
    _, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    users, err := userService.GetAllUsersToken(roles)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"Mensaje": "Usuario no encontrado","error":err.Error()})
    } else {
        c.JSON(http.StatusOK, gin.H{"data": users})
    }
}
func DeleteUser(c *gin.Context) {
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
    err = userService.DeleteUser(objectID, tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"Mensaje": "Error al eliminar usuario"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"id": userID, "Mensaje": "Eliminado correctamente"})
}
func UpdateAccount(c *gin.Context) {
    var createUser domain.UpdateAccount
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"mensaje": "Token claims not found"})
        return
    }
    if err := c.ShouldBindJSON(&createUser); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"mensaje": "Datos de usuario no válidos"})
        return
    }
    userId, err := userService.UpdateAccount(createUser, tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"mensaje":err.Error(), "error":"Error al actulizar cuenta"})
    } else {
        c.JSON(http.StatusOK, gin.H{"mensaje": "Cuenta actulizada exitosamente", "id": userId})
    }
}
