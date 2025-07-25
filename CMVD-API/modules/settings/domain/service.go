package domain

type CalculateService interface {
    GetAllSettings( tokenClaims interface{}) ( interface{}, error)
    UpdateSettings(settings SettingsUpdate,tokenClaims interface{}) ( Settings, error)
}

