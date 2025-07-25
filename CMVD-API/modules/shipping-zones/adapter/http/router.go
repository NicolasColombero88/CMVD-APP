package http

import (
    
	"github.com/gin-gonic/gin"
	"api/modules/auth/adapter"
)

func ConfigureRouter(basepath *gin.RouterGroup) {
	var publicKey="LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZ3d0RRWUpLb1pJaHZjTkFRRUJCUUFEU3dBd1NBSkJBTzVIKytVM0xrWC91SlRvRHhWN01CUURXSTdGU0l0VQpzY2xhRSs5WlFIOUNlaThiMXFFZnJxR0hSVDVWUis4c3UxVWtCUVpZTER3MnN3RTVWbjg5c0ZVQ0F3RUFBUT09Ci0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLQ=="
	basepath.POST("/shipping-zones", adapter.AuthMiddleware(publicKey), CreateShippingZones)
	basepath.GET("/shipping-zones", adapter.AuthMiddleware(publicKey), GetAllShippingZones)
	basepath.GET("/shipping-zones/areas", GetAllAreas)
	basepath.GET("/shipping-zones/:id", adapter.AuthMiddleware(publicKey), GetShippingZone)
	basepath.PUT("/shipping-zones/:id", adapter.AuthMiddleware(publicKey), UpdateShippingZones)
	basepath.DELETE("/shipping-zones/:id", adapter.AuthMiddleware(publicKey), DeleteShippingZones)
}


