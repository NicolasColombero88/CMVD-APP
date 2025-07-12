package http

import (
    
	"github.com/gin-gonic/gin"
	"api/modules/auth/adapter"
)

func ConfigureRouter(basepath *gin.RouterGroup) {
	var publicKey="LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZ3d0RRWUpLb1pJaHZjTkFRRUJCUUFEU3dBd1NBSkJBTzVIKytVM0xrWC91SlRvRHhWN01CUURXSTdGU0l0VQpzY2xhRSs5WlFIOUNlaThiMXFFZnJxR0hSVDVWUis4c3UxVWtCUVpZTER3MnN3RTVWbjg5c0ZVQ0F3RUFBUT09Ci0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLQ=="
	basepath.POST("/waybills", adapter.AuthMiddleware(publicKey), CreateWaybill)
	basepath.GET("/waybills", adapter.AuthMiddleware(publicKey), GetAllWaybill)
	basepath.GET("/waybills/:waybill_id", adapter.AuthMiddleware(publicKey), GetWaybill)
	basepath.DELETE("/waybills/:waybill_id", adapter.AuthMiddleware(publicKey),DeleteWaybill)
	basepath.POST("waybills/:waybill_id/history", adapter.AuthMiddleware(publicKey), CreateStatusHistory)
	basepath.POST("waybills/:waybill_id/payment", adapter.AuthMiddleware(publicKey), CreatePayment)
	basepath.PUT("/waybills/:waybill_id", adapter.AuthMiddleware(publicKey), UpdateWaybill)
	basepath.PUT("/waybills/:waybill_id/cadete", adapter.AuthMiddleware(publicKey), UpdateCadete)
	basepath.GET("/waybills/count", GetCountWithdrawalDate)
}


