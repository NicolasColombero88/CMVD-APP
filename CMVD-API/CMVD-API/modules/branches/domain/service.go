package domain

type UserService interface {
    CreateBranch(branch CreateBranch,tokenClaims interface{}) error
    UpdateBranche(branch SetBranch,branchId string,tokenClaims interface{}) error
}
