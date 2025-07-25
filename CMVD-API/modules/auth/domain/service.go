package domain

type UserService interface {
    Auth(email string, password string) (string, error)
    Register( user UserProfile) (string, error)
    Recovery( email string) (string, error)
    RecoveryPassword( userP UserPassword) (string, error)
}
