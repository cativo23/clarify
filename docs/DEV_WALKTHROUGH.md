# 📖 Guía de Desarrollo y Funcionalidades (MVP)

Bienvenido a la guía técnica de **Clarify**. Este documento describe los hitos alcanzados y cómo opera cada sección del MVP para facilitar la integración de nuevos desarrolladores.

## 🏁 Estado Actual: MVP Completo

El proyecto ha superado las fases fundamentales de infraestructura, lógica de negocio y UI Premium. Actualmente se encuentra en un estado listo para despliegue en producción (Staging/Master).

---

## 🛠️ Módulos Implementados

### 1. Infraestructura de Microservicios
- **Docker Ready:** El sistema utiliza contenedores optimizados para Node 20 y PostgreSQL. [docker-compose.yml](file:///home/cativo23/projects/personal/clarify/docker-compose.yml) gestiona el stack completo.
- **Persistence Layer:** Esquema relacional optimizado con índices para búsquedas rápidas de análisis por usuario. [database/init.sql](file:///home/cativo23/projects/personal/clarify/database/init.sql).

### 2. Motor de Auditoría IA
- **Análisis Semántico:** Integración con OpenAI GPT-4o. La lógica reside en [server/utils/openai-client.ts](file:///home/cativo23/projects/personal/clarify/server/utils/openai-client.ts) y utiliza un **Prompt Dinámico** externalizado en `server/prompts/`.
- **Parser de Documentos:** Extracción robusta de texto desde PDF para análisis masivos. [server/utils/pdf-parser.ts](file:///home/cativo23/projects/personal/clarify/server/utils/pdf-parser.ts).

### 3. Pagos y Monetización
- **Stripe Integration:** Flujo completo de Checkout y Webhooks. El sistema garantiza que los créditos solo se otorguen tras la confirmación exitosa de Stripe. [server/api/stripe/webhook.post.ts](file:///home/cativo23/projects/personal/clarify/server/api/stripe/webhook.post.ts).

### 4. Interfaz de Usuario (UI/UX)
- **Dashboard:** Centro de control del usuario con métricas en tiempo real y carga de archivos vía Drag & Drop. [pages/dashboard.vue](file:///home/cativo23/projects/personal/clarify/pages/dashboard.vue).
- **Reportes Visuales:** Visualización de riesgos mediante componentes semáforo (`RiskCard.vue`) y resumen ejecutivo. [pages/analyze/[id].vue](file:///home/cativo23/projects/personal/clarify/pages/analyze/%5Bid%5D.vue).

---

## 🧭 Navegando el Código

Para entender la lógica profunda, recomendamos leer los siguientes documentos en orden:

1. 🏗️ [Arquitectura de Sistema](file:///home/cativo23/projects/personal/clarify/docs/ARCHITECTURE.md)
2. 🗄️ [Configuración de Infraestructura (Supabase)](file:///home/cativo23/projects/personal/clarify/docs/SUPABASE_SETUP.md)
3. 💳 [Manual de Integración Financiera (Stripe)](file:///home/cativo23/projects/personal/clarify/docs/STRIPE_SETUP.md)

---

## 🚀 Guía de Despliegue (Checklist)

Para llevar Clarify a producción, siga estos pasos críticos:

- [ ] **Configuración de Dominio:** Apuntar DNS a Vercel/Netlify.
- [ ] **Secrets Management:** Configurar las 7 variables de entorno clave en el panel de control de producción.
- [ ] **Whitelisting:** Agregar el dominio de producción a los "Allowed Origins" en Supabase y Stripe.
- [ ] **Webhooks:** Asegurarse de que el Webhook Secret de Stripe coincida con el de producción.

---

Este proyecto ha sido diseñado siguiendo principios de **Limpia Arquitectura** y **Typescript First** para asegurar su mantenibilidad y escalabilidad a futuro.
