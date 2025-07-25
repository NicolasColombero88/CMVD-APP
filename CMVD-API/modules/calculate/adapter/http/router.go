package http

import (
    
	"github.com/gin-gonic/gin"
)

func ConfigureRouter(basepath *gin.RouterGroup) {
	
	basepath.POST("/calculate", Calculate)
}


