# CONTEXT.md — SportManager Pro
## Plataforma Enterprise de Gestión Deportiva Híbrida (Web + Mobile)

---

## 1. VISIÓN GENERAL DEL PROYECTO

**Nombre del proyecto:** SportManager Pro  
**Tipo:** Aplicación híbrida (Web Progressive App + Android + iOS)  
**Propósito:** Plataforma enterprise para gestión integral de torneos deportivos: equipos, jugadores, partidos, estadísticas, arbitraje, planillas digitales, noticias y apuestas con criptomonedas.  
**Entorno de despliegue:**
- **Backend API:** Railway (Node.js / NestJS)
- **Frontend Web:** Vercel (Next.js 14 App Router)
- **Mobile:** Capacitor (Android APK + iOS IPA desde la misma base de código)
- **Base de datos:** PostgreSQL (Railway) + Redis (caché y sesiones)
- **Almacenamiento de archivos:** Cloudinary (logos, imágenes)
- **Sincronización offline:** IndexedDB (Dexie.js) → sync automático al reconectar

---

## 2. STACK TECNOLÓGICO

### Frontend / Mobile
| Capa | Tecnología |
|---|---|
| Framework web | Next.js 14 (App Router, RSC) |
| UI Components | shadcn/ui + Tailwind CSS |
| Estado global | Zustand |
| Formularios | React Hook Form + Zod |
| Gráficas y estadísticas | Recharts + Chart.js |
| Offline storage | Dexie.js (IndexedDB wrapper) |
| Mobile wrapper | Capacitor 5 |
| Notificaciones push | Firebase Cloud Messaging (FCM) |
| Internacionalización | next-intl (ES / EN) |

### Backend
| Capa | Tecnología |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | NestJS 10 |
| ORM | Prisma 5 |
| Base de datos | PostgreSQL 15 |
| Caché / Sesiones | Redis 7 |
| Autenticación | JWT (Access Token 15min + Refresh Token 7d) |
| Autorización | CASL (Attribute-Based Access Control) |
| Validación | class-validator + class-transformer |
| Documentación API | Swagger / OpenAPI 3.1 |
| Rate limiting | @nestjs/throttler |
| Logs | Winston + Logtail |
| Cola de tareas | BullMQ (para notificaciones, sincronización, reportes) |

### Infraestructura y Seguridad
| Aspecto | Tecnología / Práctica |
|---|---|
| Secrets | Railway Env Variables + dotenv-vault |
| HTTPS | TLS 1.3 obligatorio, HSTS |
| CORS | Whitelist explícita por dominio |
| Helmet.js | Headers HTTP seguros |
| CSP | Content Security Policy estricto |
| Sanitización | DOMPurify (frontend), sanitize-html (backend) |
| Hashing contraseñas | bcrypt (cost factor 12) |
| 2FA (opcional) | TOTP via speakeasy |
| Auditoría | Tabla `audit_logs` para cada mutación crítica |
| CI/CD | GitHub Actions → Railway + Vercel |
| Tests | Jest + Supertest (unit + integration) |

---

## 3. SISTEMA DE ROLES Y PERMISOS

### 3.1 Roles del sistema

| Código de Rol | Nombre | Descripción |
|---|---|---|
| `SUPER_ADMIN` | Super Administrador | Control total. Único que puede cambiar roles y aprobar usuarios. |
| `ADMIN` | Administrador | Gestión operativa de torneos, equipos, partidos. |
| `ORGANIZER` | Organizador | Crea y administra sus propios torneos. |
| `REFEREE` | Árbitro | Diligencia planillas, reportes de partido. |
| `SCOREKEEPER` | Planillero | Registra eventos en tiempo real durante el partido. |
| `DIRECTOR` | Directivo de Club | Gestiona su equipo, jugadores y documentación. |
| `PLAYER` | Jugador | Ve sus estadísticas personales y calendario. |
| `OBSERVER` | Veedor de Partido | Observa y reporta irregularidades. |
| `JOURNALIST` | Periodista / Comunicador | Publica noticias y contenido. |
| `CITIZEN` | Ciudadano / Fanático | Visualización pública limitada, acceso al dashboard básico. |
| `BETTOR` | Apostador | Acceso al módulo de apuestas con criptomonedas. |

### 3.2 Flujo de Registro y Aprobación

#### Registro Autónomo (cualquier persona desde la app/web)
```
Usuario llena formulario de registro
      │
      ▼
Se crea cuenta con estado: PENDING_APPROVAL
Rol inicial asignado automáticamente: CITIZEN (mínimos privilegios)
      │
      ▼
El usuario recibe email de confirmación de correo
      │
      ▼ (confirma email)
Estado pasa a: ACTIVE (con rol CITIZEN)
Usuario puede iniciar sesión INMEDIATAMENTE
Dashboard limitado: solo módulos públicos visibles
      │
      ▼ (si solicitó un rol superior, ej: PLAYER, REFEREE)
Solicitud queda en cola de aprobación para SUPER_ADMIN
SUPER_ADMIN recibe notificación en panel
      │
      ├─ SUPER_ADMIN APRUEBA → Rol actualizado, usuario notificado
      └─ SUPER_ADMIN RECHAZA → Permanece como CITIZEN, usuario notificado
```

#### Registro por SUPER_ADMIN (desde panel de administración)
```
SUPER_ADMIN crea usuario manualmente
      │
      ▼
Asigna rol inmediatamente (PLAYER, REFEREE, DIRECTOR, etc.)
      │
      ▼
Estado: ACTIVE con todos los permisos del rol asignado
Usuario recibe email con credenciales temporales
      │
      ▼
Usuario inicia sesión y cambia contraseña en primer acceso
```

#### Estados de cuenta
| Estado | Descripción |
|---|---|
| `PENDING_EMAIL` | Esperando confirmación de correo electrónico |
| `PENDING_APPROVAL` | Email confirmado, esperando aprobación de rol por SUPER_ADMIN |
| `ACTIVE` | Cuenta activa y operativa |
| `SUSPENDED` | Suspendido temporalmente por SUPER_ADMIN |
| `BANNED` | Baneado permanentemente |

### 3.3 Formulario de Registro — Datos Requeridos por Tipo de Usuario

#### Paso 1 — Datos básicos (TODOS los usuarios, incluido CITIZEN)
| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| Nombres | Texto | ✅ | |
| Apellidos | Texto | ✅ | |
| Correo electrónico | Email | ✅ | Debe ser único. Se enviará email de confirmación |
| Contraseña | Password | ✅ | Mín. 8 chars, 1 mayúscula, 1 número, 1 especial |
| Confirmar contraseña | Password | ✅ | |
| Teléfono / WhatsApp | Tel | ✅ | |
| Género | Select | ✅ | Masculino / Femenino / No binario / Prefiero no decir |
| Rol solicitado | Select | ✅ | CITIZEN, PLAYER, REFEREE, SCOREKEEPER, DIRECTOR, ORGANIZER, OBSERVER, JOURNALIST |

