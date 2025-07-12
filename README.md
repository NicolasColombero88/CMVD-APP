# Cadeteria‑MVD

&#x20; &#x20;

> Plataforma *full‑stack* para la gestión integral de envíos \
> con seguimiento en tiempo real y paneles dedicados para cada rol.

---

## Tabla de contenidos

1. [Arquitectura del proyecto](#arquitectura-del-proyecto)
2. [Requisitos](#requisitos)
3. [Instalación rápida](#instalación-rápida)
4. [Configuración de variables de entorno](#configuración-de-variables-de-entorno)
5. [Modo desarrollo](#modo-desarrollo)
6. [Poblado de datos de ejemplo](#poblado-de-datos-de-ejemplo)
7. [Pruebas y calidad de código](#pruebas-y-calidad-de-código)
8. [Despliegue en producción](#despliegue-en-producción)
9. [Guía de contribución](#guía-de-contribución)
10. [Preguntas frecuentes](#preguntas-frecuentes)
11. [Licencia](#licencia)

---

## Arquitectura del proyecto

```
.
├── backend/         # API REST (Go + Gin)
├── frontend/        # SPA/PWA (React 18 + Vite)
├── docker/          # Contenedores y docker‑compose
└── docs/            # Swagger + diagramas
```

| Carpeta     | Descripción                                        | Tecnologías principales           |
| ----------- | -------------------------------------------------- | --------------------------------- |
| `backend/`  | Lógica de negocio, autenticación, asignación       | **Go 1.22**, Gin, MongoDB, JWT    |
| `frontend/` | Interfaz de usuario y PWA                          | **React 18**, Vite, RTK, Tailwind |
| `docker/`   | Definiciones de contenedores y perfiles de compose | **Docker 24+**, Compose v2        |

---

## Requisitos

> Probado en macOS 13+, Ubuntu 22.04 y Windows 11 (WSL 2).

| Software | Versión mínima | Comprobación       |
| -------- | -------------- | ------------------ |
| Git      | 2.40           | `git --version`    |
| Go       | 1.22           | `go version`       |
| Node.js  | 20 LTS         | `node -v`          |
| pnpm     | 9              | `pnpm -v`          |
| MongoDB  | 7.0            | `mongod --version` |
| Docker   | 24             | `docker -v`        |

---

## Instalación rápida

```bash
git clone https://github.com/TU_ORG/cadeteria-mvd.git
cd cadeteria-mvd
```

### Usando Docker 💡 (recomendado)

```bash
docker compose --profile dev up --build
```

- API: [http://localhost:8080](http://localhost:8080)
- App: [http://localhost:5173](http://localhost:5173)

### Manual

En dos terminales:

```bash
# Backend
cd backend
go mod download
go run ./cmd/server
```

```bash
# Frontend
cd frontend
pnpm install
pnpm dev
```

---

## Configuración de variables de entorno

Copia los archivos `.env.example`:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Principales variables del **backend**:

```env
PORT=8080
MONGO_URI=mongodb://localhost:27017/cadeteria
JWT_SECRET=CambiaEstoPorAlgoSeguro
```

Principales variables del **frontend**:

```env
VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=Cadeteria‑MVD
```

> Añade `*.env*` a `.gitignore`.

---

## Modo desarrollo

Con Docker:

```bash
make dev   # alias de docker compose --profile dev up --build
```

Para detener:

```bash
make stop
```

---

## Poblado de datos de ejemplo

```bash
go run ./backend/scripts/seed.go
```

| Rol   | Usuario                                            | Contraseña |
| ----- | -------------------------------------------------- | ---------- |
| Admin | [admin@cadeteria.dev](mailto\:admin@cadeteria.dev) | admin123   |

---

## Pruebas y calidad de código

| Componente     | Comando         |
| -------------- | --------------- |
| Backend tests  | `go test ./...` |
| Frontend tests | `pnpm test`     |
| Lint completo  | `pnpm lint`     |

---

## Despliegue en producción

```bash
docker compose --profile prod up --build -d
```

- Backend compilado (`go build`)
- Frontend *bundle* (`pnpm build`)

Se puede alojar la API en **Render** y el frontend en **Cloudflare Pages**.

---

## Guía de contribución

1. Crea un *fork* del repositorio.
2. `git switch -c feat/mi‑feature`
3. Sigue el estándar **Conventional Commits**.
4. Asegúrate de que las pruebas y lints pasen.
5. Abre un **Pull Request** contra `main`.

---

## Preguntas frecuentes

No por el momento. El modelo de datos está optimizado para BSON. Se evalúa soporte SQL en el roadmap.

Comprueba que ningún otro servicio use el puerto **27017** y que tu firewall no bloquee la conexión.

---

## Licencia

Distribuido bajo la licencia MIT. Consulta el archivo [`LICENSE`](LICENSE) para más información.

