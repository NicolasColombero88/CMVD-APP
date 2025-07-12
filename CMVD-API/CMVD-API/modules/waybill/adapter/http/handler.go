// En api/modules/auth/adapter/http/handler.go

package http

import (
	"api/modules/waybill/domain"
	"api/modules/waybill/service"
	"fmt"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
)

var waybillService = service.NewWaybillService()

func CreateWaybill(c *gin.Context) {
	var createBranch domain.Waybill
	tokenClaims, exists := c.Get("tokenClaims")
	fmt.Println("Token completo:", tokenClaims)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
		return
	}
	if err := c.ShouldBindJSON(&createBranch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Datos de Waybill no válidos", "Error": err.Error()})
		return
	}
	waybillID, err := waybillService.CreateWaybill(createBranch, tokenClaims)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"Mensaje": "Error al crear la sucursal", "Error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"Mensaje": "Waybill creada exitosamente", "id": waybillID})
}
func UpdateWaybill(c *gin.Context) {
	var updateData domain.UpdateWaybill
	tokenClaims, exists := c.Get("tokenClaims")
	fmt.Println("Token completo:", tokenClaims)

	waybillID := c.Param("waybill_id")

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
		return
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		fmt.Println("Error al bind JSON:", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Datos de Waybill no válidos"})
		return
	}

	fmt.Printf("Update data received: %+v\n", updateData)

	err := waybillService.UpdateWaybill(waybillID, updateData, tokenClaims)

	if err != nil {
		fmt.Println("Error al actualizar waybill:", err.Error())
		c.JSON(http.StatusConflict, gin.H{"mensaje": "Error al actualizar la waybill", "Error": err.Error()})
	} else {
		c.JSON(http.StatusOK, gin.H{"mensaje": "Waybill actualizada exitosamente", "id": waybillID})
	}
}
func GetAllWaybill(c *gin.Context) {
	status := c.Query("status")
	search := c.Query("search")
	cadeteId := c.Query("cadete_id")
	withdrawalAfter := c.Query("after")
	withdrawalBefore := c.Query("before")
	deliveryAfter := c.Query("delivery_after")
	deliveryBefore := c.Query("delivery_before")

	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid page parameter"})
		return
	}

	limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if err != nil || limit < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid limit parameter"})
		return
	}

	tokenClaims, exists := c.Get("tokenClaims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
		return
	}

	waybills, totalPages, totalRecords, err := waybillService.GetAllWaybill(tokenClaims, status, search, cadeteId, withdrawalAfter, withdrawalBefore, deliveryAfter, deliveryBefore, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Mensaje": "Error al obtener los waybills", "Error": err.Error()})
		return
	}

	if waybills == nil {
		c.JSON(http.StatusOK, gin.H{
			"data":          []interface{}{},
			"total_records": 0,
			"total_pages":   0,
			"currentPage":   page,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":          waybills,
		"total_records": totalRecords,
		"total_pages":   totalPages,
		"current_page":  page,
	})
}
func GetWaybill(c *gin.Context) {
	tokenClaims, exists := c.Get("tokenClaims")
	fmt.Println("Token completo:", tokenClaims)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
		return
	}
	waybillID := c.Param("waybill_id")
	users, err := waybillService.GetWaybill(waybillID, tokenClaims)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Mensaje": "Error al obtener los waybill", "Error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}
func CreateStatusHistory(c *gin.Context) {
	waybillID := c.Param("waybill_id")
	tokenClaims, exists := c.Get("tokenClaims")
	var statusHistoryData domain.SetStatusHistory
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
		return
	}
	if err := c.ShouldBindJSON(&statusHistoryData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Datos de status_history no válidos"})
		return
	}
	err := waybillService.CreateStatusHistory(waybillID, statusHistoryData, tokenClaims)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"mensaje": "Error al crear status_history", "Error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": waybillID, "mensaje": "Status history creado exitosamente"})
}
func CreatePayment(c *gin.Context) {
	var createPayment domain.Payment
	tokenClaims, exists := c.Get("tokenClaims")
	fmt.Println("Token completo:", tokenClaims)
	waybillID := c.Param("waybill_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
		return
	}
	if err := c.ShouldBindJSON(&createPayment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Datos de Waybill no válidos", "Error": err.Error()})
		return
	}
	payment, err := waybillService.CreatePayment(waybillID, createPayment, tokenClaims)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"Mensaje": "Error al crear la sucursal", "Error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"Mensaje": "Waybill creada exitosamente", "id": payment})
}
func DeleteWaybill(c *gin.Context) {
	tokenClaims, exists := c.Get("tokenClaims")
	fmt.Println("Token completo:", tokenClaims)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
		return
	}
	waybillID := c.Param("waybill_id")
	err := waybillService.DeleteWaybill(waybillID, tokenClaims)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"mensaje": "Error al eliminar la guia", "Error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"mensaje": "Guia eliminada exitosamente", "id": waybillID})
}
func UpdateCadete(c *gin.Context) {
	var updateData domain.Cadete
	tokenClaims, exists := c.Get("tokenClaims")
	fmt.Println("Token completo:", tokenClaims)

	waybillID := c.Param("waybill_id")

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
		return
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		fmt.Println("Error al bind JSON:", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Datos de Waybill no válidos"})
		return
	}

	fmt.Printf("Update data received 11: %+v\n", updateData)

	err := waybillService.UpdateCadete(waybillID, updateData, tokenClaims)

	if err != nil {
		fmt.Println("Error al actualizar waybill:", err.Error())
		c.JSON(http.StatusConflict, gin.H{"mensaje": "Error al actualizar la waybill", "Error": err.Error()})
	} else {
		c.JSON(http.StatusOK, gin.H{"mensaje": "Waybill actualizada exitosamente", "id": waybillID})
	}
}
func GetCountWithdrawalDate(c *gin.Context) {
	withdrawalDate := c.Query("withdrawal_date")

	totalRecords, err := waybillService.GetCountWithdrawalDate(withdrawalDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"mensaje": "Error al obtener los waybills",
			"error":   err.Error(),
		})
		return
	}

	// Convertir valores de entorno a enteros y manejar errores
	maxShipments := make([]int, 7)
	days := []string{"SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"}

	for i, day := range days {
		value, err := strconv.Atoi(os.Getenv("MAX_DAILY_SHIPMENTS_" + day))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"mensaje": fmt.Sprintf("Error al obtener MAX_DAILY_SHIPMENTS_%s", day),
				"error":   err.Error(),
			})
			return
		}
		maxShipments[i] = value
	}

	c.JSON(http.StatusOK, gin.H{
		"mensaje":       "Waybills obtenidos exitosamente",
		"data":          totalRecords,
		"max_shipments": maxShipments,
	})
}
