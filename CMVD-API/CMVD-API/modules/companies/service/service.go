package service

import (
    "log"
    "api/modules/companies/adapter/persistence"
    "api/modules/companies/domain"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "errors"
    "fmt"
    
)

type CompanyServiceImpl struct {
    companyRepository *persistence.Repository
}

func NewCompanyService() domain.UserService {
    repo, err := persistence.NewRepository()
    if err != nil {
        log.Fatal(err)
    }

    return &CompanyServiceImpl{
        companyRepository: repo,
    }
}
func (s *CompanyServiceImpl) GetAllCompanies(search string, page int, limit int, tokenClaims interface{}) ([]domain.Company, int, int, error) {
    claimsMap, ok := tokenClaims.(map[string]interface{})
    if !ok {
        return nil, 0, 0, errors.New("invalid tokenClaims format")
    }

    userRole, ok := claimsMap["role"].(string)
    if !ok {
        return nil, 0, 0, errors.New("role not found in tokenClaims")
    }

    var companies []domain.Company
    var totalRecords, totalPages int

    // Verificación del rol
    if userRole != "Super Admin" && userRole != "Admin" && userRole != "Cliente" {
        return nil, 0, 0, errors.New("El usuario no tiene permisos")
    }

    if userRole == "Cliente" {
        // Si el rol es Cliente, obtenemos solo una compañía
        companyIdStrIntf, ok := claimsMap["companyId"].(string)
        if !ok {
            return nil, 0, 0, errors.New("companyId not found in tokenClaims")
        }
        companyId, err := primitive.ObjectIDFromHex(companyIdStrIntf)
        if err != nil {
            return nil, 0, 0, err
        }
        company, err := s.companyRepository.GetCompany(companyId)
        if err != nil {
            return nil, 0, 0, fmt.Errorf("error fetching company: %v", err)
        }
        companies = append(companies, company)
        totalRecords = 1
        totalPages = 1
    } else {
        // Si el rol es Super Admin o otro, obtenemos todas las compañías
        var err error
        companies, totalPages, totalRecords, err = s.companyRepository.GetAllCompanies(search, page, limit)
        if err != nil {
            return nil, 0, 0, fmt.Errorf("error fetching companies: %v", err)
        }
    }

    return companies, totalPages, totalRecords, nil
}


func (s *CompanyServiceImpl) CreateCompany(company domain.CreateCompany, tokenClaims interface{}) (primitive.ObjectID, error) {
    userRol, ok := tokenClaims.(map[string]interface{})["role"].(string)
    if !ok {
        return primitive.NilObjectID, errors.New("role not found in tokenClaims")
    }

    if userRol != "Super Admin" && userRol != "Admin" {
        return primitive.NilObjectID, errors.New("El usuario no tiene permiso")
    }
    existingCompany, err := s.companyRepository.GetCompanyByEmail(company.Email)
    if err == nil {

        if existingCompany.UserId.IsZero(){
            companyDocument, err := domain.UpdateCompany(company)
            if err != nil {
                return primitive.NilObjectID, err
            }
            err = s.companyRepository.UpdateCompany(existingCompany.ID, companyDocument)
            if err != nil {
                return primitive.NilObjectID, err
            }
            return existingCompany.ID, nil
        }
        return primitive.NilObjectID, errors.New("La empresa ya existe con un user_id asignado")
    }
    companyDocument, err := domain.CreateNewCompany(company)
    if err != nil {
        return primitive.NilObjectID, err
    }
    err = s.companyRepository.InsertCompany(companyDocument)
    if err != nil {
        return primitive.NilObjectID, err
    }
     err = s.companyRepository.UpdateUserCompanyID(companyDocument.UserId,companyDocument.ID)
    if err != nil {
        return primitive.NilObjectID, err
    }
    
    return companyDocument.ID, nil
}

