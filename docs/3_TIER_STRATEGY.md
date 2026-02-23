# Estrategia de 3 Niveles y Dashboard de Analíticas Admin

## Objetivo
Configurar Clarify para ofrecer tres niveles de análisis, optimizando el margen con **GPT-5 mini** en el nivel Premium y utilizando **GPT-5** para el nivel Forensic. Se implementará un panel administrativo para el monitoreo de costos, rendimiento técnico y analíticas por usuario.

## 1. Arquitectura de 3 Niveles

| Nivel | Modelo | Créditos | Estrategia de Upselling (Trigger) |
| :--- | :--- | :---: | :--- |
| **Basic** | `gpt-4o-mini` | 1 | Base. Disponible para documentos cortos. |
| **Premium** | `gpt-5-mini` | 3 | **RECOMENDADO.** Sugerir si tokens > 8k. Destacado en UI. |
| **Forensic**| `gpt-5` | 10 | **AUDITORÍA CRÍTICA.** Sugerir si tokens > 40k. |

> **Nota sobre el Prompt:** El tier **Forensic** usará el mismo prompt v2 (profundo), pero al ejecutarse en **GPT-5 (Grande)**, la precisión y el rigor del análisis serán significativamente superiores al Mini, justificando el costo para contratos de alto valor.

## 2. Admin Analytics Dashboard

### Infraestructura de Datos
- **Tabla `pricing_tables` (BD):** Almacenará los costos actuales de OpenAI (Input, Cached Input, Output) por modelo. Esto permitirá estimar costos en tiempo real.
- **Vistas de Admin:**
    - **Lista de Usuarios:** Tabla con nombre, email, consumo total estimado generado y créditos.
    - **Detalle de Usuario:** Historial de análisis del usuario con indicadores de costo por cada uno.
    - **Detalle Técnico:** Al hacer clic en un análisis, ver el `_debug` (tokens usados, tiempo, modelo) y la distribución de hallazgos (Rojos/Amarillos/Verdes) mediante gráficas de resumen.

## 3. Estrategia de UI/UX (Upselling)

- **Cards de Selección:** La tarjeta "Premium" será la más atractiva visualmente.
- **Recomendación Inteligente:** Al subir un archivo, el sistema evaluará los tokens y mostrará un mensaje: *"Tu contrato es extenso/complejo. Para un análisis seguro del 95%+, recomendamos el nivel [Premium/Forensic]."*
- **Modo Debug:** El conteo de tokens solo será visible para el Admin si `debug=true`.

## 4. Cambios Técnicos

### Backend
- [ ] **BD:** Crear tabla `pricing_tables`.
- [ ] **Config:** Actualizar `server/utils/config.ts` para incluir los 3 niveles y sus límites de tokens dinámicos.
- [ ] **API Admin:** Crear endpoints para las analíticas de costos y usuarios.

### Frontend
- [ ] **Dashboard Admin:** Nueva página de analíticas con integración de gráficas (Chart.js o similar).
- [ ] **Dashboard Usuario:** Rediseñar selector de análisis para soportar el upselling y los 3 tiers.
