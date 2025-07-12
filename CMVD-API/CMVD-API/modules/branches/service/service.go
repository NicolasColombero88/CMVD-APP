package service

import (
    "log"
    "api/modules/branches/adapter/persistence"
    "api/modules/branches/domain"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "errors"
)

type CompanyServiceImpl struct {
    companyRepository *persistence.Repository
}

func NewUserService() domain.UserService {
    repo, err := persistence.NewRepository()
    if err != nil {
        log.Fatal(err)
    }

    return &CompanyServiceImpl{
        companyRepository: repo,
    }
}

func (s *CompanyServiceImpl) CreateBranch(branch domain.CreateBranch, tokenClaims interface{}) error {
    branchDocument, err := domain.CreateNewBranch(branch)
    if err != nil {
        return err
    }
    userRol, ok := tokenClaims.(map[string]interface{})["role"].(string)
    if !ok {
        return errors.New("userRol not found in tokenClaims")
    }
    var companyIdStr string

    if userRol == "Admin" {
        companyIdStrIntf, ok := tokenClaims.(map[string]interface{})["companyId"].(string)
        if !ok {
            return errors.New("companyId not found in tokenClaims")
        }
        companyIdStr = companyIdStrIntf
    } else {
        companyIdStr = branch.CompanyId
    }
    companyId, err := primitive.ObjectIDFromHex(companyIdStr)
    if err != nil {
        return err
    }
    return s.companyRepository.InsertBranch(companyId, branchDocument)
}

func (s *CompanyServiceImpl) UpdateBranche(branch domain.SetBranch, branchID string, tokenClaims interface{}) error {
    branchDocument, err := domain.SetUpdateBranch(branch)
    if err != nil {
        return err
    }
    userRol, ok := tokenClaims.(map[string]interface{})["role"].(string)
    if !ok {
        return errors.New("userRol not found in tokenClaims")
    }
    var companyIdStr string

    if userRol == "Admin" {
        companyIdStrIntf, ok := tokenClaims.(map[string]interface{})["companyId"].(string)
        if !ok {
            return errors.New("companyId not found in tokenClaims")
        }
        companyIdStr = companyIdStrIntf
    } else {
        companyIdStr = ""
    }

    var companyId primitive.ObjectID
    if companyIdStr != "" {
        companyId, err = primitive.ObjectIDFromHex(companyIdStr)
        if err != nil {
            return err
        }
    }

    branchObjectID, err := primitive.ObjectIDFromHex(branchID)
    if err != nil {
        return err
    }

    return s.companyRepository.UpdateBranche(companyId, branchObjectID, branchDocument)
}

