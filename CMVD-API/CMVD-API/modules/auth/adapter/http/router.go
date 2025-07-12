package http

import (
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
)

func ConfigureRouter(basepath *gin.RouterGroup) {
	basepath.Use(cors.Default())
	basepath.POST("/auth", Auth)
	basepath.POST("/auth/register", Register)
	basepath.POST("/auth/recovery", Recovery)
	basepath.PUT("/auth/recovery", RecoveryPassword)
}
