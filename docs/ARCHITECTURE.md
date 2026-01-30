# 🏗️ Arquitectura Técnica - Clarify

Este documento detalla el diseño técnico y el flujo de datos de la plataforma Clarify para desarrolladores.

## 🧱 Componentes del Sistema

El sistema sigue una arquitectura de Micro-SaaS moderna basada en Nuxt 3 (Fullstack Framework):

### 1. Frontend (Vue 3 / Nuxt 3)
- **Framework:** Nuxt 3 con Sidebase/Supabase para autenticación.
- **UI:** Tailwind CSS con componentes modulares (`RiskCard`, `Dropzone`, `AppHeader`).
- **Gestión de Estado:** Vue Composition API (`ref`, `computed`).
- **Protección de Rutas:** Middleware de autenticación integrado con Supabase Auth.

### 2. Backend (Nitro Engine)
- **API Server:** Endpoints en `server/api/`.
- **Análisis de Documentos:** Servidor encargado de la extracción de texto (PDF) para evitar fugas de memoria en el cliente.
- **Integración IA:** Comunicación segura con OpenAI desde el lado del servidor.
- **Webhooks:** Gestión de eventos asíncronos de Stripe para la recarga de créditos.

### 3. Persistencia y Almacenamiento (Supabase)
- **Base de Datos:** PostgreSQL para usuarios, análisis y transacciones.
- **Storage:** Buckets de Supabase para el almacenamiento persistente de contratos PDF.
- **Auth:** Proveedor de identidad gestionado.

---

## 🔄 Flujo de Datos: Análisis de Contrato

El proceso de análisis es el núcleo de la aplicación y sigue estos pasos:

1. **Carga (Upload):** El cliente sube un PDF a `server/api/upload`. Nitro lo transfiere al Bucket `contracts` de Supabase Storage bajo el folder del `user_id`.
2. **Extracción:** El backend descarga el PDF temporalmente, extrae el texto plano usando `pdf-parse`.
3. **Auditoría (IA):**
    - Se carga el prompt dinámico desde `server/prompts/analysis-prompt.txt`.
    - Se envía el texto + prompt a `gpt-4o`.
    - Se recibe un objeto JSON estructurado con la auditoría.
4. **Almacenamiento:** El resultado se guarda en la tabla `analyses` (columna `summary_json`).
5. **Deducción:** Se resta 1 crédito de la tabla `users` de forma atómica.
6. **Visualización:** El cliente recibe la ID del análisis y redirige a la página de resultados.

---

## 💳 Sistema de Créditos y Pagos

Clarify utiliza un modelo de "Top-up" basado en créditos:

- **Inicio Gratuitos:** Al crear una cuenta (vía Trigger en BD), el usuario recibe 3 créditos.
- **Checkout:** Se utiliza [Stripe Checkout](https://stripe.com/docs/payments/checkout) para una experiencia segura y cumplimiento de PCI.
- **Cumplimiento (Fullfillment):** El crédito no se añade en el frontend. El servidor de Stripe envía un Webhook a `server/api/stripe/webhook` que valida la firma y actualiza el saldo del usuario en la base de datos de forma segura.

---

## 🛡️ Seguridad y RLS

La seguridad se apoya fuertemente en **Row Level Security (RLS)** de Supabase:

- Un usuario **NUNCA** puede leer los análisis de otro.
- Las claves de API críticas (`OPENAI_API_KEY`, `STRIPE_SECRET_KEY`) solo residen en el servidor y nunca se exponen al cliente.
- Las comunicaciones cliente-servidor se validan mediante el JWT de sesión de Supabase.

---

## 🛠️ Herramientas de Desarrollo Recomendadas

- **Visual Studio Code** + extensión Volar (Vue 3).
- **Postman/Insomnia:** Para pruebas de API.
- **Stripe CLI:** Esencial para probar webhooks en local.
- **Supabase CLI:** Para migraciones locales (opcional).