#### Paso 2 — Datos de identificación y perfil (roles PLAYER, REFEREE, SCOREKEEPER, DIRECTOR, ORGANIZER, OBSERVER, JOURNALIST)
> Los usuarios que seleccionen CITIZEN solo completan el Paso 1.  
> Para cualquier rol funcional, el sistema muestra automáticamente el Paso 2.

| Campo | Tipo | Requerido | Notas de implementación UI |
|---|---|---|---|
| Tipo de documento | Select | ✅ | Cédula de Ciudadanía / Cédula de Extranjería / Pasaporte / Tarjeta de Identidad / NIT |
| Número de documento | Texto | ✅ | Solo dígitos, validación de longitud según tipo |
| Fecha de nacimiento | Date Picker | ✅ | Calendario con navegación rápida por año (scroll o select de año). Rango: 1940 – año actual. El selector de año debe mostrar un dropdown con todos los años en orden descendente para búsqueda ágil. Formato visible: DD/MM/AAAA |
| Foto del documento | File Upload | ⬜ Opcional | Anverso del documento. Formatos: JPG, PNG, WebP. Máx: 5 MB. Preview inmediato. Almacenado en Cloudinary con acceso privado (solo SUPER_ADMIN y ADMIN) |
| Altura | Number | ⬜ Opcional | En centímetros (ej: 175). Rango: 100–230 cm |
| Peso | Number | ⬜ Opcional | En kilogramos (ej: 70). Rango: 30–200 kg |
| Municipio de residencia | Select con búsqueda | ✅ | Ver catálogo geográfico §3.4 |
| Barrio / Vereda | Select con búsqueda | ✅ | Se carga dinámicamente según municipio. Ver §3.4 |
| Dirección (opcional) | Texto | ⬜ Opcional | Calle, carrera, número |
| Foto de perfil | File Upload | ⬜ Opcional | JPG/PNG/WebP, máx 3 MB, recorte circular automático |
| Justificación del rol | Textarea | ⬜ Opcional | ¿Por qué solicitas este rol? (ayuda al SUPER_ADMIN en la aprobación) |

#### Paso 3 — Confirmación y envío
```
Usuario hace clic en "Registrarme"
      │
      ▼
Backend valida todos los campos (NestJS DTO + Zod en frontend)
      │
      ▼
Se crea el registro en BD con estado: PENDING_EMAIL
      │
      ▼
Se envía email de confirmación al correo registrado
  Asunto: "Confirma tu cuenta en SportManager Pro"
  Contenido:
    - Saludo con nombre del usuario
    - Botón / enlace de confirmación (token UUID v4, expira en 24h, uso único)
    - Advertencia: si no confirmas en 24h, deberás registrarte de nuevo
    - Información sobre siguiente paso (aprobación de rol si aplica)
      │
      ▼ (usuario hace clic en el enlace de confirmación)
Estado pasa a: ACTIVE (rol CITIZEN con acceso inmediato)
  Si solicitó rol superior → estado adicional: PENDING_APPROVAL
  Redirige automáticamente al dashboard con mensaje de bienvenida
      │
      ▼ (si rol superior pendiente)
SUPER_ADMIN recibe notificación push + email con datos del solicitante
  Puede ver: nombre, documento, rol solicitado, municipio, foto doc (si cargó)
  Acciones: APROBAR → rol asignado de inmediato | RECHAZAR con motivo
```

#### UX del Date Picker (fecha de nacimiento)
```
Implementación recomendada: react-day-picker + shadcn/ui Popover

Comportamiento:
  - Al abrir el calendario, mostrar el mes/año actual
  - Header del calendario: [ < ] [ Enero ▾ ] [ 2000 ▾ ] [ > ]
  - El dropdown de AÑO muestra lista de 1940 a año_actual en orden DESCENDENTE
    para que los usuarios adultos encuentren su año rápidamente sin hacer scroll
  - El dropdown de MES muestra los 12 meses en español
  - Navegación por teclado funcional (accesibilidad)
  - Validación: no se puede seleccionar fecha futura
  - Validación de mayoría de edad: para módulo de apuestas, mín 18 años
  - Formato de display: "15 de marzo de 1992"
  - Placeholder: "Selecciona tu fecha de nacimiento"

Código de referencia (componente):
  // components/ui/DatePickerBirthday.tsx
  // Usar: <DatePickerBirthday value={date} onChange={setDate} maxYear={currentYear} minYear={1940} />
```

---

### 3.4 Catálogo Geográfico — Municipios y Sectores

#### Valle de Aburrá (10 municipios)
```
BARBOSA | GIRARDOTA | COPACABANA | BELLO | MEDELLÍN |
ITAGÜÍ | LA ESTRELLA | SABANETA | ENVIGADO | CALDAS
```

#### Oriente Cercano de Antioquia (17 municipios)
```
RIONEGRO | MARINILLA | EL CARMEN DE VIBORAL | LA CEJA |
LA UNIÓN | EL RETIRO | GUARNE | SAN VICENTE FERRER |
EL SANTUARIO | CONCEPCIÓN | GRANADA | SAN CARLOS |
COCORNÁ | ABEJORRAL | ARGELIA | NARIÑO | SONSÓN
```

> **Implementación UI:** Select con campo de búsqueda/filtro en tiempo real (tipo `combobox`). Al escribir 2+ letras, filtra la lista. Al seleccionar municipio, el campo de Barrio/Vereda se recarga dinámicamente.

#### Barrios y Veredas de Guarne — Listado Completo

**Zona urbana — Barrios:**
```
Centro | La Paloma | El Carmelo | Villa del Este | Los Alpes |
La Unión | El Porvenir | Villa Hermosa | Las Granjas | San José |
Los Álamos | La Florida | Parque Principal | La Inmaculada |
El Progreso | Urbanización Los Pinos | Urbanización El Estadio
```

**Zona rural — Veredas:**
```
Barro Blanco | El Cardal | El Chagualo | El Molino | El Rosario |
El Tablazo | El Vallano | Garrido | Guanábano | Hoyorrico |
La Brizuela | La Ceja | La Clara | La Convención | La Honda |
La Mosca | Las Palmas | Los Salados | Montañita | Nazareth |
Ojo de Agua | Palestina | Pan de Azúcar | Piedras Blancas |
Playa Rica | San Ignacio | San Isidro | San José | San Pedro |
Santa Elena | Santo Domingo | Uvital
```

> **Nota de implementación:** Para los demás municipios del Valle de Aburrá y Oriente Cercano, cargar barrios/comunas/veredas desde una tabla `geo_sectors` en BD. Los sectores de Guarne deben estar pre-cargados en el seed inicial. Para Medellín, usar las 16 comunas + 5 corregimientos + sus barrios (249 barrios oficiales). Para los demás municipios usar la división por barrios o veredas según corresponda.

