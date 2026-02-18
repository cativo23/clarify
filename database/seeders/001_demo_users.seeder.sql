-- Database Seeder: Demo Users
-- Purpose: Create demo users for testing
-- Run: npm run db:seed

-- Note: These users are for development/testing only
-- Do not run in production

-- Demo User 1 - Regular user with credits
INSERT INTO users (id, email, credits, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo@clarify.app',
    10,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    credits = EXCLUDED.credits;

-- Demo User 2 - Admin user (match with ADMIN_EMAIL env var)
INSERT INTO users (id, email, credits, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'admin@clarify.app',
    100,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    credits = EXCLUDED.credits;

-- Demo User 3 - Low credits user
INSERT INTO users (id, email, credits, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    'user@clarify.app',
    2,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    credits = EXCLUDED.credits;

-- Demo Analyses for testing
INSERT INTO analyses (id, user_id, contract_name, file_url, summary_json, risk_level, status, credits_used, created_at)
VALUES 
    (
        '10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'Contrato de Arriendo',
        'contracts/demo/lease-agreement.pdf',
        '{"nivel_riesgo_general": "Medio", "resumen": "Contrato estándar con algunas cláusulas de precaución"}'::jsonb,
        'medium',
        'completed',
        3,
        CURRENT_TIMESTAMP - INTERVAL '7 days'
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001',
        'Acuerdo de Confidencialidad',
        'contracts/demo/nda.pdf',
        '{"nivel_riesgo_general": "Bajo", "resumen": "Documento estándar sin riesgos significativos"}'::jsonb,
        'low',
        'completed',
        1,
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000002',
        'Contrato de Servicios',
        'contracts/demo/services.pdf',
        '{"nivel_riesgo_general": "Alto", "resumen": "Múltiples cláusulas problemáticas detectadas"}'::jsonb,
        'high',
        'completed',
        3,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    )
ON CONFLICT (id) DO NOTHING;

-- Demo Transactions
INSERT INTO transactions (id, user_id, stripe_payment_id, credits_purchased, amount, status, created_at)
VALUES
    (
        '20000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'pi_demo_001',
        10,
        9.99,
        'completed',
        CURRENT_TIMESTAMP - INTERVAL '10 days'
    ),
    (
        '20000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000002',
        'pi_demo_002',
        100,
        49.99,
        'completed',
        CURRENT_TIMESTAMP - INTERVAL '15 days'
    )
ON CONFLICT (id) DO NOTHING;
