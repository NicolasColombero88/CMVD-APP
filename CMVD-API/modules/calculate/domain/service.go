package domain

type CalculateService interface {
    Calculate(calculate Calculate, tokenClaims interface{}) ( interface{}, error)
}

