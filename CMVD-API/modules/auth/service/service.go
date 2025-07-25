package service

import (
    "log"
    "api/modules/auth/domain"
    "api/modules/auth/adapter/persistence"
    "api/modules/companies/service"
    "api/modules/auth/adapter"
    "go.mongodb.org/mongo-driver/mongo"
    "fmt"
    "time"
)

var companyService = service.NewCompanyService()

type UserServiceImpl struct {
    userRepository *persistence.Repository
}

func NewUserService() domain.UserService {
    repo, err := persistence.NewRepository()
    if err != nil {
        log.Fatal(err)
    }

    return &UserServiceImpl{
        userRepository: repo,
    }
}

func (s *UserServiceImpl) Auth(email, password string) (string, error) {
    user, err := s.userRepository.GetUserByEmail(email)
    if err != nil {
        return "", err
    }
    if user.Status != "activo" &&  user.Role != "Super Admin" {
        return "", fmt.Errorf("El estado del usuario no es 'activo': %s", user.Status)
    }
    if err := adapter.VerifyPassword(user.Password, password); err != nil {
        return "", err
    }

    userAuthData := domain.UserAuth(user)
    token, err := adapter.CreateToken(24 * time.Hour, userAuthData, "LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlCUEFJQkFBSkJBTzVIKytVM0xrWC91SlRvRHhWN01CUURXSTdGU0l0VXNjbGFFKzlaUUg5Q2VpOGIxcUVmCnJxR0hSVDVWUis4c3UxVWtCUVpZTER3MnN3RTVWbjg5c0ZVQ0F3RUFBUUpCQUw4ZjRBMUlDSWEvQ2ZmdWR3TGMKNzRCdCtwOXg0TEZaZXMwdHdtV3Vha3hub3NaV0w4eVpSTUJpRmI4a25VL0hwb3piTnNxMmN1ZU9wKzVWdGRXNApiTlVDSVFENm9JdWxqcHdrZTFGY1VPaldnaXRQSjNnbFBma3NHVFBhdFYwYnJJVVI5d0loQVBOanJ1enB4ckhsCkUxRmJxeGtUNFZ5bWhCOU1HazU0Wk1jWnVjSmZOcjBUQWlFQWhML3UxOVZPdlVBWVd6Wjc3Y3JxMTdWSFBTcXoKUlhsZjd2TnJpdEg1ZGdjQ0lRRHR5QmFPdUxuNDlIOFIvZ2ZEZ1V1cjg3YWl5UHZ1YStxeEpXMzQrb0tFNXdJZwpQbG1KYXZsbW9jUG4rTkVRdGhLcTZuZFVYRGpXTTlTbktQQTVlUDZSUEs0PQotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQ==")
    if err != nil {
        return "", err
    }

    return token, nil
}

