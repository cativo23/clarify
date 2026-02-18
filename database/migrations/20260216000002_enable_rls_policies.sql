-- Migration: Enable Row Level Security (RLS)
-- Date: 2026-02-16
-- Description: Add RLS policies for users, analyses, transactions, and storage

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA USUARIOS (USERS)
-- Permitir que los usuarios vean su propio perfil
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- POLÍTICAS PARA ANÁLISIS (ANALYSES)
-- Ver sus propios análisis
CREATE POLICY "Users can view own analyses"
ON public.analyses
FOR SELECT
USING (auth.uid() = user_id);

-- Insertar sus propios análisis
CREATE POLICY "Users can insert own analyses"
ON public.analyses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- POLÍTICAS PARA TRANSACCIONES (TRANSACTIONS)
-- Ver sus propias transacciones
CREATE POLICY "Users can view own transactions"
ON public.transactions
FOR SELECT
USING (auth.uid() = user_id);

-- POLÍTICAS PARA STORAGE (para el bucket 'contracts')
-- Permitir a usuarios autenticados subir archivos a su propia carpeta
CREATE POLICY "Users can upload own contracts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'contracts' AND
  auth.uid() = owner
);

-- Permitir a usuarios autenticados leer sus propios archivos
CREATE POLICY "Users can view own contracts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'contracts' AND
  auth.uid() = owner
);
