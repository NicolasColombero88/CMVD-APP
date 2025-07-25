package http

import (
    
	"github.com/gin-gonic/gin"
	"api/modules/auth/adapter"
)

func ConfigureRouter(basepath *gin.RouterGroup) {
	var publicKey="LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZ3d0RRWUpLb1pJaHZjTkFRRUJCUUFEU3dBd1NBSkJBTzVIKytVM0xrWC91SlRvRHhWN01CUURXSTdGU0l0VQpzY2xhRSs5WlFIOUNlaThiMXFFZnJxR0hSVDVWUis4c3UxVWtCUVpZTER3MnN3RTVWbjg5c0ZVQ0F3RUFBUT09Ci0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLQ=="
	basepath.POST("/users", adapter.AuthMiddleware(publicKey), CreateUser)
	basepath.GET("/users", adapter.AuthMiddleware(publicKey), GetAllUsers)
	basepath.GET("/users/email/:email", adapter.AuthMiddleware(publicKey), GetUserEmail)
	basepath.PUT("/users/:id", adapter.AuthMiddleware(publicKey), UpdateUser)
	basepath.PUT("/users/account", adapter.AuthMiddleware(publicKey), UpdateAccount)
	basepath.GET("/users/:id", adapter.AuthMiddleware(publicKey), GetUser)
	basepath.GET("/users/token", adapter.AuthMiddleware(publicKey), GetAllUsersToken)
	basepath.PUT("/users/password", adapter.AuthMiddleware(publicKey), UpdatePassword)
	basepath.DELETE("/users/:id", adapter.AuthMiddleware(publicKey), DeleteUser)
	
}


