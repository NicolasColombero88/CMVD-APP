package http
import (
	"github.com/gin-gonic/gin"
	"net/http"
	"api/modules/settings/service" 
    "api/modules/settings/domain" 
    "fmt"
)
var SettingsService = service.NewSettingsService()

func GetAllSettings(c *gin.Context) {
   
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        tokenClaims=nil
    }
    value,err := SettingsService.GetAllSettings(tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"Mensaje": "Error en la operacion", "error": err.Error()})
    } else {
        c.JSON(http.StatusOK, value)
    }
}
func UpdateSettings(c *gin.Context) {
    var updateData domain.SettingsUpdate
    tokenClaims, exists := c.Get("tokenClaims")
    
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }

    if err := c.ShouldBindJSON(&updateData); err != nil {
        fmt.Println("Error al bind JSON:", err.Error())
        c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Datos de configuración no válidos", "error": err.Error()})
        return
    }

    fmt.Printf("Update data received: %+v\n", updateData)
    updatedSettings, err := SettingsService.UpdateSettings(updateData, tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"Mensaje": "Error en la actualización", "error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"Mensaje": "Configuración actualizada con éxito", "data": updatedSettings})
}