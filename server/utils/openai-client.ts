import OpenAI from 'openai'
import fs from 'fs/promises'
import path from 'path'
import { getEncoding } from 'js-tiktoken'
import { getPromptConfig } from './config'
import { preprocessDocument } from './preprocessing'

export const createOpenAIClient = () => {
    const config = useRuntimeConfig()

    const openai = new OpenAI({
        apiKey: config.openaiApiKey,
    })

    return openai
}

export const analyzeContract = async (contractText: string, analysisType: 'basic' | 'premium' = 'premium') => {
    const openai = createOpenAIClient()

    // 1. Load Dynamic Configuration
    const promptConfig = await getPromptConfig()
    const { models, tokenLimits, features } = promptConfig

    // Force V2 if configured (or default to V2 if random string). We only support V2 now.
    const versionToUse = 'v2'

    // 2. Resolve Parameters
    const model = models[analysisType] || 'gpt-4o-mini'
    const limits = tokenLimits[analysisType] || { input: 8000, output: 800 }

    // 3. Load System Prompt -- Strict V2 Path
    const promptFile = analysisType === 'basic' ? 'basic-analysis-prompt.txt' : 'analysis-prompt.txt'
    const promptPath = path.resolve(process.cwd(), `server/prompts/${versionToUse}/${promptFile}`)

    let systemPrompt = ''
    try {
        systemPrompt = await fs.readFile(promptPath, 'utf-8')
    } catch (error) {
        console.error(`CRITICAL: Failed to load prompt from ${promptPath}`)
        throw new Error('System configuration error: Prompt file missing.')
    }

    // 4. Preprocessing & Token Control
    let processedText = contractText
    let metadata: any = {}

    if (features.preprocessing) {
        // Reserve buffer for system prompt (~2k tokens) + safety
        const availableContext = limits.input - 2000
        const result = preprocessDocument(contractText, availableContext)

        processedText = result.processedText
        metadata = {
            preprocessing: {
                originalTokens: result.originalTokenCount,
                processedTokens: result.processedTokenCount,
                truncated: result.wasTruncated,
                relevantSections: result.relevantSectionsFound
            }
        }

        if (features.tokenDebug) {
            console.log(`[Analysis Debug] Type: ${analysisType} | Version: ${versionToUse}`)
            console.log(`[Analysis Debug] Tokens: ${result.processedTokenCount} / ${limits.input} (Original: ${result.originalTokenCount})`)
        }
    } else {
        const enc = getEncoding('cl100k_base')
        const tokens = enc.encode(contractText)
        if (tokens.length > limits.input) {
            processedText = enc.decode(tokens.slice(0, limits.input))
            metadata.truncated_legacy = true
        }
    }

    const userPrompt = `
Texto del contrato a analizar:
${processedText}
`

    let rawContent = ''
    try {
        console.log('Using model:', model)
        console.log('Using limits:', limits)
        const isReasoningOrGpt5 = model.startsWith('o') || model.startsWith('gpt-5')

        const completionParams: any = {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: userPrompt,
                },
            ],
            response_format: { type: 'json_object' },
        }

        if (isReasoningOrGpt5) {
            completionParams.max_completion_tokens = limits.output
            completionParams.temperature = 1
        } else {
            completionParams.max_tokens = limits.output
            completionParams.temperature = 0.1
        }

        const response = await openai.chat.completions.create(completionParams)
        console.log('OpenAI Choice Details:', {
            finish_reason: response.choices[0]?.finish_reason,
            has_message: !!response.choices[0]?.message,
            has_content: !!response.choices[0]?.message?.content,
            refusal: (response.choices[0]?.message as any)?.refusal
        })

        rawContent = response.choices[0]?.message?.content || ''
        if (!rawContent) {
            const choice = response.choices[0]
            const message = choice?.message as any

            if (message?.refusal) {
                console.error('OpenAI Refusal:', message.refusal)
                throw new Error(`OpenAI Refusal: ${message.refusal}`)
            }

            if (choice?.finish_reason === 'length') {
                console.error('OpenAI hit token limit during reasoning/generation')
                throw new Error('El análisis es demasiado complejo para el límite de tokens actual. Intenta con un contrato más corto o aumenta el límite en configuración.')
            }

            console.error('Empty response choices[0]:', JSON.stringify(choice, null, 2))
            throw new Error('No response from OpenAI')
        }

        let result: any
        try {
            // Robust JSON extraction
            const firstBrace = rawContent.indexOf('{')
            const lastBrace = rawContent.lastIndexOf('}')

            if (firstBrace !== -1 && lastBrace !== -1) {
                const jsonCandidate = rawContent.substring(firstBrace, lastBrace + 1)
                result = JSON.parse(jsonCandidate)
            } else {
                // Fallback attempt
                const cleanContent = rawContent.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim()
                result = JSON.parse(cleanContent)
            }
        } catch (parseError) {
            // CRITICAL: We caught a JSON error. We must THROW a specific error that contains the RAW content
            // so the upper layer (Worker) can save it to the DB for debugging, while we eventually show a friendly error to user.
            const debugInfo = {
                errorType: 'INVALID_JSON',
                rawContent: rawContent,
                parseError: parseError.message,
                model_used: model
            }
            const error: any = new Error('Failed to parse analysis results')
            error.debugInfo = debugInfo // Attach for upstream handling
            throw error
        }

        // 5. Attach Metadata (Always attach if available, frontend decides visibility)
        const debugInfo = {
            ...metadata,
            model_used: model,
            prompt_version: versionToUse,
            usage: response.usage,
            timestamp: new Date().toISOString()
        }

        if (!result._debug) {
            result._debug = debugInfo
        } else {
            Object.assign(result._debug, debugInfo)
        }

        return result

    } catch (error: any) {
        console.error('Error analyzing contract with OpenAI:', error)

        // If it's already our custom error with debugInfo, rethrow it
        if (error.debugInfo) {
            throw error
        }

        // Otherwise wrap it
        const wrappedError: any = new Error(error.message || 'Error during AI analysis')
        wrappedError.debugInfo = {
            errorType: 'API_ERROR',
            rawError: error,
            model_used: model
        }
        throw wrappedError
    }
}