---

### 3.5 Matriz de Permisos por Módulo

| Módulo | CITIZEN | PLAYER | REFEREE | SCOREKEEPER | DIRECTOR | ORGANIZER | ADMIN | SUPER_ADMIN |
|---|---|---|---|---|---|---|---|---|
| Dashboard básico | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tabla de posiciones | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Programación de partidos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Goleadores y estadísticas | 👁 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Planilla de partido | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Gestión de equipos | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Gestión de torneos | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Noticias (lectura) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Noticias (publicar) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Módulo de apuestas | ❌ | 👁 | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Sanciones | ❌ | 👁 | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Gestión de usuarios | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Cambio de roles | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Configuración sistema | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Audit logs | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 👁 | ✅ |

> ✅ Acceso completo | 👁 Solo lectura | ❌ Sin acceso

---

## 4. ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTES                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Web (Next)  │  │  Android APK │  │    iOS App       │  │
│  │  (Vercel)    │  │  (Capacitor) │  │  (Capacitor)     │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
└─────────┼─────────────────┼───────────────────┼────────────┘
          │                 │                   │
          └─────────────────┼───────────────────┘
                            │ HTTPS / REST + WebSockets
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   API GATEWAY (NestJS)                       │
│  • Rate Limiting  • JWT Auth  • CASL Authz  • Helmet         │
│  • Request Validation  • Audit Logging  • CORS Whitelist     │
├─────────────┬────────────────────────────┬───────────────────┤
│  Auth Module│   Core Modules             │  WebSocket Gateway│
│  • Register │   • Tournaments            │  • Live match     │
│  • Login    │   • Teams & Players        │  • Notifications  │
│  • Refresh  │   • Matches & Planillas    │  • Score updates  │
│  • 2FA      │   • Statistics             │                   │
│  • Approval │   • Standings              │                   │
│             │   • News & Media           │                   │
│             │   • Betting (crypto)       │                   │
│             │   • Sanctions              │                   │
├─────────────┴────────────────────────────┴───────────────────┤
│                    DATA LAYER                                │
│  PostgreSQL 15    │    Redis 7     │    Cloudinary           │
│  (Prisma ORM)     │  (Cache+Sess)  │  (Logos, Imágenes)      │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. MÓDULOS DE LA APLICACIÓN

### 5.1 Módulo de Autenticación y Usuarios (`/auth`, `/users`)
- **Registro multi-paso** con validación en tiempo real campo a campo
  - Paso 1: datos básicos + rol solicitado (todos los usuarios)
  - Paso 2: identificación, datos físicos, ubicación geográfica (roles funcionales)
  - Paso 3: resumen y confirmación con checkbox de aceptación de Términos y Política de Privacidad
- **Confirmación de correo electrónico obligatoria:**
  - Al completar el registro → email automático desde `noreply@sportmanager.com`
  - Asunto: `"Confirma tu cuenta en SportManager Pro"`
  - Enlace de confirmación con token UUID v4 firmado (expira en 24 horas, uso único)
  - Si el token expira: pantalla con botón "Reenviar email de confirmación" (máx 3 reenvíos/hora por IP)
  - Al confirmar: estado → `ACTIVE`, redirección automática al dashboard con toast de bienvenida
  - Si solicitó rol funcional: estado adicional `PENDING_APPROVAL`, banner informativo en dashboard
- **Email de bienvenida post-confirmación** con resumen de accesos disponibles según rol
- Login con JWT (access 15min + refresh 7d en httpOnly cookie)
- 2FA opcional (TOTP) para roles ADMIN y SUPER_ADMIN (obligatorio) y demás roles (voluntario)
- Recuperación de contraseña via email token (expira 1 hora)
- Panel de aprobación de usuarios pendientes (solo SUPER_ADMIN): lista con foto doc, datos, rol solicitado, justificación; acciones: APROBAR / RECHAZAR con motivo
- Gestión dinámica de roles y permisos por usuario
- Historial de sesiones activas con IP, dispositivo, fecha; opción de revocar sesiones individuales o todas

### 5.2 Módulo de Torneos (`/tournaments`)
- Crear torneo con: nombre, logo, organizador, fechas, tipo (liga/copa/grupos)
- Configuración de puntuación (victoria, empate, derrota, gol diferencia)
- Estados: `DRAFT` → `PUBLISHED` → `IN_PROGRESS` → `FINISHED`
- Múltiples torneos simultáneos
- Configuración por torneo de qué módulos son públicos

### 5.3 Módulo de Equipos y Jugadores (`/teams`, `/players`)
- CRUD de equipos con logo y datos institucionales
- Registro de jugadores con: foto, posición, número de camiseta, DNI/ID, fecha de nacimiento
- Asignación de jugadores a equipos con historial de transferencias
- Estado del jugador: `ACTIVE`, `SUSPENDED`, `INJURED`, `TRANSFERRED`

### 5.4 Módulo de Programación de Partidos (`/matches/schedule`)
- Programar partidos con: torneo, equipo A, equipo B, fecha, hora, sede, número de partido
- Asignación de árbitros, planilleros y veedores
- Notificaciones automáticas a los asignados
- Vista de calendario semanal/mensual
- Exportar programación en PDF

### 5.5 Módulo de Planilla de Partido (`/matches/:id/scoresheet`)
- Cabecera: nombre torneo, logos, fecha, hora, número de partido, árbitros, planilleros
- Carga automática de jugadores de ambos equipos desde BD
- Registro de eventos:
  - ⚽ Gol (jugador, minuto, tipo: normal/cabeza/penal/tiro libre)
  - 🔄 Autogol
  - 🟨 Tarjeta amarilla (jugador, minuto, motivo)
  - 🟥 Tarjeta roja (jugador, minuto, motivo)
  - 🔁 Sustitución (jugador sale, jugador entra, minuto)
  - ⚠️ Falta (jugador, minuto, zona del campo)
- Modo tiempo real (planillero en cancha) con WebSocket
- Modo diferido (registro post-partido con campos de minuto opcionales)
- Guardado parcial automático cada 30 segundos
- **Offline-first:** almacenamiento local (IndexedDB) → sync al reconectar
- Generación automática del informe del partido en PDF
- Campo de texto libre para informe narrativo del árbitro

### 5.6 Módulo de Estadísticas y Dashboard (`/statistics`, `/dashboard`)

#### Dashboard por rol:
**CITIZEN (mínimos privilegios):**
- Tabla de posiciones general
- Próximos partidos (vista pública)
- Top 3 goleadores
- Banner de noticias recientes

**PLAYER:**
- Todo lo de CITIZEN +
- Sus estadísticas personales (goles, tarjetas, minutos jugados)
- Su historial de partidos

