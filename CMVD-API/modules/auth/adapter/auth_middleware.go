package adapter
import (
    "github.com/gin-gonic/gin"
    "net/http"
    "strings"
)

func AuthMiddleware(publicKey string) gin.HandlerFunc {
    return func(ctx *gin.Context) {
        authorizationHeader := ctx.GetHeader("Authorization")
        // Verifica si el encabezado "Authorization" está presente y tiene el formato "Bearer".
        if authorizationHeader == "" || !strings.HasPrefix(authorizationHeader, "Bearer ") {
            ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
            return
        }
        // Extrae el token del encabezado.
        token := strings.TrimPrefix(authorizationHeader, "Bearer ")

        // Llama a la función de validación del token para verificar su autenticidad.
        claims, err := ValidateToken(token, publicKey)

        if err != nil {
            // El token no es válido, por lo que la solicitud no está autenticada.
            ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
            return
        }

        // El token es válido. Almacena las reclamaciones del token en el contexto.
        ctx.Set("tokenClaims", claims)

        ctx.Next() // Continúa con la siguiente función o middleware.
    }
}
