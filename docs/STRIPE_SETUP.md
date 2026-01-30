# Configuración de Stripe para Clarify

Para que el sistema de pagos funcione correctamente, necesitas configurar tu cuenta de Stripe y actualizar las variables de entorno de la aplicación.

## 1. Obtener API Keys

1. Ve al [Dashboard de Stripe](https://dashboard.stripe.com/).
2. Asegúrate de estar en **Modo de prueba** (toggle "Test mode" en la esquina superior derecha).
3. Ve a **Developers** > **API keys**.
4. Copia la `Publishable key` y la `Secret key`.
5. Pégalas en tu archivo `.env`:

```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## 2. Crear Productos (Paquetes de Créditos)

Necesitas crear 3 productos en Stripe para corresponder con los paquetes de la aplicación.

1. Ve a **Product catalog** > **Add product**.
2. **Paquete Básico (5 Créditos)**:
   - **Name**: 5 Créditos Clarify
   - **Price**: 4.99 USD
   - **Billing**: One-time
3. **Paquete Popular (10 Créditos)**:
   - **Name**: 10 Créditos Clarify
   - **Price**: 8.99 USD
   - **Billing**: One-time
4. **Paquete Pro (25 Créditos)**:
   - **Name**: 25 Créditos Clarify
   - **Price**: 19.99 USD
   - **Billing**: One-time

### Copiar Price IDs

Después de crear cada producto, busca el **API ID** del *precio* (comienza con `price_...`) y actualiza el archivo `server/utils/stripe-client.ts`:

```typescript
// server/utils/stripe-client.ts

export const CREDIT_PACKAGES = [
    {
        id: 'pack_5',
        // ...
        priceId: 'price_XXXXXX', // <-- Pega aquí el ID para 5 créditos
    },
    {
        id: 'pack_10',
        // ...
        priceId: 'price_XXXXXX', // <-- Pega aquí el ID para 10 créditos
    },
    {
        id: 'pack_25',
        // ...
        priceId: 'price_XXXXXX', // <-- Pega aquí el ID para 25 créditos
    },
]
```

## 3. Configurar Webhooks

Para que la aplicación sepa cuándo se ha realizado un pago y sume los créditos automáticamente:

### Desarrollo Local (Stripe CLI)

1. Instala Stripe CLI si no lo tienes.
2. Loguéate: `stripe login`
3. Inicia el listener redirigiendo a tu app local:
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```
4. Copia el **Webhook Signing Secret** que te muestra el comando terminal (comienza con `whsec_...`).
5. Pégalo en tu archivo `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Producción (Vercel)

1. Ve a **Developers** > **Webhooks** en Stripe Dashboard.
2. Click en **Add endpoint**.
3. **Endpoint URL**: `https://tu-dominio.vercel.app/api/stripe/webhook`
4. **Events to send**: Selecciona `checkout.session.completed`.
5. Click **Add endpoint**.
6. Copia el **Signing secret** de este endpoint.
7. Agrégalo a las variables de entorno en Vercel.