**REFEREE / SCOREKEEPER:**
- Todo lo de PLAYER +
- Partidos asignados
- Acceso a planillas de sus partidos

**DIRECTOR:**
- Todo lo anterior +
- Estadísticas completas de su equipo
- Gestión de su plantilla

**ORGANIZER / ADMIN:**
- Dashboard completo con todos los módulos

**SUPER_ADMIN:**
- Dashboard completo + métricas del sistema + audit logs

#### Métricas disponibles:
- Tabla de posiciones (pts, PJ, PG, PE, PP, GF, GC, DG)
- Tabla de goleadores
- Tabla de juego limpio (menor acumulado de tarjetas)
- Gol más rápido del torneo
- Falta más rápida del torneo
- Tarjeta más rápida del torneo
- Sanciones impuestas (suspensiones activas)
- Proyecciones de clasificación (algoritmo de simulación)
- Gráficos de rendimiento por equipo y jugador
- Asistencias (pases de gol)
- Estadísticas por fecha/jornada

### 5.7 Módulo de Noticias (`/news`)
- CRUD de artículos (ADMIN, JOURNALIST)
- Categorías: resultados, convocatorias, transferencias, sanciones, general
- Imagen de portada (Cloudinary)
- Vista pública para todos los usuarios
- Comentarios (solo usuarios ACTIVE, moderación por ADMIN)

### 5.8 Módulo de Sanciones (`/sanctions`)
- Registro de suspensiones por acumulación de tarjetas (regla configurable)
- Suspensiones directas por tarjeta roja
- Suspensiones adicionales por conducta
- Alerta automática cuando un jugador está próximo a sanción
- Historial completo de sanciones por jugador

### 5.9 Módulo de Apuestas con Criptomonedas (`/betting`)
> ⚠️ Módulo regulado. Solo accesible por usuarios mayores de edad verificados con rol BETTOR.

- Conexión con wallet: MetaMask / WalletConnect
- Criptomonedas soportadas: USDT, ETH, BTC, MATIC
- Tipos de apuesta: ganador del partido, total de goles (over/under), primer goleador
- Smart contracts (Solidity) para custodia de fondos en escrow
- Odds calculados algorítmicamente en base a estadísticas históricas
- Liquidación automática al confirmar resultado oficial
- Historial de apuestas por usuario
- Cumplimiento KYC básico para montos altos

---

## 6. MODELO DE BASE DE DATOS (Prisma Schema - Resumen)

