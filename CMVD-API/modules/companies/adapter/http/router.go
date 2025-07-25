package http

import (
    
	"github.com/gin-gonic/gin"
	"api/modules/auth/adapter"
)

func ConfigureRouter(basepath *gin.RouterGroup) {
	var publicKey="LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZ3d0RRWUpLb1pJaHZjTkFRRUJCUUFEU3dBd1NBSkJBTzVIKytVM0xrWC91SlRvRHhWN01CUURXSTdGU0l0VQpzY2xhRSs5WlFIOUNlaThiMXFFZnJxR0hSVDVWUis4c3UxVWtCUVpZTER3MnN3RTVWbjg5c0ZVQ0F3RUFBUT09Ci0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLQ=="
	basepath.POST("/companies", adapter.AuthMiddleware(publicKey), CreateCompany)
	basepath.PUT("/companies/:id", adapter.AuthMiddleware(publicKey), UpdateCompany)
	basepath.GET("/companies", adapter.AuthMiddleware(publicKey), GetAllCompanies)
	basepath.GET("/companies/branches", adapter.AuthMiddleware(publicKey), GetAllBranches)
	basepath.POST("/companies/branches", adapter.AuthMiddleware(publicKey), CreateBranches)
	basepath.PUT("/companies/branches/:id", adapter.AuthMiddleware(publicKey), UpdateBranches)
	basepath.DELETE("/companies/branches/:id", adapter.AuthMiddleware(publicKey), DeleteBranches)
	basepath.GET("/companies/branches/:id", adapter.AuthMiddleware(publicKey), GetBranche)
	basepath.GET("/companies/:id", adapter.AuthMiddleware(publicKey), GetCompany)
	basepath.DELETE("/companies/:id", adapter.AuthMiddleware(publicKey), DeleteCompany)
}