func (s *UserServiceImpl) Register(userProfile domain.UserProfile) (string, error) {
    _, err := s.userRepository.GetUserByEmail(userProfile.Email)
    if err == nil {
        return "", fmt.Errorf("ya existe un usuario con el correo %s", userProfile.Email)
    } else if err != nil && err != mongo.ErrNoDocuments {
        return "", err
    }
    _, err = s.userRepository.GetCompanyEmail(userProfile.Email)
    if err == nil {
        return "", fmt.Errorf("ya existe una empresa con el correo %s", userProfile.Email)
    } else if err != nil && err != mongo.ErrNoDocuments {
        return "", err
    }
    hashedPassword, err := adapter.HashPassword(userProfile.Password)
    if err != nil {
        return "", err
    }
    userProfile.Password = hashedPassword

    userDocument, companyDocument, err := domain.Register(userProfile)
    if err != nil {
        return "", err
    }

    err = s.userRepository.InsertUser(userDocument)
    if err != nil {
        return "", err
    }
    err = s.userRepository.InsertCompany(companyDocument)
    if err != nil {
        deleteErr := s.userRepository.DeleteUser(userDocument.ID)
        if deleteErr != nil {
            return "", fmt.Errorf("error al eliminar usuario después de fallo al insertar empresa: %v", deleteErr)
        }
        return "", err
    }

    userAuthData := domain.UserAuth(*userDocument)
    token, err := adapter.CreateToken(24 * time.Hour, userAuthData, "LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlCUEFJQkFBSkJBTzVIKytVM0xrWC91SlRvRHhWN01CUURXSTdGU0l0VXNjbGFFKzlaUUg5Q2VpOGIxcUVmCnJxR0hSVDVWUis4c3UxVWtCUVpZTER3MnN3RTVWbjg5c0ZVQ0F3RUFBUUpCQUw4ZjRBMUlDSWEvQ2ZmdWR3TGMKNzRCdCtwOXg0TEZaZXMwdHdtV3Vha3hub3NaV0w4eVpSTUJpRmI4a25VL0hwb3piTnNxMmN1ZU9wKzVWdGRXNApiTlVDSVFENm9JdWxqcHdrZTFGY1VPaldnaXRQSjNnbFBma3NHVFBhdFYwYnJJVVI5d0loQVBOanJ1enB4ckhsCkUxRmJxeGtUNFZ5bWhCOU1HazU0Wk1jWnVjSmZOcjBUQWlFQWhML3UxOVZPdlVBWVd6Wjc3Y3JxMTdWSFBTcXoKUlhsZjd2TnJpdEg1ZGdjQ0lRRHR5QmFPdUxuNDlIOFIvZ2ZEZ1V1cjg3YWl5UHZ1YStxeEpXMzQrb0tFNXdJZwpQbG1KYXZsbW9jUG4rTkVRdGhLcTZuZFVYRGpXTTlTbktQQTVlUDZSUEs0PQotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQ==")
    if err != nil {
        return "", err
    }
    htmlContent := `
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gracias por Registrarte - Cadetería MVD</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                background-color: #f4f4f9;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                text-align: center;
            }
    
            .container {
                background-color: #fff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                max-width: 500px;
                width: 100%;
            }
    
            h1 {
                color: #2d3e50;
                font-size: 2em;
                margin-bottom: 15px;
            }
    
            p {
                color: #5a6d74;
                font-size: 1.2em;
                margin-bottom: 20px;
            }
    
            .btn {
                background-color: #2d98da;
                color: white;
                padding: 10px 20px;
                font-size: 1.1em;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                text-decoration: none;
            }
    
            .btn:hover {
                background-color: #1e75a8;
            }
    
            .footer {
                margin-top: 20px;
                color: #868686;
                font-size: 0.9em;
            }
        </style>
    </head>
    <body>
    
        <div class="container">
            <h1>¡Gracias por Registrarte!</h1>
            <p>Estás a un paso de disfrutar de todos los beneficios de <strong>Cadetería MVD</strong>.</p>
            <p>Tu cuenta ha sido creada exitosamente. Ahora puedes comenzar a gestionar tus pedidos y disfrutar de un servicio rápido y confiable.</p>
            
            <a href="https://app.cadeteria-mvd.com/waybills" class="btn">Ir al Dashboard</a>
            
            <div class="footer">
                <p>Cadetería MVD &copy; 2024</p>
            </div>
        </div>
    
    </body>
    </html>
    `
    err = s.userRepository.Email(userProfile.Email, userProfile.UserName, "Registro", htmlContent)
    if err != nil {
        fmt.Printf("Error al enviar el correo: %v\n", err)
    }
    return token, nil
}
func (s *UserServiceImpl) Recovery(email string) (string, error) {
    user, err := s.userRepository.GetUserByEmail(email)
    if err != nil {
        return "", fmt.Errorf("error al obtener el usuario: %w", err)
    }

    recovery := domain.SetRecovery()
    err = s.userRepository.UpdateUser(user.ID, recovery)
    if err != nil {
        return "", fmt.Errorf("error al actualizar el usuario con el PIN de recuperación: %w", err)
    }

    htmlContent := fmt.Sprintf(`
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f9f9f9;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                .header {
                    background-color: #4caf50;
                    color: #ffffff;
                    text-align: center;
                    padding: 20px;
                }
                .content {
                    padding: 20px;
                    color: #333333;
                }
                .content p {
                    margin: 10px 0;
                }
                .footer {
                    text-align: center;
                    padding: 10px;
                    background-color: #f1f1f1;
                    font-size: 12px;
                    color: #666666;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Cambio de Contraseña</h1>
                </div>
                <div class="content">
                    <p>Hola %s,</p>
                    <p>Hemos recibido una solicitud para cambiar tu contraseña.</p>
                    <p>Tu código de recuperación es:</p>
                    <h2 style="text-align: center; color: #4caf50;">%s</h2>
                    <p>Este código es válido por 15 minutos. Si no solicitaste un cambio de contraseña, por favor ignora este mensaje.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 Cadetería MVD. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>
    `, user.Name, recovery.RecoveryPin)

    err = s.userRepository.Email(user.Email,user.Name,  "Código de Recuperación", htmlContent)
    if err != nil {
        return "", fmt.Errorf("error al enviar el correo de recuperación: %w", err)
    }

    return "Correo enviado correctamente", nil
}
func (s *UserServiceImpl) RecoveryPassword(userP domain.UserPassword) (string, error) {
    user, err := s.userRepository.GetUserByEmail(userP.Email)
    if err != nil {
        return "", fmt.Errorf("error al obtener el usuario: %w", err)
    }
    if user.RecoveryPin != "" && user.RecoveryPin == userP.RecoveryPin {
        hashedPassword, err := adapter.HashPassword(userP.Password)
        if err != nil {
            return "", fmt.Errorf("error al hashear la contraseña: %w", err)
        }
        
        userP.Password = hashedPassword
        recovery := domain.SetRecoveryPassword(userP)

        err = s.userRepository.UpdateUser(user.ID, recovery)
        if err != nil {
            return "", fmt.Errorf("error al actualizar el usuario con el PIN de recuperación: %w", err)
        }

        return "Contraseña actualizada exitosamente", nil
    }

    return "", fmt.Errorf("PIN de recuperación inválido")
}