```prisma
// ─── USUARIOS Y ROLES ───────────────────────────────────────

model User {
  id              String      @id @default(cuid())
  // ── Credenciales ──────────────────────────────────────────
  email           String      @unique
  passwordHash    String
  emailVerified   Boolean     @default(false)
  emailVerifyToken String?    // UUID v4, expira en 24h
  emailVerifyExpires DateTime?

  // ── Datos personales básicos ──────────────────────────────
  firstName       String
  lastName        String
  phone           String?
  gender          Gender?
  avatarUrl       String?     // foto de perfil (Cloudinary, público)

  // ── Identificación (roles funcionales) ───────────────────
  documentType    DocumentType?
  documentNumber  String?     // encriptado AES-256 en BD
  documentPhotoUrl String?    // foto doc anverso (Cloudinary, acceso privado)
  birthDate       DateTime?
  nationality     String?     @default("Colombiana")

  // ── Datos físicos (jugadores principalmente) ─────────────
  heightCm        Int?        // altura en centímetros (100–230)
  weightKg        Float?      // peso en kilogramos (30–200)

  // ── Ubicación geográfica ──────────────────────────────────
  region          GeoRegion?  // VALLE_ABURRA | ORIENTE_CERCANO
  municipalityId  String?     // FK a Municipality
  municipality    Municipality? @relation(fields: [municipalityId], references: [id])
  sectorId        String?     // FK a GeoSector (barrio/vereda)
  sector          GeoSector?  @relation(fields: [sectorId], references: [id])
  address         String?     // dirección libre (opcional)

  // ── Rol y estado ─────────────────────────────────────────
  role            Role        @default(CITIZEN)
  status          UserStatus  @default(PENDING_EMAIL)
  roleJustification String?   // justificación del rol solicitado

  // ── Seguridad y 2FA ───────────────────────────────────────
  twoFactorEnabled Boolean    @default(false)
  twoFactorSecret  String?

  // ── Trazabilidad ─────────────────────────────────────────
  registeredBy    String?     // null = auto-registro, userId = creado por admin
  approvedBy      String?     // userId del SUPER_ADMIN que aprobó
  approvedAt      DateTime?
  lastLoginAt     DateTime?
  passwordChangedAt DateTime?
  forcePasswordChange Boolean @default(false) // true cuando admin crea la cuenta
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  sessions        Session[]
  auditLogs       AuditLog[]
  roleRequests    RoleRequest[]
  playerProfile   Player?
  refereeProfile  Referee?
}

enum Gender {
  MALE FEMALE NON_BINARY PREFER_NOT_TO_SAY
}

enum DocumentType {
  CEDULA_CIUDADANIA    // CC
  CEDULA_EXTRANJERIA   // CE
  PASAPORTE            // PA
  TARJETA_IDENTIDAD    // TI
  NIT                  // NIT
}

enum GeoRegion {
  VALLE_ABURRA
  ORIENTE_CERCANO
}

// ─── GEOGRAFÍA ──────────────────────────────────────────────

model Municipality {
  id        String    @id @default(cuid())
  name      String
  region    GeoRegion
  daneCode  String?   @unique  // código DANE oficial
  users     User[]
  sectors   GeoSector[]
}

model GeoSector {
  id             String      @id @default(cuid())
  municipalityId String
  municipality   Municipality @relation(fields: [municipalityId], references: [id])
  name           String
  type           SectorType  // BARRIO | VEREDA | COMUNA | CORREGIMIENTO
  users          User[]

  @@unique([municipalityId, name])
}

enum SectorType {
  BARRIO VEREDA COMUNA CORREGIMIENTO URBANIZACION
}

enum Role {
  SUPER_ADMIN ADMIN ORGANIZER REFEREE SCOREKEEPER
  DIRECTOR PLAYER OBSERVER JOURNALIST CITIZEN BETTOR
}

enum UserStatus {
  PENDING_EMAIL PENDING_APPROVAL ACTIVE SUSPENDED BANNED
}

model RoleRequest {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  requestedRole Role
  justification String?
  status      RequestStatus @default(PENDING)
  reviewedBy  String?
  reviewedAt  DateTime?
  createdAt   DateTime  @default(now())
}

enum RequestStatus { PENDING APPROVED REJECTED }

// ─── TORNEOS ────────────────────────────────────────────────

model Tournament {
  id              String    @id @default(cuid())
  name            String
  logoUrl         String?
  organizerLogoUrl String?
  organizerId     String
  type            TournamentType
  status          TournamentStatus @default(DRAFT)
  startDate       DateTime
  endDate         DateTime?
  winPoints       Int       @default(3)
  drawPoints      Int       @default(1)
  lossPoints      Int       @default(0)
  maxYellowCards  Int       @default(3) // para suspensión automática
  createdAt       DateTime  @default(now())

  teams           TournamentTeam[]
  matches         Match[]
}

enum TournamentType  { LEAGUE CUP GROUPS KNOCKOUT }
enum TournamentStatus { DRAFT PUBLISHED IN_PROGRESS FINISHED CANCELLED }

// ─── EQUIPOS Y JUGADORES ────────────────────────────────────

model Team {
  id          String  @id @default(cuid())
  name        String
  logoUrl     String?
  city        String?
  foundedYear Int?
  directorId  String?
  createdAt   DateTime @default(now())

  players     Player[]
  tournaments TournamentTeam[]
}

model Player {
  id            String    @id @default(cuid())
  userId        String?   @unique
  user          User?     @relation(fields: [userId], references: [id])
  teamId        String
  team          Team      @relation(fields: [teamId], references: [id])
  firstName     String
  lastName      String
  photoUrl      String?
  jerseyNumber  Int?
  position      PlayerPosition?
  // Datos físicos y de identificación (vienen del User si está vinculado,
  // o se ingresan manualmente si el jugador no tiene cuenta de usuario)
  birthDate     DateTime?
  documentType  DocumentType?
  documentNumber String?   // encriptado AES-256
  documentPhotoUrl String? // acceso privado Cloudinary
  heightCm      Int?       // centímetros
  weightKg      Float?     // kilogramos
  gender        Gender?
  nationality   String?
  municipalityId String?
  sectorId      String?
  status        PlayerStatus @default(ACTIVE)
  createdAt     DateTime  @default(now())

  stats         MatchPlayerStat[]
  sanctions     Sanction[]
}

enum PlayerPosition { GOALKEEPER DEFENDER MIDFIELDER FORWARD }
enum PlayerStatus   { ACTIVE SUSPENDED INJURED TRANSFERRED INACTIVE }

// ─── PARTIDOS ───────────────────────────────────────────────

model Match {
  id              String    @id @default(cuid())
  tournamentId    String
  tournament      Tournament @relation(fields: [tournamentId], references: [id])
  teamAId         String
  teamBId         String
  scheduledAt     DateTime
  venue           String?
  matchNumber     Int?      // número del partido en el torneo
  dayNumber       Int?      // jornada/fecha
  status          MatchStatus @default(SCHEDULED)
  scoreA          Int?
  scoreB          Int?

  refereeId       String?
  scorekeeperId   String?
  observerId      String?
  refereeReport   String?   // informe narrativo del árbitro

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  events          MatchEvent[]
  playerStats     MatchPlayerStat[]
}

enum MatchStatus { SCHEDULED IN_PROGRESS HALFTIME FINISHED SUSPENDED CANCELLED POSTPONED }

model MatchEvent {
  id          String    @id @default(cuid())
  matchId     String
  match       Match     @relation(fields: [matchId], references: [id])
  playerId    String?
  teamId      String
  type        EventType
  minute      Int?      // opcional para modo diferido
  description String?
  createdAt   DateTime  @default(now())
  createdBy   String    // userId quien registró
}

enum EventType {
  GOAL OWN_GOAL YELLOW_CARD RED_CARD YELLOW_RED_CARD
  SUBSTITUTION_IN SUBSTITUTION_OUT FOUL PENALTY_SCORED PENALTY_MISSED
}

model MatchPlayerStat {
  id              String  @id @default(cuid())
  matchId         String
  playerId        String
  goals           Int     @default(0)
  ownGoals        Int     @default(0)
  assists         Int     @default(0)
  yellowCards     Int     @default(0)
  redCards        Int     @default(0)
  fouls           Int     @default(0)
  minutesPlayed   Int?
  match           Match   @relation(fields: [matchId], references: [id])
  player          Player  @relation(fields: [playerId], references: [id])
}

// ─── SANCIONES ──────────────────────────────────────────────

model Sanction {
  id            String    @id @default(cuid())
  playerId      String
  player        Player    @relation(fields: [playerId], references: [id])
  tournamentId  String
  type          SanctionType
  matchesBanned Int       @default(1)
  reason        String?
  isActive      Boolean   @default(true)
  imposedBy     String    // userId
  imposedAt     DateTime  @default(now())
}

enum SanctionType { YELLOW_ACCUMULATION RED_CARD CONDUCT ADMINISTRATIVE }

// ─── DATOS GEOGRÁFICOS — SEED INICIAL ───────────────────────
// Ejecutar con: pnpm prisma db seed
// El seed debe cargar:
//
// Valle de Aburrá (10):
//   Barbosa, Girardota, Copacabana, Bello, Medellín,
//   Itagüí, La Estrella, Sabaneta, Envigado, Caldas
//
// Oriente Cercano (17):
//   Rionegro, Marinilla, El Carmen de Viboral, La Ceja, La Unión,
//   El Retiro, Guarne, San Vicente Ferrer, El Santuario, Concepción,
//   Granada, San Carlos, Cocorná, Abejorral, Argelia, Nariño, Sonsón
//
// Guarne — Barrios urbanos (17):
//   Centro, La Paloma, El Carmelo, Villa del Este, Los Alpes,
//   La Unión, El Porvenir, Villa Hermosa, Las Granjas, San José,
//   Los Álamos, La Florida, Parque Principal, La Inmaculada,
//   El Progreso, Urb. Los Pinos, Urb. El Estadio
//
// Guarne — Veredas (32):
//   Barro Blanco, El Cardal, El Chagualo, El Molino, El Rosario,
//   El Tablazo, El Vallano, Garrido, Guanábano, Hoyorrico,
//   La Brizuela, La Ceja, La Clara, La Convención, La Honda,
//   La Mosca, Las Palmas, Los Salados, Montañita, Nazareth,
//   Ojo de Agua, Palestina, Pan de Azúcar, Piedras Blancas,
//   Playa Rica, San Ignacio, San Isidro, San José, San Pedro,
//   Santa Elena, Santo Domingo, Uvital
//
// Para Medellín: 16 comunas + 5 corregimientos + 249 barrios oficiales
// Para demás municipios: barrios/veredas principales



model AuditLog {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  action      String    // ej: "USER_ROLE_CHANGED", "MATCH_CREATED"
  entity      String    // ej: "User", "Match"
  entityId    String?
  oldValue    Json?
  newValue    Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime  @default(now())
}
```

---

## 7. SEGURIDAD — IMPLEMENTACIÓN DETALLADA

