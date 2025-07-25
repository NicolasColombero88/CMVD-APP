package domain
import "go.mongodb.org/mongo-driver/bson/primitive"
type UserService interface {
    CreateCompany(company CreateCompany,tokenClaims interface{}) (primitive.ObjectID, error)
    UpdateCompany(id string,company CreateCompany,tokenClaims interface{}) error
    GetAllCompanies(search string, page int, limit int,tokenClaims interface{}) ([]Company, int, int, error) 
    GetCompany(companyID string,tokenClaims interface{}) (Company, error)
    GetAllBranches(search string, page int, limit int, tokenClaims interface{}) ([]Branch, int, int, error)
    CreateBranches(branch Branch, tokenClaims interface{}) (primitive.ObjectID, error)
    UpdateBranches(id string,branch Branch, tokenClaims interface{}) (primitive.ObjectID, error)
    DeleteBranches(branchIdT string, tokenClaims interface{}) (primitive.ObjectID, error)
    GetBranche(branchIdT string, tokenClaims interface{}) (Branch, error)   
    DeleteCompany(id string,tokenClaims interface{}) (primitive.ObjectID, error)
}