func (s *CompanyServiceImpl) GetCompany(companyId string, tokenClaims interface{}) (domain.Company, error) {
    userRole, ok := tokenClaims.(map[string]interface{})["role"].(string)
    if !ok {
        return domain.Company{}, errors.New("rol no encontrado en tokenClaims")
    }
    var companyID primitive.ObjectID
    var err error
    if userRole == "Super Admin" || userRole == "Cadete" || userRole == "Admin" {
        companyID, err = primitive.ObjectIDFromHex(companyId) 
    } else if userRole == "Cliente" {
        companyIDStr, ok := tokenClaims.(map[string]interface{})["companyId"].(string) 
        if !ok {
            return domain.Company{}, errors.New("companyId no encontrado en tokenClaims")
        }
        companyID, err = primitive.ObjectIDFromHex(companyIDStr)
    } else {
        return domain.Company{}, errors.New("el usuario no tiene permisos para acceder a esta compañía")
    }
    if err != nil {
        return domain.Company{}, errors.New("companyId inválido")
    }
    company, err := s.companyRepository.GetCompany(companyID)
    if err != nil {
        return domain.Company{}, err
    }
    return company, nil
}


func (s *CompanyServiceImpl) UpdateCompany(id string,company domain.CreateCompany, tokenClaims interface{}) error {
    userRol, ok := tokenClaims.(map[string]interface{})["role"].(string)
    if !ok {
        return errors.New("rol not found in tokenClaims")
    }
    var companyIdStr string
    if userRol != "Super Admin" && userRol != "Admin" && userRol != "Cliente"  {
        return errors.New("El usuario no tiene permisos")
    }

    if userRol == "Cliente" {
        companyIdStrIntf, ok := tokenClaims.(map[string]interface{})["companyId"].(string)
        if !ok {
            return errors.New("companyId not found in tokenClaims")
        }
        companyIdStr = companyIdStrIntf
    } else {
        companyIdStr = id
    }

    companyId, err := primitive.ObjectIDFromHex(companyIdStr)
    if err != nil {
        return err
    }

    companyDocument, err := domain.UpdateCompany(company)
    if err != nil {
        return err
    }
    fmt.Println("companyDocument==:", companyDocument)
    return s.companyRepository.UpdateCompany(companyId, companyDocument)
}