### 7.1 Autenticación
- **Contraseñas:** bcrypt con cost factor 12 mínimo
- **JWT:** Access token (15 min) + Refresh token (7 días, rotación en cada uso)
- **Refresh token:** almacenado en httpOnly + Secure + SameSite=Strict cookie
- **Sesiones:** tabla `Session` en BD para invalidación explícita (logout, ban, cambio de contraseña)
- **Brute force protection:** bloqueo después de 5 intentos fallidos (Redis, 15 min)
- **Email verification:**
  - Token: UUID v4, firmado con HMAC-SHA256, expiración 24 horas, uso único (invalidado tras el primer clic)
  - Reenvío: máximo 3 reenvíos por hora por IP (Rate Limit con Redis)
  - El token se almacena hasheado en BD (nunca en texto plano)
  - Cuentas sin verificar en 72h: limpieza automática (cron job)
- **Documento de identidad (foto):** almacenado en Cloudinary con signed URLs (expiran en 1h); acceso solo para SUPER_ADMIN y ADMIN; nunca expuesto en respuestas de API pública
- **Campos PII encriptados:** `documentNumber`, `phone`, `birthDate` → AES-256-GCM con IV aleatorio por registro

### 7.2 Autorización
- **CASL (Attribute-Based):** cada endpoint verifica `subject + action + conditions`
- **Separación de datos:** los DIRECTORS solo acceden a su propio equipo (row-level)
- **Principio de mínimo privilegio:** CITIZEN ve solo datos públicos
- **Guards en NestJS:** `JwtAuthGuard` + `RolesGuard` + `AbilitiesGuard` en cascada

### 7.3 Protección de API
```
Rate Limiting:
  - Global: 100 req/min por IP
  - Auth endpoints: 10 req/min por IP
  - Planilla (WebSocket): 50 eventos/min por conexión

Headers de seguridad (Helmet.js):
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Strict-Transport-Security: max-age=31536000
  - Content-Security-Policy: estricto
  - Referrer-Policy: no-referrer

CORS:
  - Whitelist: [app.sportmanager.com, localhost:3000]
  - Methods: GET, POST, PUT, PATCH, DELETE
  - Credentials: true (para cookies)
```

### 7.4 Validación y Sanitización
- Todos los inputs validados con `class-validator` (DTO pattern)
- Sanitización HTML en campos de texto libre (DOMPurify / sanitize-html)
- Prevención de SQL injection: Prisma ORM parametriza todas las queries
- Prevención de XSS: CSP headers + sanitización de output
- Prevención de CSRF: SameSite cookies + CSRF token en mutaciones
- File uploads: validación de tipo MIME + límite de tamaño (5MB logos, 2MB fotos)

### 7.5 Datos Sensibles
- Campos PII (email, phone, documentId) encriptados en BD con AES-256
- Logs: no registrar contraseñas, tokens ni datos financieros
- Variables de entorno: nunca en código, siempre en Railway Env + dotenv-vault
- GDPR/datos personales: endpoint de eliminación de cuenta (soft delete + anonimización)

---

## 8. ESTRUCTURA DE CARPETAS DEL PROYECTO

```
sportmanager-pro/
├── apps/
│   ├── web/                    # Next.js 14
│   │   ├── app/
│   │   │   ├── (auth)/         # login, register, verify-email
│   │   │   ├── (dashboard)/    # layout con sidebar por rol
│   │   │   │   ├── overview/
│   │   │   │   ├── tournaments/
│   │   │   │   ├── matches/
│   │   │   │   ├── teams/
│   │   │   │   ├── players/
│   │   │   │   ├── statistics/
│   │   │   │   ├── news/
│   │   │   │   ├── sanctions/
│   │   │   │   ├── betting/
│   │   │   │   └── admin/      # solo SUPER_ADMIN / ADMIN
│   │   │   └── api/            # API routes (proxy al backend)
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui customizado
│   │   │   ├── auth/
│   │   │   │   ├── RegisterForm/
│   │   │   │   │   ├── Step1BasicData.tsx      # datos básicos + rol
│   │   │   │   │   ├── Step2ProfileData.tsx    # identificación, físico, ubicación
│   │   │   │   │   ├── Step3Confirmation.tsx   # resumen + T&C
│   │   │   │   │   └── DatePickerBirthday.tsx  # calendar con select de año
│   │   │   │   ├── MunicipalitySelector.tsx    # combobox Valle Aburrá + Oriente
│   │   │   │   └── SectorSelector.tsx          # barrios/veredas dinámico
│   │   │   ├── dashboard/
│   │   │   ├── scoresheet/     # planilla de partido
│   │   │   └── charts/
│   │   ├── hooks/
│   │   ├── stores/             # Zustand
│   │   ├── lib/
│   │   │   ├── auth.ts
│   │   │   ├── api-client.ts
│   │   │   ├── offline-sync.ts # IndexedDB + sync
│   │   │   └── permissions.ts  # helpers de CASL en frontend
│   │   └── capacitor.config.ts
│   │
│   └── api/                    # NestJS
│       ├── src/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── tournaments/
│       │   ├── teams/
│       │   ├── players/
│       │   ├── matches/
│       │   │   ├── matches.module.ts
│       │   │   ├── scoresheet/     # planilla en tiempo real
│       │   │   └── statistics/
│       │   ├── sanctions/
│       │   ├── news/
│       │   ├── betting/
│       │   ├── notifications/  # FCM + email
│       │   ├── audit/
│       │   └── common/
│       │       ├── guards/
│       │       ├── decorators/
│       │       ├── filters/    # exception filters
│       │       ├── interceptors/ # logging, transform
│       │       └── pipes/      # validation
│       └── prisma/
│           ├── schema.prisma
│           └── migrations/
│
├── packages/
│   ├── shared-types/           # DTOs compartidos web+api
│   └── ui-kit/                 # componentes compartidos
│
├── docs/
│   ├── CONTEXT.md              # este archivo
│   ├── API.md                  # documentación endpoints
│   └── DEPLOYMENT.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml              # tests en PR
│       └── deploy.yml          # deploy a Railway + Vercel
│
├── turbo.json                  # Turborepo monorepo
└── package.json
```

---

## 9. FUNCIONALIDAD OFFLINE (Mobile / APK)

### Flujo de sincronización:
```
App abre sin internet
      │
      ▼
Lee datos cacheados de IndexedDB (Dexie.js)
Funciones disponibles offline:
  - Ver planilla cargada previamente
  - Registrar eventos del partido (goles, tarjetas, etc.)
  - Todos los cambios se almacenan localmente con timestamp
      │
      ▼ (al recuperar conexión)
Cola de sincronización (BullMQ en backend)
  - Envía eventos pendientes en orden cronológico
  - Maneja conflictos: last-write-wins con timestamp
  - Notifica al usuario: "X eventos sincronizados"
      │
      ▼
BD actualizada, caché local actualizado
```

---

## 10. WEBSOCKET — PLANILLA EN TIEMPO REAL

