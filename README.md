# Europlate — Sistema de Gestión Comercial

Sistema ERP completo para gestión de productos, proveedores, compras, importaciones, producción e inventario.

---

## Stack

| Capa       | Tecnología                                |
|------------|-------------------------------------------|
| Frontend   | HTML / CSS / Vanilla JS (SPA)             |
| Backend    | Netlify Functions (Node.js serverless)    |
| Base de datos | PostgreSQL en Neon (neon.tech) o Supabase |
| Auth       | JWT (jsonwebtoken + bcryptjs)             |
| Deploy     | Netlify                                   |

---

## Requisitos previos

- Node.js 18+
- Cuenta en [Netlify](https://netlify.com)
- Cuenta en [Neon](https://neon.tech) (recomendado, gratuito) o [Supabase](https://supabase.com)

---

## Pasos de configuración

### 1. Crear la base de datos (Neon — recomendado)

1. Ve a [neon.tech](https://neon.tech) → **New Project**
2. Ponle nombre: `europlate`
3. Copia la **connection string** (empieza con `postgresql://...`)

### 2. Configurar variables de entorno locales

```bash
cp .env.example .env
```

Edita `.env`:
```env
DATABASE_URL=postgresql://tu_usuario:tu_password@tu_host/tu_db?sslmode=require
JWT_SECRET=el_secreto_que_ya_está_generado_en_el_archivo
```

### 3. Inicializar la base de datos y crear usuarios

```bash
npm run seed
```

Esto creará las tablas y los 3 usuarios iniciales:

| Email                    | Contraseña    | Rol          |
|--------------------------|---------------|--------------|
| admin@europlate.pe       | Admin2024!    | Administrador|
| ventas@europlate.pe      | Ventas2024!   | Vendedor     |
| operador@europlate.pe    | Oper2024!     | Operador     |

> ⚠️  Cambia las contraseñas después del primer login (módulo Usuarios y Permisos).

### 4. Probar localmente

```bash
npm run dev
```

Abre [http://localhost:8888](http://localhost:8888)

---

## Deploy a Netlify

### Opción A — Netlify CLI (recomendado)

```bash
# 1. Login
netlify login

# 2. Crear el sitio y hacer deploy
netlify deploy --prod

# 3. Configurar variables de entorno en Netlify
netlify env:set DATABASE_URL "postgresql://..."
netlify env:set JWT_SECRET "el_jwt_secret"

# 4. Hacer re-deploy para aplicar las variables
netlify deploy --prod
```

### Opción B — GitHub + Netlify (sin CLI)

1. Sube este proyecto a GitHub
2. En Netlify dashboard → **Add new site** → **Import an existing project**
3. Conecta tu repo de GitHub
4. En **Build settings**:
   - Build command: *(vacío)*
   - Publish directory: `public`
5. En **Environment variables**, agrega:
   - `DATABASE_URL` → tu connection string de Neon
   - `JWT_SECRET` → el secreto de JWT
6. Haz clic en **Deploy site**

---

## Estructura del proyecto

```
europlate/
├── public/
│   └── index.html          # Frontend SPA completo
├── netlify/
│   └── functions/
│       ├── auth.js         # POST /api/auth (login)
│       └── state.js        # GET/PATCH /api/state
├── db/
│   └── schema.sql          # Esquema PostgreSQL
├── scripts/
│   └── seed.js             # Script de inicialización de BD
├── .env.example            # Variables de entorno (plantilla)
├── netlify.toml            # Configuración de Netlify
└── package.json
```

---

## API Endpoints

| Método | Ruta         | Auth | Descripción                        |
|--------|--------------|------|------------------------------------|
| POST   | /api/auth    | No   | Login → devuelve JWT + estado      |
| GET    | /api/state   | JWT  | Obtiene el estado completo         |
| PATCH  | /api/state   | JWT  | Guarda el estado completo          |

---

## Módulos del sistema

1. **Dashboard** — Métricas, gráfico de compras, alertas de stock
2. **Productos** — Configurador con variantes, atributos, unidades de medida
3. **Proveedores** — Nacionales (RUC) y Extranjeros
4. **Agentes de Aduana** — Gestión de agentes para importaciones
5. **Compras Nacionales** — Registro y control de stock
6. **Importaciones** — Con costos de desaduanaje y adjuntos
7. **Producción** — Órdenes, insumos, consumo inmediato/parcial
8. **Almacén e Inventario** — Stock, movimientos, transferencias, ajustes
9. **Usuarios y Permisos** — Roles, matriz de permisos, auditoría
10. **Tipo de Cambio** — USD / PEN con historial
11. **Reportes** — Stock, movimientos, compras, producción
