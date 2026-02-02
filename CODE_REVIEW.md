# Code Review Report

## Resumen Ejecutivo

La aplicación muestra una base sólida con buenas prácticas en el manejo de operaciones asíncronas y TypeScript. Sin embargo, existe un **hallazgo crítico de arquitectura** relacionado con el despliegue en Vercel que impedirá el funcionamiento correcto de los workers de BullMQ.

### Clasificación de Hallazgos

| Severidad         | Cantidad | Descripción Principal                                     |
| ----------------- | -------- | --------------------------------------------------------- |
| 🔴 **CRÍTICO**    | 1        | Incompatibilidad BullMQ / Vercel Serverless               |
| 🟡 **WARNING**    | 2        | Falta de Rate Limiting y Validación de Nombres de Archivo |
| 🟢 **SUGERENCIA** | 3        | Mejoras en Seguridad y Logging                            |

---

## 1. Arquitectura y Organización

### 🔴 CRÍTICO: Incompatibilidad de Worker en Vercel

En `nuxt.config.ts`, la configuración `nitro: { preset: 'vercel' }` indica un despliegue serverless. Sin embargo, el worker de BullMQ está inicializado en `server/plugins/worker.ts`.

**El Problema:**
En entornos Serverless (Vercel), las funciones son efímeras. Cuando una petición API termina, el proceso se congela o destruye. El plugin `worker.ts` se ejecutará una vez al arrancar la función, pero **morirá poco después**, interrumpiendo el procesamiento de trabajos en la cola. BullMQ requiere un proceso persistente (Node.js script corriendo continuamente).

**Solución Recomendada:**

1.  **Opción A (Serverless):** Migrar de BullMQ a QStash o Inngest, que están diseñados para serverless y disparan tus endpoints vía HTTP.
2.  **Opción B (VPS/Docker):** Cambiar el preset de Nitro a `node-server` y desplegar en un VPS (DigitalOcean, Railway, etc.) o Container Service donde el proceso pueda correr indefinidamente.
3.  **Opción C (Híbrida):** Mantener el frontend/API en Vercel pero mover el Worker a un servicio separado (ej. un dyno de Heroku o servicio de Railway) que solo corra el script del worker.

### 🟢 SUGERENCIA: Estructura de Proyecto

- La separación entre `server/api`, `server/utils` y `server/plugins` es correcta y limpia.
- El uso de `database/` sugiere migraciones manuales. Considera usar Prisma o Drizzle ORM para tipado fuerte en base de datos, aunque el cliente de Supabase actual está bien utilizado.

---

## 2. Implementación de BullMQ

### 🟢 Puntos Fuertes

- **Configuración Redis:** Uso correcto de `maxRetriesPerRequest: null`.
- **Atomicidad:** `analyze.post.ts` utiliza una RPC `process_analysis_transaction` para asegurar que el descuento de créditos y la creación del trabajo sean atómicos. Esto previene condiciones de carrera.
- **Manejo de Errores:** El worker tiene bloques `try/catch` robustos que actualizan el estado a `failed` y guardan trazas de error.

### 🔴 CRÍTICO (Relacionado con Arquitectura)

- **Concurrency:** `concurrency: 2` es inútil en serverless porque cada función lambda corre aislada. Si cambias a VPS, está bien.

---

## 3. Integración con GPT

### 🟢 Puntos Fuertes

- **Robustez JSON:** La lógica para extraer JSON (`retry/catch` con fallback regex) en `openai-client.ts` es excelente para lidiar con respuestas "verborrágicas" de los LLMs.
- **Configuración Dinámica:** El sistema de tiers y configuración cargada desde BD (`getPromptConfig`) permite ajustar modelos y límites sin redesplegar.
- **Manejo de Errores:** Se capturan las "Refusals" de OpenAI y errores de longitud de tokens.

### 🟡 WARNING: Path Resolution

En `openai-client.ts`:

```typescript
const promptPath = path.resolve(
  process.cwd(),
  `server/prompts/${versionToUse}/${promptFile}`,
);
```

`process.cwd()` puede variar dependiendo del entorno de despliegue (dentro del contenedor vs local vs serverless). Verifica que la carpeta `server/prompts` se incluya en el build final. Considera usar `useStorage()` de Nitro para manejar assets de texto de manera más agnóstica.

---

## 4. Seguridad

### 🟡 WARNING: Validación de Inputs

En `analyze.post.ts`:

```typescript
const filename = file_url.split("/").pop() || "";
const storagePath = `${user.id}/${filename}`;
```

Extraer el filename desde una URL pública es frágil. Si la estructura de la URL cambia o si un usuario malicioso envía una URL manipulada, `storagePath` podría ser incorrecto.
**Mejora:** Pasar el `storagePath` (o el ID del archivo) directamente desde el frontend tras el upload, en lugar de reconstruirlo desde la URL.

### 🟡 WARNING: Falta de Rate Limiting

No existe middleware para limitar peticiones. Un usuario (o bot) podría saturar el endpoint `/api/analyze` o `/api/upload`.
**Recomendación:** Implementar `nuxt-rate-limit` o un middleware simple en `server/middleware/rate-limit.ts` usando Redis.

### 🟢 SUGERENCIA: Headers de Seguridad

Falta configuración de headers HTTP seguros (HSTS, X-Content-Type-Options, etc.).
**Recomendación:** Instalar `nuxt-security` o configurar manualmente `routeRules` en `nuxt.config.ts`.

---

## 5. Rendimiento y Escalabilidad

- **Workers:** Al estar (presumiblemente) mal configurados para Vercel, la escalabilidad es nula actualmente. En una arquitectura correcta (VPS), BullMQ escala muy bien.
- **Supabase Admin:** El uso de `createClient` administrativo dentro del worker es correcto para procesos en background.

## 6. Código y Mejores Prácticas

- **TypeScript:** El tipado es consistente.
- **Logging:** El uso de `console.log` es adecuado para empezar, pero para producción deberías considerar una librería de logging estructurado (como `pino`) o un servicio de monitoreo (Sentry) para capturar las excepciones del worker automáticamente.

---

## Conclusión y Siguientes Pasos

El código es de alta calidad, pero **no funcionará en producción sobre Vercel** tal como está configurado debido al Worker de BullMQ.

1.  **PASO INMEDIATO:** Decidir estrategia de despliegue.
    - Si te quedas en Vercel $\rightarrow$ Elimina BullMQ y usa Inngest/QStash o extrae el worker a un VPS.
    - Si migras a VPS $\rightarrow$ Configura Docker para correr `node .output/server/index.mjs` y el worker funcionará.

2.  **PASO SECUNDARIO:** Implementar Rate Limiting y mejorar la validación de `storagePath`.
