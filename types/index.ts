// Type definitions for Clarify

export type RiskLevel = "low" | "medium" | "high";

export interface User {
  id: string;
  email: string;
  credits: number;
  is_admin?: boolean;
  is_suspended?: boolean;
  suspension_reason?: string | null;
  suspended_at?: string | null;
  email_confirmed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  id: string;
  user_id: string;
  contract_name: string;
  file_url: string;
  summary_json: AnalysisSummary | null;
  risk_level: RiskLevel | null;
  credits_used: number;
  status: "pending" | "processing" | "completed" | "failed" | "queued" | "analyzing" | "finalizing";
  error_message?: string;
  analysis_type?: "basic" | "premium" | "forensic";
  created_at: string;
  risk_items?: RiskItem[];
  key_clauses?: KeyClause[];
  pdf_available?: boolean;
  tokens_used?: number;
}

export interface RiskItem {
  id: string;
  clause_text: string;
  risk_level: RiskLevel;
  category: string;
  severity: number;
  recommendation: string;
}

export interface KeyClause {
  id: string;
  title: string;
  text: string;
  importance: string;
}

export interface AnalysisSummary {
  resumen_ejecutivo: {
    veredicto: string;
    justificacion: string;
    clausulas_criticas_totales: number;
    mayor_riesgo_identificado: string;
  };
  nivel_riesgo_general: "Alto" | "Medio" | "Bajo";
  metricas: {
    total_rojas: number;
    total_amarillas: number;
    total_verdes: number;
    porcentaje_clausulas_analizadas: string;
  };
  hallazgos: Hallazgo[];

  // Fields used in demo and for compatibility with simulated results
  executive_summary?: string;
  risk_score?: number;
  key_findings?: string[];
  recommendations?: string[];

  clausulas_no_clasificadas?: {
    clausula: string;
    motivo: string;
  }[];

  // Forensic-specific fields
  analisis_cruzado?: AnalisisCruzadoItem[];
  omisiones?: OmisionCritic[];
  mapa_estructural?: MapaEstructural;

  _debug?: any;
}

// Forensic-specific interfaces
export interface AnalisisCruzadoItem {
  inconsistencia_id: string;
  tipo: string;
  clausula_origen: string;
  clausula_destino: string;
  texto_origen: string;
  texto_destino: string;
  inconsistencia: string;
  impacto: string;
  recomendacion: string;
  severidad: "rojo" | "amarillo";
}

export interface OmisionCritic {
  omision_id: string;
  categoria: string;
  que_falta: string;
  por_que_critico: string;
  riesgo_usuario: string;
  clausula_sugerida: string;
}

export interface MapaEstructural {
  total_secciones: number;
  total_anexos: number;
  total_paginas: number;
  secciones: Array<{
    nombre: string;
    paginas: string;
    riesgo: "rojo" | "amarillo" | "verde" | "gris";
  }>;
}

export interface Hallazgo {
  color: "rojo" | "amarillo" | "verde";
  titulo: string;
  explicacion: string;
  clausula?: string;
  cita_textual?: string;
  riesgo_real?: string;
  mitigacion?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  stripe_payment_id: string | null;
  credits_purchased: number;
  amount: number;
  status: "pending" | "completed" | "failed";
  created_at: string;
}

export interface UploadResponse {
  success: boolean;
  file_url?: string;
  error?: string;
}

export interface AnalysisRequest {
  file_url: string;
  contract_name: string;
}

export interface AnalysisResponse {
  success: boolean;
  analysis?: Analysis;
  error?: string;
}
