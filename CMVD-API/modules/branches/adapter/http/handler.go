package http

import (
    "fmt"
    "github.com/gin-gonic/gin"
    "net/http"
    "api/modules/branches/service" 
    "api/modules/branches/domain" 
)

var userService = service.NewUserService()

func CreateBranch(c *gin.Context) {
    var createBranch domain.CreateBranch
    tokenClaims, exists := c.Get("tokenClaims")
    fmt.Println("Token completo:", tokenClaims)
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    if err := c.ShouldBindJSON(&createBranch); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Datos de sucursal no válidos"})
        return
    }

    err := userService.CreateBranch(createBranch,tokenClaims)

    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"Mensaje": "Error al crear la sucursal", "Error": err.Error()})
    } else {
        c.JSON(http.StatusOK, gin.H{"Mensaje": "sucursal creada exitosamente"})
    }
}
func UpdateBranche(c *gin.Context) {
    var updateBranch domain.SetBranch
    branchId := c.Param("id")
    tokenClaims, exists := c.Get("tokenClaims")
    fmt.Println("Token completo:", tokenClaims)
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    if err := c.ShouldBindJSON(&updateBranch); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Datos de sucursal no válidos"})
        return
    }

    err := userService.UpdateBranche(updateBranch,branchId,tokenClaims)

    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"Mensaje": "Error al actualizar la sucursal", "Error": err.Error()})
    } else {
        c.JSON(http.StatusOK, gin.H{"Mensaje": "sucursal actualizada exitosamente"})
    }
}
