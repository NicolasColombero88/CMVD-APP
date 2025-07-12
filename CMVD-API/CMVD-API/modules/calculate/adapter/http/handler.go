package http
import (
	"github.com/gin-gonic/gin"
	"net/http"
	"api/modules/calculate/service" 
	"api/modules/calculate/domain" 
)
var calculateService = service.NewCalculateService()

func Calculate(c *gin.Context) {
    var calculate domain.Calculate
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        tokenClaims=nil
    }
    if err := c.ShouldBindJSON(&calculate); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Datos de envio no válidos","error":err.Error()})
        return
    }
    value,err := calculateService.Calculate(calculate,tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"Mensaje": "Error en la operacion", "error": err.Error()})
    } else {
        c.JSON(http.StatusOK, value)
    }
}