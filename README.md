# GymPulse — Electron + React

App de escritorio para control de acceso a gimnasios.
Funciona sin internet, en red local, con múltiples PCs sincronizadas.

## Arquitectura

```
PC Principal (Servidor)          PCs Secundarias (Clientes)
┌──────────────────────┐         ┌─────────────────┐
│  Electron + React    │◄───────►│ Electron + React │
│  Express (puerto     │  LAN    │ (se conecta auto)│
│  4321) embebido      │         └─────────────────┘
│  📄 socios.json      │
└──────────────────────┘
```

- **Una sola PC** actúa de servidor (guarda los datos).
- **Las demás PCs** se conectan automáticamente via mDNS (descubrimiento en red local).
- Los datos se guardan en `socios.json` en la carpeta AppData del servidor.
- Sincronización automática cada 30 segundos entre todos los equipos.

## Estructura del proyecto

```
gym-electron/
├── electron/
│   ├── main.js        # Proceso principal Electron (servidor, mDNS, IPC)
│   └── preload.js     # Puente seguro Electron ↔ React
├── server/
│   └── gymServer.js   # API REST Express (lee/escribe socios.json)
├── src/
│   ├── App.jsx                       # Raíz: setup → login → app
│   ├── context/
│   │   ├── AuthContext.jsx           # Login / logout
│   │   ├── ConfigContext.jsx         # Rol (servidor/cliente) e IP
│   │   └── SociosContext.jsx         # Estado global, sync con API
│   ├── hooks/
│   │   ├── useApi.js                 # Cliente HTTP hacia el servidor
│   │   └── useExcel.js               # Importar / exportar Excel
│   ├── utils/dateUtils.js
│   ├── data/initialData.js           # Usuarios y planes
│   └── components/
│       ├── SetupScreen               # Primera configuración (rol)
│       ├── LoginScreen               # Login recepcionista
│       ├── Layout                    # Shell con topbar, tabs, banner
│       ├── ConnectionBanner          # Aviso de desconexión
│       ├── MemberCard                # Tarjeta de socio
│       ├── TabIngreso                # Registro de ingreso
│       ├── TabSocios                 # Listado de socios
│       ├── TabAgregar                # Alta individual
│       ├── TabExcel                  # Importar / exportar Excel
│       └── TabAjustes                # Configuración y estado
└── public/index.html
```

## Instalación y desarrollo

### Requisitos
- Node.js 18 o superior
- npm 9 o superior

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Modo desarrollo (React + Electron juntos)
npm run dev
```

> En modo dev la app carga desde `http://localhost:3000` y Electron se abre automáticamente.

## Generar instaladores

```bash
# Todos los sistemas operativos (requiere el SO correspondiente o CI)
npm run build

# Solo Windows (.exe NSIS installer)
npm run build:win

# Solo Mac (.dmg)
npm run build:mac

# Solo Linux (.AppImage)
npm run build:linux
```

Los instaladores se generan en la carpeta `dist/`.

> **Nota para Windows:** Para generar el instalador `.exe` necesitás correr el comando en Windows.
> **Nota para Mac:** Para generar el `.dmg` necesitás correr en macOS (requerimiento de Apple).
> Podés usar GitHub Actions para compilar para los tres SO desde un solo repositorio.

## Primera vez que se ejecuta la app

Al abrir la app por primera vez aparece la pantalla de configuración:

1. **PC del servidor** → elegir "PC principal (servidor)".
   La app inicia el servidor interno y anuncia su presencia en la red local.

2. **PCs secundarias** → elegir "PC secundaria (cliente)".
   La app busca automáticamente el servidor en la red y se conecta.

Esta configuración se guarda y no vuelve a pedirse.

## Dónde se guardan los datos

| Sistema | Ruta                                                        |
|---------|-------------------------------------------------------------|
| Windows | `C:\Users\<usuario>\AppData\Roaming\gym-checkin\socios.json`|
| Mac     | `~/Library/Application Support/gym-checkin/socios.json`     |
| Linux   | `~/.config/gym-checkin/socios.json`                         |

Podés hacer backup copiando ese archivo.

## Credenciales de acceso

| Usuario     | Contraseña |
|-------------|------------|
| `admin`     | `1234`     |
| `recepcion` | `gym2024`  |

Para cambiarlas, editá `src/data/initialData.js` → objeto `USERS` antes de compilar.

## Formato Excel para importar socios

| nombre     | dni      | plan                    | dias |
|------------|----------|-------------------------|------|
| Juan Pérez | 30123456 | Full access             | 30   |
| Ana Gómez  | 38654321 | Mensual - 3 días/semana | 15   |

## API REST del servidor (puerto 4321)

| Método | Endpoint              | Descripción                  |
|--------|-----------------------|------------------------------|
| GET    | /api/ping             | Health check                 |
| GET    | /api/socios           | Listar todos los socios      |
| GET    | /api/socios/:dni      | Buscar socio por DNI         |
| POST   | /api/socios           | Agregar socio                |
| POST   | /api/socios/import    | Importar array de socios     |
| PUT    | /api/socios/:dni      | Actualizar socio             |
| DELETE | /api/socios/:dni      | Eliminar socio               |
| GET    | /api/historial        | Historial de ingresos de hoy |
| POST   | /api/historial        | Registrar ingreso            |

## Requisitos de red

- Todas las PCs deben estar en la **misma red local** (Wi-Fi o LAN).
- El puerto **4321** debe estar permitido en el firewall de la PC servidor.
  En Windows, al primer inicio Electron puede pedir permiso de firewall → aceptar.

## Próximos pasos recomendados

- Backup automático del `socios.json` (copiar a pendrive o carpeta compartida)
- Renovación de plan desde el panel de socios
- Notificaciones de escritorio para socios por vencer
- Reporte de asistencia mensual exportable
