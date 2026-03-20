# Cadeteria-MVD

Plataforma full-stack para la gestión integral de envíos, con paneles diferenciados por rol, seguimiento operativo y una arquitectura preparada para evolucionar hacia integraciones con ecommerce.

> **Titularidad y derechos**  
> Todos los derechos sobre este proyecto corresponden a **Nicolas Colombero**, salvo que exista una cesión o contrato específico que disponga lo contrario.

> **Estado actual del proyecto**  
> Este repositorio corresponde a una aplicación logística operativa compuesta por:
> - un **backend** en Go
> - un **frontend** en React/Vite
> - una estructura adicional para contenedorización y despliegue
>
> En entorno local, actualmente se ejecuta de la siguiente forma:
> - **frontend:** `npm run dev`
> - **backend:** `go run cmd/main.go`

---

## Tabla de contenidos

1. [Descripción general](#descripción-general)
2. [Objetivo del sistema](#objetivo-del-sistema)
3. [Arquitectura del proyecto](#arquitectura-del-proyecto)
4. [Stack tecnológico](#stack-tecnológico)
5. [Modelo operativo y roles](#modelo-operativo-y-roles)
6. [Flujo funcional del negocio](#flujo-funcional-del-negocio)
7. [Estructura esperada del repositorio](#estructura-esperada-del-repositorio)
8. [Requisitos de entorno](#requisitos-de-entorno)
9. [Instalación del proyecto](#instalación-del-proyecto)
10. [Configuración de variables de entorno](#configuración-de-variables-de-entorno)
11. [Ejecución en desarrollo](#ejecución-en-desarrollo)
12. [Ejecución con Docker](#ejecución-con-docker)
13. [Datos de prueba / seed](#datos-de-prueba--seed)
14. [Pruebas y calidad de código](#pruebas-y-calidad-de-código)
15. [Build y despliegue](#build-y-despliegue)
16. [Integraciones futuras](#integraciones-futuras)
17. [Buenas prácticas para contribuir](#buenas-prácticas-para-contribuir)
18. [Problemas frecuentes](#problemas-frecuentes)
19. [Licencia y titularidad](#licencia-y-titularidad)

---

## Descripción general

**Cadeteria-MVD** es una solución de gestión logística orientada a operaciones de última milla. El sistema permite administrar solicitudes de envío, asignarlas a cadetes, seguir su evolución y ofrecer paneles específicos según el rol del usuario dentro de la operación.

La aplicación está pensada para centralizar el circuito operativo completo:

- alta de solicitudes o tickets logísticos
- administración de usuarios y permisos
- asignación de pedidos
- seguimiento de estados
- administración de zonas, sucursales y parámetros operativos
- visualización del flujo de trabajo por perfiles diferenciados

Su diseño actual responde a una lógica SaaS / plataforma operativa, con potencial para integrarse en el futuro con motores externos de venta o generación de órdenes, como Shopify.

---

## Objetivo del sistema

El objetivo principal del proyecto es digitalizar y ordenar la operación logística de una empresa de cadetería o distribución urbana, permitiendo:

- reducir tiempos de coordinación manual
- mejorar la trazabilidad de los envíos
- asignar tareas con mayor control
- dar visibilidad a cada actor del proceso
- establecer una base técnica escalable para integraciones futuras

---

## Arquitectura del proyecto

La solución está dividida en dos capas principales:

### 1. Backend

API desarrollada en **Go**, responsable de:

- autenticación y autorización
- lógica de negocio
- administración de usuarios
- gestión de waybills / tickets
- cálculo operativo
- configuración de parámetros
- persistencia de datos
- notificaciones y reglas del dominio

### 2. Frontend

Interfaz desarrollada en **React + Vite**, responsable de:

- panel administrativo
- panel de operación
- vistas por rol
- formularios de alta y edición
- consulta de estados
- interacción con la API

### 3. Infraestructura auxiliar

El repositorio contempla una estructura para trabajo con Docker y documentación complementaria, pensada para estandarizar el entorno y preparar despliegues.

---

## Stack tecnológico

### Backend
- Go 1.22+
- Gin
- MongoDB
- JWT
- arquitectura modular

### Frontend
- React 18
- Vite
- JavaScript / TypeScript según configuración del proyecto
- Redux Toolkit / RTK Query (si corresponde a la implementación actual)
- Tailwind CSS

### Infraestructura
- Docker
- Docker Compose
- variables de entorno para configuración local y productiva

---

## Modelo operativo y roles

El sistema contempla, a nivel funcional, los siguientes roles:

### Superadmin
Perfil con máxima jerarquía operativa. Puede administrar configuraciones generales, supervisar la operación y gestionar parámetros globales del sistema.

### Admin
Responsable de la operación diaria. Puede visualizar pedidos, generar o completar tickets, asignar cadetes, modificar estados y controlar el circuito logístico.

### Cadete
Usuario operativo de calle. Visualiza sus asignaciones y actualiza el estado de cada envío según el avance de la entrega.

### Cliente
Actor que origina el pedido o la solicitud logística. Según el alcance implementado, puede generar solicitudes y consultar su estado.

---

## Flujo funcional del negocio

A nivel conceptual, el flujo base del sistema es el siguiente:

1. Se registra una solicitud de envío o se genera un ticket logístico.
2. El pedido queda pendiente o en borrador hasta completarse.
3. Un usuario admin valida la información operativa.
4. El envío se asigna a un cadete.
5. El cadete toma el pedido y actualiza su estado durante la operación.
6. El sistema conserva trazabilidad sobre el ciclo de vida del envío.
7. El pedido finaliza como entregado, fallido, cancelado o según los estados definidos por el negocio.

Estados típicos del flujo:
- borrador
- pendiente
- asignado
- en curso
- entregado
- fallido
- cancelado

> Los nombres exactos de los estados pueden variar según la implementación vigente en el dominio del backend.

---

## Estructura esperada del repositorio

La organización general del proyecto responde a una estructura similar a la siguiente:

```text
.
├── backend/         # API REST, dominio, servicios, persistencia y configuración
├── frontend/        # Aplicación web / panel operativo
├── docker/          # Archivos de contenedorización y soporte de entornos
├── docs/            # Documentación adicional, diagramas o Swagger si aplica
└── README.md
```

Dentro del backend pueden existir módulos funcionales como:

- `auth`
- `users`
- `companies`
- `waybill`
- `settings`
- `shipping-zones`
- `notifications`
- `calculate`

La distribución exacta puede variar según la evolución del proyecto.

---

## Requisitos de entorno

### Obligatorios
- **Git** 2.40 o superior
- **Go** 1.22 o superior
- **Node.js** 20 LTS o superior
- **npm** o **pnpm** según el flujo real del frontend
- **MongoDB** 7 o superior

### Opcionales / recomendados
- **Docker** 24 o superior
- **Docker Compose v2**
- **Make** (si existen comandos auxiliares definidos)
- **WSL2** en Windows, si se desea un entorno Linux-like

---

## Instalación del proyecto

Clonar el repositorio:

```bash
git clone https://github.com/TU_ORG/cadeteria-mvd.git
cd cadeteria-mvd
```

> Reemplazar `TU_ORG` por la organización o usuario real del repositorio.

---

## Configuración de variables de entorno

Antes de levantar el proyecto, se deben generar los archivos de entorno correspondientes.

### Backend

Crear un archivo `.env` dentro de `backend/`.

Ejemplo base:

```env
PORT=8080
MONGO_URI=mongodb://localhost:27017/cadeteria
JWT_SECRET=CambiaEstoPorUnaClaveSegura
```

### Frontend

Crear un archivo `.env` dentro de `frontend/`.

Ejemplo base:

```env
VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=Cadeteria-MVD
```

> Se recomienda ignorar los archivos `.env` en Git y versionar únicamente ejemplos como `.env.example`.

---

## Ejecución en desarrollo

### Opción recomendada actualmente: ejecución manual

La ejecución local real del proyecto, en su estado actual, se realiza en **dos terminales**.

### Backend

```bash
cd backend
go mod download
go run cmd/main.go
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### URLs locales habituales

- **Frontend:** `http://localhost:5173`
- **Backend / API:** `http://localhost:8080`

---

## Ejecución con Docker

Si el proyecto ya dispone de archivos `docker-compose.yml` o perfiles equivalentes, puede levantarse mediante contenedores.

Ejemplo:

```bash
docker compose --profile dev up --build
```

> **Importante:** aunque Docker esté documentado, la forma de trabajo real actual del proyecto puede seguir siendo la ejecución manual con `npm run dev` y `go run cmd/main.go`.

---

## Datos de prueba / seed

Si el proyecto dispone de scripts de sembrado de datos, pueden ejecutarse para contar con usuarios o configuraciones iniciales.

Ejemplo:

```bash
go run backend/scripts/seed.go
```

---

## Pruebas y calidad de código

### Backend

```bash
cd backend
go test ./...
```

### Frontend

```bash
cd frontend
npm test
```

### Lint

```bash
cd frontend
npm run lint
```

---

## Build y despliegue

### Frontend

```bash
cd frontend
npm run build
```

### Backend

```bash
cd backend
go build -o cadeteria-api cmd/main.go
```

### Despliegue con Docker

```bash
docker compose --profile prod up --build -d
```

---

## Integraciones futuras

La arquitectura del proyecto permite evolucionar hacia integraciones con plataformas externas.

### Posibles integraciones
- Shopify
- WooCommerce
- marketplaces
- ERP / OMS
- plataformas de tracking

---

## Buenas prácticas para contribuir

1. Crear una rama por feature o corrección.
2. Mantener commits claros y consistentes.
3. No subir secretos ni archivos `.env`.
4. Validar que el proyecto levante localmente antes de abrir un PR.
5. Documentar cualquier cambio estructural relevante.

---

## Problemas frecuentes

### La API no levanta
Verificar:
- que MongoDB esté corriendo
- que `MONGO_URI` sea correcta
- que el puerto no esté ocupado
- que el archivo `.env` exista

### El frontend no conecta con el backend
Verificar:
- `VITE_API_URL`
- CORS del backend
- puerto real de la API
- que el backend esté levantado

### Problemas con puertos
Asegurarse de que no haya otros procesos usando:
- `8080`
- `5173`
- `27017`

---

## Licencia y titularidad

Este proyecto se encuentra identificado con titularidad de **Nicolas Colombero**.

- Autor y titular: **Nicolas Colombero**
- Uso, distribución o cesión: sujeto a autorización expresa del titular o a lo pactado contractualmente
- Licencia técnica: definir según la estrategia legal y comercial del proyecto

> Si se desea publicar este repositorio de forma abierta, conviene reemplazar esta sección por una licencia formal específica.  
> Si se trata de software propietario, esta redacción es más consistente que declarar MIT sin respaldo contractual.
