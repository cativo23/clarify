# ✨ Clarify - Auditoría de Contratos con IA

> **Clarify** es una plataforma impulsada por IA diseñada para democratizar el acceso a la asesoría legal. Permite a los usuarios cargar contratos complejos y recibir una auditoría detallada en lenguaje sencillo, identificando riesgos, beneficios y puntos críticos en segundos.

![Nuxt 3](https://img.shields.io/badge/Nuxt%203-00DC82?style=for-the-badge&logo=nuxtdotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 🚀 Características Principales

- 📄 **Análisis de PDF:** Extracción de texto y procesamiento de documentos legales.
- 👨‍⚖️ **Auditoría Legal con IA:** Prompt dinámico especializado en protección al consumidor y detección de cláusulas abusivas.
- 📊 **Dashboard de Usuario:** Historial de análisis realizados y gestión de documentos.
- 💳 **Sistema de Créditos:** Pago por análisis integrado con Stripe.
- 🔐 **Autenticación Robusta:** Gestión de usuarios y sesiones vía Supabase Auth.
- 🐳 **Entorno Dockerizado:** Configuración lista para producción con Docker Compose.

---

## 🛠️ Stack Tecnológico

- **Framework:** [Nuxt 3](https://nuxt.com/) (Vue 3, TypeScript)
- **Base de Datos & Auth:** [Supabase](https://supabase.com/)
- **IA:** [OpenAI API](https://openai.com/) (GPT-4o)
- **Pasarela de Pagos:** [Stripe](https://stripe.com/)
- **Estilos:** Tailwind CSS con estética Premium.
- **Infraestructura:** Docker / Docker Compose.

---

## 🏁 Inicio Rápido

### Requisitos Previos

- Node.js (v18+) o Docker Desktop.
- Cuentas en OpenAI, Stripe y Supabase.

### 1. Clonar y Configurar

```bash
git clone <repository-url>
cd clarify
```

### 2. Variables de Entorno

Copia el archivo `.env.example` a `.env` y rellena las credenciales:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://...
SUPABASE_KEY=...
SUPABASE_SERVICE_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Ejecutar con Docker (Recomendado)

El proyecto está configurado para levantar todo el entorno con un solo comando:

```bash
docker compose up -d --build
```
La aplicación estará disponible en `http://localhost:3001`.

### 4. Ejecución Local (Desarrollo)

```bash
npm install
npm run dev
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test:run       # Run once
npm run test           # Watch mode
npm run test:ui        # Graphical UI

# E2E tests (from host machine)
npm run test:e2e       # Run all E2E tests
npm run test:e2e:ui    # With UI
```

📖 See [Testing Guide](docs/TESTING.md) for detailed documentation.

---

## 📂 Estructura del Proyecto

```text
├── components/          # Componentes de UI reutilizables (AppHeader, RiskCard, etc)
├── docs/                # Documentación técnica detallada
├── pages/               # Vistas de la aplicación (Dashboard, Login, Análisis)
├── server/
│   ├── api/             # Endpoints (Analyze, Upload, Stripe Webhooks)
│   ├── prompts/         # Prompts de IA configurables (análisis legal)
│   └── utils/           # Utilidades de servidor (OpenAI, Stripe, PDF Parser)
├── types/               # Definiciones de TypeScript
└── public/              # Assets estáticos
```

---

## 📚 Documentación Detallada

Para una configuración más profunda, consulta nuestras guías para desarrolladores:

1. 🧪 [Analysis Tiers & AI Strategy](docs/ANALYSIS_TIERS.md)
2. 🏗️ [Technical Architecture](docs/ARCHITECTURE.md)
3. 🔐 [Security & Risk Report](docs/SECURITY.md)
4. 💳 [Stripe Setup](docs/STRIPE_SETUP.md)
5. 🗄️ [Supabase Setup](docs/SUPABASE_SETUP.md)
6. 📖 [Developer Walkthrough](docs/DEV_WALKTHROUGH.md)
7. 🧪 [Testing Guide](docs/TESTING.md)

---

## 🤝 Contribución

1. Crea un fork del proyecto.
2. Crea una rama para tu función (`git checkout -b feature/AmazingFeature`).
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`).
4. Haz push a la rama (`git push origin feature/AmazingFeature`).
5. Abre un Pull Request.

---

Desarrollado con ❤️ para simplificar el mundo legal.
