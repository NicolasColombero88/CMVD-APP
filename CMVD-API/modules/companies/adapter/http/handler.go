// En api/modules/auth/adapter/http/handler.go

package http

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"api/modules/companies/service" 
	"api/modules/companies/domain" 
    "fmt"
    "strconv"
)
var userService = service.NewCompanyService()


func CreateCompany(c *gin.Context) {
    var createCompany domain.CreateCompany
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    if err := c.ShouldBindJSON(&createCompany); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Datos de compañia no válidos"})
        return
    }
    companyId,err := userService.CreateCompany(createCompany,tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"error": "Error al crear el compañia", "mensaje": err.Error()})
    } else {
        c.JSON(http.StatusOK, gin.H{"mensaje": "compañia creada exitosamente", "id": companyId})
    }
}
func GetAllCompanies(c *gin.Context) {
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"message": "Token claims not found"})
        return
    }

    search := c.Query("search")

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

    companies, totalPages, totalRecords, err := userService.GetAllCompanies(search, page, limit, tokenClaims)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "message": "Error al obtener las empresas",
            "error":   err.Error(),
        })
        return
    }
    if len(companies) == 0 {
        c.JSON(http.StatusOK, gin.H{
            "data":          []interface{}{},
            "total_pages":   0,
            "total_records": 0,
        })
        return
    }
    c.JSON(http.StatusOK, gin.H{
        "data":          companies,
        "total_pages":   totalPages,
        "total_records": totalRecords,
    })
}

func GetCompany(c *gin.Context) {
    companyID := c.Param("id")
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    company, err := userService.GetCompany(companyID, tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{
            "Mensaje": "Error al obtener la compañía", 
            "Error": err.Error(),
        })
        return
    }
    c.JSON(http.StatusOK, gin.H{
        "data": company,
    })
}
func UpdateCompany(c *gin.Context) {
    id := c.Param("id")
    var updateData domain.CreateCompany
    tokenClaims, exists := c.Get("tokenClaims")
   
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": " claims not found"})
        return
    }

    if err := c.ShouldBindJSON(&updateData); err != nil {
        fmt.Println("Error al bind JSON:", err.Error())
        c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Datos de compañia no válidos"})
        return
    }
    fmt.Printf("Update data received: %+v\n", updateData)

    err := userService.UpdateCompany(id,updateData, tokenClaims)

    if err != nil {
        fmt.Println("Error al actualizar compañia:", err.Error())
        c.JSON(http.StatusConflict, gin.H{"mensaje": "Error al actualizar la compañia", "error": err.Error()})
    } else {
        c.JSON(http.StatusOK, gin.H{"mensaje": "compañia actualizada exitosamente","id":id})
    }
}
func GetAllBranches(c *gin.Context) {
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"message": "Token claims not found"})
        return
    }

    search := c.Query("search")

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

    companies, totalPages, totalRecords, err := userService.GetAllBranches(search, page, limit, tokenClaims)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "message": "Error al obtener las empresas",
            "error":   err.Error(),
        })
        return
    }
    c.JSON(http.StatusOK, gin.H{
        "data":          companies,
        "total_pages":   totalPages,
        "total_records": totalRecords,
    })
}
func CreateBranches(c *gin.Context) {
    var createBranch domain.Branch
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    if err := c.ShouldBindJSON(&createBranch); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Datos de compañia no válidos"})
        return
    }
    companyId,err := userService.CreateBranches(createBranch,tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"error": "Error al crear la Sucursal", "mensaje": err.Error()})
    } else {
        c.JSON(http.StatusOK, gin.H{"mensaje": "Sucursal creada exitosamente", "id": companyId})
    }
}
func DeleteBranches(c *gin.Context) {
    branchId := c.Param("id")
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    _, err := userService.DeleteBranches(branchId, tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"error": "Error al eliminar la Sucursal", "mensaje": err.Error()})
    } else {
        c.JSON(http.StatusOK, gin.H{"mensaje": "Sucursal creada exitosamente", "id": branchId})
    }
}
func GetBranche(c *gin.Context) {
    branchId := c.Param("id")
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    branche, err := userService.GetBranche(branchId, tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"error": "Error al eliminar la Sucursal", "mensaje": err.Error()})
    } else {
        c.JSON(http.StatusOK, gin.H{"mensaje": "Sucursal creada exitosamente", "data": branche})
    }
}
func UpdateBranches(c *gin.Context) {
    var createBranch domain.Branch
    branchId := c.Param("id")
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    if err := c.ShouldBindJSON(&createBranch); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"Mensaje": "Datos de compañia no válidos"})
        return
    }
    companyId,err := userService.UpdateBranches(branchId,createBranch,tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"error": "Error al crear la Sucursal", "mensaje": err.Error()})
    } else {
        c.JSON(http.StatusOK, gin.H{"mensaje": "Sucursal creada exitosamente", "id": companyId})
    }
}
func DeleteCompany(c *gin.Context) {
    branchId := c.Param("id")
    tokenClaims, exists := c.Get("tokenClaims")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"Mensaje": "Token claims not found"})
        return
    }
    _, err := userService.DeleteCompany(branchId, tokenClaims)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"error": "Error al eliminar la empresa", "mensaje": err.Error()})
    } else {
        c.JSON(http.StatusOK, gin.H{"mensaje": "Empresa creada exitosamente", "id": branchId})
    }
}