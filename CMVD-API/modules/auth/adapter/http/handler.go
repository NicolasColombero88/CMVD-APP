package http

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"api/modules/auth/service" 
	"api/modules/auth/domain"
    "fmt"

)
var userService = service.NewUserService()

func Auth(c *gin.Context) {
    var user domain.SignUpInput
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Error al analizar la solicitud"})
		return
	}

	token, err := userService.Auth(user.Email, user.Password)

	if err != nil {
		// Agregar registro de errores
		fmt.Println("Error en la autenticación:", err)
		c.JSON(http.StatusConflict, gin.H{"Mensaje": "Error con credenciales o usuario inactivo","error":err.Error()})
	} else {
		c.JSON(http.StatusOK, gin.H{"Token": token})
	}
}
func Register(c *gin.Context) {
    var user domain.UserProfile
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Error al analizar la solicitud"})
		return
	}
	token, err := userService.Register(user)

	if err != nil {
		fmt.Println("Error en la autenticación:", err)
		c.JSON(http.StatusConflict, gin.H{"Mensaje": "Error al crear empresa","error":err.Error()})
	} else {
		c.JSON(http.StatusOK, gin.H{"Token": token})
	}
	
}
func Recovery(c *gin.Context) {
    var user domain.RecoveryInput
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"mensaje": "Error al analizar la solicitud"})
		return
	}
	message, err := userService.Recovery(user.Email)
    if err != nil {
        fmt.Println("Error al enviar el correo de recuperación:", err)
        c.JSON(http.StatusInternalServerError, gin.H{
            "message": "Ocurrió un error al intentar enviar el correo de recuperación.",
            "error":   err.Error(),
        })
        return
    }
    c.JSON(http.StatusOK, gin.H{
        "message": message,
    })
}

func RecoveryPassword(c *gin.Context) {
    var user domain.UserPassword
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Error al analizar la solicitud"})
		return
	}
	_, err := userService.RecoveryPassword(user)

	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"mensaje": "Error cambiar la clave","error":   err.Error()})
	} else {
		c.JSON(http.StatusOK, gin.H{"mensaje": "Clave cambiada correctemente"})
	}
	
}