func (s *CompanyServiceImpl) GetAllBranches(search string, page int, limit int, tokenClaims interface{}) ([]domain.Branch, int, int, error) {

    companyIdStr, ok := tokenClaims.(map[string]interface{})["companyId"].(string)
    if !ok {
        return nil, 0, 0, errors.New("companyId not found in tokenClaims")
    }
    companyId, err := primitive.ObjectIDFromHex(companyIdStr)
    if err != nil {
        return nil, 0, 0, fmt.Errorf("invalid companyId format: %v", err)
    }

    branches, totalPages, totalRecords, err := s.companyRepository.GetAllBranches(companyId, search, page, limit)
    if err != nil {
        return nil, 0, 0, fmt.Errorf("error fetching branches: %v", err)
    }
    return branches, totalPages, totalRecords, nil
}
func (s *CompanyServiceImpl) CreateBranches(branch domain.Branch, tokenClaims interface{}) (primitive.ObjectID, error) {
	var companyId primitive.ObjectID

	claims, ok := tokenClaims.(map[string]interface{})
	if !ok {
		return primitive.NilObjectID, errors.New("invalid tokenClaims format")
	}

	userRole, ok := claims["role"].(string)
	if !ok {
		return primitive.NilObjectID, errors.New("role not found in tokenClaims")
	}

	if userRole != "Super Admin" && userRole != "Admin" {
		companyIdStr, ok := claims["companyId"].(string)
		if !ok {
			return primitive.NilObjectID, errors.New("companyId not found in tokenClaims")
		}
		var err error
		companyId, err = primitive.ObjectIDFromHex(companyIdStr)
		if err != nil {
			return primitive.NilObjectID, fmt.Errorf("invalid companyId format: %v", err)
		}
	} else {
		companyId = branch.ID 
	}
	branchDocument, err := domain.CreateBranches(branch)
	if err != nil {
		return primitive.NilObjectID, err
	}
	err = s.companyRepository.CreateBranches(companyId, branchDocument)
	if err != nil {
		return primitive.NilObjectID, fmt.Errorf("failed to create branch: %v", err)
	}
	return companyId, nil
}
func (s *CompanyServiceImpl) DeleteBranches(branchIdT string, tokenClaims interface{}) (primitive.ObjectID, error) {

    companyIdStr, ok := tokenClaims.(map[string]interface{})["companyId"].(string)
    if !ok {
        return primitive.NilObjectID, errors.New("companyId not found in tokenClaims")
    }
    companyId, err := primitive.ObjectIDFromHex(companyIdStr)
    if err != nil {
        return primitive.NilObjectID, fmt.Errorf("invalid companyId format: %v", err)
    }
    branches, _, _, err := s.companyRepository.GetAllBranches(companyId, "", 0, 0)
    if err != nil {
        return primitive.NilObjectID, fmt.Errorf("error fetching branches: %v", err)
    }
    if len(branches) <= 1 {
        return primitive.NilObjectID, errors.New("no se puede eliminar la última sucursal, debe existir al menos una sucursal")
    }
    branchId,err := primitive.ObjectIDFromHex(branchIdT)
    if err != nil {
        return primitive.NilObjectID, fmt.Errorf("invalid branchId format: %v", err)
    }
    err = s.companyRepository.DeleteBranches(companyId, branchId)
    if err != nil {
        return primitive.NilObjectID, fmt.Errorf("failed to delete branch: %v", err)
    }
    return companyId, nil
}
func (s *CompanyServiceImpl) GetBranche(branchIdT string, tokenClaims interface{}) (domain.Branch, error) {
    companyIdStr, ok := tokenClaims.(map[string]interface{})["companyId"].(string)
    if !ok {
        return domain.Branch{}, errors.New("companyId not found in tokenClaims")
    }
    companyId, err := primitive.ObjectIDFromHex(companyIdStr)
    if err != nil {
        return domain.Branch{}, fmt.Errorf("invalid companyId format: %v", err)
    }
    branchId, err := primitive.ObjectIDFromHex(branchIdT)
    if err != nil {
        return domain.Branch{}, fmt.Errorf("invalid branchId format: %v", err)
    }
    branch, err := s.companyRepository.GetBranche(companyId, branchId)
    if err != nil {
        return domain.Branch{}, fmt.Errorf("failed to get branch: %v", err)
    }

    return branch, nil
}
func (s *CompanyServiceImpl) UpdateBranches(id string,branch domain.Branch, tokenClaims interface{}) (primitive.ObjectID, error) {
    companyIdStr, ok := tokenClaims.(map[string]interface{})["companyId"].(string)
    if !ok {
        return primitive.NilObjectID, errors.New("companyId not found in tokenClaims")
    }
    companyId, err := primitive.ObjectIDFromHex(companyIdStr)
    if err != nil {
        return primitive.NilObjectID, fmt.Errorf("invalid companyId format: %v", err)
    }
    brancheId, err := primitive.ObjectIDFromHex(id)
    if err != nil {
        return primitive.NilObjectID, fmt.Errorf("invalid companyId format: %v", err)
    }
    branchDocument, err := domain.UpdateBranches(branch)
    if err != nil {
        return primitive.NilObjectID, err
    }
    err = s.companyRepository.UpdateBranches(brancheId,companyId, branchDocument)
    if err != nil {
        return primitive.NilObjectID, fmt.Errorf("failed to create branch: %v", err)
    }
    return companyId, nil
}
func (s *CompanyServiceImpl) DeleteCompany(id string, tokenClaims interface{}) (primitive.ObjectID, error) {
    userRole, ok := tokenClaims.(map[string]interface{})["role"].(string)
    if !ok {
        return primitive.NilObjectID, errors.New("rol no encontrado en tokenClaims")
    }

    if userRole != "Super Admin" {
        return primitive.NilObjectID, errors.New("el usuario no tiene permisos para eliminar")
    }

    companyId, err := primitive.ObjectIDFromHex(id)
    if err != nil {
        return primitive.NilObjectID, fmt.Errorf("invalid companyId format: %v", err)
    }

    err = s.companyRepository.DeleteCompany(companyId)
    if err != nil {
        return primitive.NilObjectID, fmt.Errorf("failed to delete company: %v", err)
    }

    return companyId, nil
}