- Sala por partido: `match:{matchId}`
- Eventos emitidos: `match:event`, `match:score`, `match:status`
- Autenticación: JWT en handshake WebSocket
- Solo REFEREE y SCOREKEEPER pueden emitir eventos
- Todos los demás roles en la sala pueden escuchar (modo lectura)
- Reconexión automática con backoff exponencial

---

## 11. NOTIFICACIONES

| Evento | Canal | Destinatario |
|---|---|---|
| Nuevo usuario pendiente de aprobación | Push + Email | SUPER_ADMIN |
| Cuenta aprobada / rechazada | Push + Email | Usuario |
| Partido asignado como árbitro/planillero | Push + Email | Árbitro / Planillero |
| Sanción impuesta a jugador | Push + Email | Jugador + Director del equipo |
| Gol en tiempo real | Push (opcional) | Fanáticos suscritos |
| Resultado final publicado | Push | Suscriptores del torneo |
| Nueva noticia publicada | Push | Todos los usuarios activos |

---

## 12. COMANDOS DE DESARROLLO (Ubuntu Terminal)

```bash
# ─── PREREQUISITOS ──────────────────────────────────────────
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm (gestor de paquetes para monorepo)
npm install -g pnpm@9

# PostgreSQL 15
sudo apt install postgresql-15 postgresql-client-15

# Redis 7
sudo apt install redis-server

# Railway CLI
npm install -g @railway/cli

# Vercel CLI
npm install -g vercel

# Capacitor CLI
npm install -g @capacitor/cli

# ─── INICIALIZAR PROYECTO ───────────────────────────────────
git clone https://github.com/tu-org/sportmanager-pro.git
cd sportmanager-pro
pnpm install

# ─── CONFIGURAR ENV ─────────────────────────────────────────
cp apps/api/.env.example apps/api/.env
# Editar con tus credenciales: DATABASE_URL, JWT_SECRET, REDIS_URL, etc.

# ─── BASE DE DATOS ──────────────────────────────────────────
cd apps/api
pnpm prisma migrate dev --name init
pnpm prisma db seed           # crea SUPER_ADMIN inicial + datos geográficos (municipios, barrios, veredas de Guarne)

# ─── DESARROLLO LOCAL ───────────────────────────────────────
pnpm dev                      # arranca api + web en paralelo (Turborepo)

# ─── TESTS ──────────────────────────────────────────────────
pnpm test                     # unit tests
pnpm test:e2e                 # integration tests

# ─── BUILD PRODUCCIÓN ───────────────────────────────────────
pnpm build

# ─── GENERAR APK (Android) ──────────────────────────────────
cd apps/web
pnpm build
npx cap sync android
npx cap open android          # abre Android Studio para generar APK

# ─── DEPLOY ─────────────────────────────────────────────────
railway up                    # despliega API en Railway
vercel --prod                 # despliega web en Vercel
```

---

## 13. VARIABLES DE ENTORNO REQUERIDAS

```env
# ─── API (apps/api/.env) ────────────────────────────────────

# Base de datos
DATABASE_URL="postgresql://user:pass@host:5432/sportmanager"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_ACCESS_SECRET="min-32-chars-random-secret"
JWT_REFRESH_SECRET="different-min-32-chars-secret"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"

# Email (SMTP)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="SG.xxxxx"
EMAIL_FROM="noreply@sportmanager.com"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="xxx"
CLOUDINARY_API_SECRET="xxx"

# Firebase (notificaciones push)
FIREBASE_PROJECT_ID="sportmanager-pro"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@..."
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# App
APP_URL="https://app.sportmanager.com"
PORT=3001
NODE_ENV="production"

# Encriptación PII (documentos, teléfono, fecha nacimiento)
ENCRYPTION_KEY="32-bytes-hex-key"
ENCRYPTION_IV_LENGTH=16

# Super Admin inicial (seed)
SEED_SUPER_ADMIN_EMAIL="admin@sportmanager.com"
SEED_SUPER_ADMIN_PASSWORD="ChangeMe123!@#"
```

---

## 14. ROADMAP DE DESARROLLO

### Fase 1 — MVP (Semanas 1-4)
- [x] Autenticación completa (registro, login, JWT refresh, guards)
- [x] CRUD de torneos, equipos, jugadores
- [x] Programación de partidos
- [x] Dashboard con tabla de posiciones y goleadores
- [x] Sistema de roles y permisos (CASL)
- [ ] Planilla básica de partido (modo diferido — UI pendiente)

### Fase 2 — Tiempo Real y Mobile (Semanas 5-8)
- [x] Planilla en tiempo real (WebSocket — backend gateway listo)
- [x] Módulo de noticias (CRUD + categorías + estados)
- [x] Estadísticas avanzadas y gráficas (Recharts: BarChart, PieChart, posiciones, goleadores, tarjetas)
- [x] Módulo de sanciones automáticas (tarjetas amarillas acumuladas, rojas)
- [ ] Offline-first con IndexedDB + sincronización
- [ ] Generación APK con Capacitor
- [ ] Notificaciones push (FCM)

### Fase 3 — Enterprise y Apuestas (Semanas 9-12)
- [ ] Módulo de apuestas con criptomonedas
- [ ] 2FA para cuentas administrativas
- [ ] Audit logs completo
- [ ] Exportación de reportes en PDF
- [ ] Tests de integración y seguridad
- [x] Documentación API (Swagger — disponible en /api/docs)
- [ ] App Store / Play Store submission

---

## 15. ESTADO ACTUAL DE IMPLEMENTACIÓN (Actualizado: 2026-03-06)

### Backend (NestJS 10 + Prisma 5) — 11 módulos
| Módulo | Estado | Endpoints |
|---|---|---|
| Auth | Completo | POST /auth/register, /auth/login, /auth/refresh |
| Users | Completo | GET/PATCH /users, aprobación de roles |
| Tournaments | Completo | CRUD + paginación + filtros |
| Teams | Completo | CRUD + asignación a torneos |
| Players | Completo | CRUD + búsqueda + estados |
| Matches | Completo | CRUD + eventos + WebSocket gateway |
| Geo | Completo | Municipios (Valle Aburrá + Oriente) + Sectores |
| Statistics | Completo | Posiciones, goleadores, tarjetas, resumen |
| CASL | Completo | Permisos por rol (Attribute-Based) |
| Sanctions | Completo | Auto-sanciones por tarjetas + CRUD |
| News | Completo | CRUD + categorías + estados (Draft/Published/Archived) |

