package http

import (
    
	"github.com/gin-gonic/gin"
	"api/modules/auth/adapter"
)

func ConfigureRouter(basepath *gin.RouterGroup) {
	var publicKey="LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZ3d0RRWUpLb1pJaHZjTkFRRUJCUUFEU3dBd1NBSkJBTzVIKytVM0xrWC91SlRvRHhWN01CUURXSTdGU0l0VQpzY2xhRSs5WlFIOUNlaThiMXFFZnJxR0hSVDVWUis4c3UxVWtCUVpZTER3MnN3RTVWbjg5c0ZVQ0F3RUFBUT09Ci0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLQ=="
	basepath.POST("/notifications/token", adapter.AuthMiddleware(publicKey), TokenNotification)
	basepath.POST("/notifications/", adapter.AuthMiddleware(publicKey), CreateNotification)
	basepath.GET("/notifications/", adapter.AuthMiddleware(publicKey), GetAllNotifications)
	basepath.GET("/notifications/unread-count", adapter.AuthMiddleware(publicKey), GetUnreadCount)
	basepath.PATCH("/notifications/read", adapter.AuthMiddleware(publicKey), MarkAllAsRead)
}


