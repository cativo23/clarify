// Type definitions for Clarify

export type RiskLevel = 'low' | 'medium' | 'high'

export interface User {
    id: string
    email: string
    credits: number
    created_at: string
    updated_at: string
}

export interface Analysis {
    id: string
    user_id: string
    contract_name: string
    file_url: string
    summary_json: AnalysisSummary
    risk_level: RiskLevel
    credits_used: number
    created_at: string
}

export interface AnalysisSummary {
    resumen_ejecutivo: string
    nivel_riesgo_general: 'Alto' | 'Medio' | 'Bajo'
    hallazgos: Hallazgo[]
}

export interface Hallazgo {
    color: 'rojo' | 'amarillo' | 'verde'
    titulo: string
    explicacion: string
}

export interface Transaction {
    id: string
    user_id: string
    stripe_payment_id: string | null
    credits_purchased: number
    amount: number
    status: 'pending' | 'completed' | 'failed'
    created_at: string
}

export interface UploadResponse {
    success: boolean
    file_url?: string
    error?: string
}

export interface AnalysisRequest {
    file_url: string
    contract_name: string
}

export interface AnalysisResponse {
    success: boolean
    analysis?: Analysis
    error?: string
}