### Frontend (Next.js 14 + shadcn/ui) — 21 páginas
| Página | Ruta | Estado |
|---|---|---|
| Landing | / | Completo |
| Login | /login | Completo |
| Registro | /register | Completo |
| Dashboard | /dashboard | Completo (stats, posiciones, goleadores, próximos partidos) |
| Admin | /dashboard/admin | Completo |
| Torneos | /dashboard/tournaments | Completo (lista + detalle + crear) |
| Equipos | /dashboard/teams | Completo (lista + crear) |
| Jugadores | /dashboard/players | Completo (lista + crear) |
| Partidos | /dashboard/matches | Completo (lista + detalle + crear) |
| Estadísticas | /dashboard/statistics | Completo (tabs: posiciones, goleadores, tarjetas, gráficas) |
| Sanciones | /dashboard/sanctions | Completo |
| Noticias | /dashboard/news | Completo (lista + detalle + crear) |

### Infraestructura
| Componente | Estado | Detalles |
|---|---|---|
| PostgreSQL (Docker) | Operativo | Puerto 5450, container: sportmanager-db |
| Redis (Docker) | Operativo | Puerto 6380, container: sportmanager-redis |
| Prisma Schema | Completo | 16 modelos, 14 enums, seed con datos demo |
| Frontend (Vercel) | Desplegado | https://app-torneo-sanjose.vercel.app |
| Backend (Railway) | Online | https://api-production-3e93.up.railway.app |
| Swagger API Docs | Disponible | https://api-production-3e93.up.railway.app/api/docs |
| PostgreSQL (Railway) | Online | Servicio en Railway, conectado via DATABASE_URL |
| Monorepo | Configurado | pnpm + Turborepo |
| railway.toml | Configurado | dockerfilePath = apps/api/Dockerfile |

### Datos Demo (Seed)
- Super Admin en produccion: admin@sanjose.com / admin2026
- Super Admin local: admin@sportmanager.com / Admin2026*
- Torneo: "Torneo San Jose 2026" (IN_PROGRESS)
- 8 equipos de Guarne, 88 jugadores, 28 partidos (16 finalizados)
- 63 eventos (goles + tarjetas), standings y goleadores calculados
- Municipios: 10 Valle de Aburra + 17 Oriente Cercano
- Sectores Guarne: 17 barrios + 32 veredas

### Credenciales
- **Super Admin produccion:** admin@sanjose.com / admin2026
- **Super Admin local:** admin@sportmanager.com / Admin2026*
- **BD Local:** postgresql://sportmanager:sportmanager2026@localhost:5450/sportmanager

### Variables de entorno configuradas

#### Railway (API)
| Variable | Valor |
|---|---|
| DATABASE_URL | ${{Postgres.DATABASE_URL}} (referencia al servicio PostgreSQL) |
| NODE_ENV | production |
| PORT | 3001 |
| JWT_ACCESS_SECRET | (secreto generado) |
| JWT_REFRESH_SECRET | (secreto generado) |
| JWT_ACCESS_EXPIRES | 15m |
| JWT_REFRESH_EXPIRES | 7d |
| SEED_SUPER_ADMIN_EMAIL | admin@sanjose.com |
| SEED_SUPER_ADMIN_PASSWORD | admin2026 |
| CORS_ORIGINS | No usar — CORS configurado con origin:true en main.ts |

#### Vercel (Web)
| Variable | Valor |
|---|---|
| NEXT_PUBLIC_API_URL | https://api-production-3e93.up.railway.app |

---

## 16. ESTADO DEL DEPLOY (Actualizado: 2026-03-15)

### Deploy completado - Login funcional
- [x] Proyecto creado en Railway
- [x] Servicio PostgreSQL agregado en Railway (online)
- [x] Servicio API conectado al repo de GitHub (deploy automatico)
- [x] Variables de entorno configuradas en Railway
- [x] railway.toml creado con configuracion de Docker
- [x] Dockerfile corregido: ruta dist/src/main.js, pnpm en runner, seed compilado
- [x] API online y respondiendo en https://api-production-3e93.up.railway.app
- [x] Swagger disponible en https://api-production-3e93.up.railway.app/api/docs
- [x] Seed ejecutado correctamente (admin@sanjose.com creado)
- [x] Frontend desplegado en Vercel con NEXT_PUBLIC_API_URL configurada
- [x] Variable NEXT_PUBLIC_API_URL incrustada en JS del frontend (verificado)
- [x] CORS resuelto: configurado con origin:true en main.ts, helmet con crossOriginResourcePolicy
- [x] **Login funcional desde https://app-torneo-sanjose.vercel.app/login** (verificado 2026-03-15)

### Problemas resueltos durante el deploy
1. **Dockerfile - ruta incorrecta:** NestJS compila a `dist/src/main.js`, no `dist/main.js`. Script start corregido.
2. **Dockerfile - pnpm faltante en runner:** Railway ejecuta `pnpm start`, requiere pnpm instalado en el stage runner.
3. **Dockerfile - seed no se ejecutaba:** Seed compilado a JS con tsc y ejecutado automaticamente al iniciar el contenedor.
4. **CORS bloqueaba el login:** helmet() interferida con los headers CORS. Solucion: CORS configurado a nivel de NestFactory.create con `origin: true`, helmet aplicado despues con `crossOriginResourcePolicy: 'cross-origin'`.
5. **Frontend apuntaba a localhost:** .env.production actualizado a URL de Railway. Variable tambien configurada en Vercel dashboard.

### PENDIENTE - Restringir CORS
- Actualmente CORS esta con `origin: true` (permite cualquier origin). Se debe restringir a los dominios permitidos una vez estabilizado el deploy. Eliminar la variable CORS_ORIGINS de Railway y usar la lista hardcodeada en main.ts, o configurar CORS_ORIGINS correctamente (sin espacios, sin barra final).

### Cambios realizados en el codigo (commits del 2026-03-14 y 2026-03-15)
- `railway.toml` creado en la raiz del proyecto
- `apps/api/Dockerfile`: corregido para compilar seed, instalar pnpm en runner, ruta correcta a main.js
- `apps/api/package.json`: script start corregido a `dist/src/main.js`, incluye migraciones y seed
- `apps/api/src/main.ts`: CORS configurado en NestFactory.create con origin:true, helmet despues con crossOriginResourcePolicy
- `apps/web/.env.production`: actualizado a https://api-production-3e93.up.railway.app

---

## 17. CONSIDERACIONES ADICIONALES

- **Accesibilidad:** cumplir WCAG 2.1 nivel AA (contraste, navegacion por teclado, ARIA)
- **Performance:** lazy loading de modulos, paginacion en todas las listas, cache Redis para estadisticas calculadas
- **Internacionalizacion:** interfaz en Espanol (principal) e Ingles
- **Backups:** backup automatico diario de PostgreSQL en Railway (retencion 30 dias)
- **Monitoreo:** Railway metrics + Logtail para logs centralizados
- **Legal:** terminos y condiciones + politica de privacidad obligatorios en registro, especialmente para modulo de apuestas

---

*Documento generado para desarrollo enterprise. Version 1.3 — SportManager Pro — Actualizado: 2026-03-15*
