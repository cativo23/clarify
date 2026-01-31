import OpenAI from 'openai'
import fs from 'fs/promises'
import path from 'path'
import { getEncoding } from 'js-tiktoken'

export const createOpenAIClient = () => {
    const config = useRuntimeConfig()

    const openai = new OpenAI({
        apiKey: config.openaiApiKey,
    })

    return openai
}

const MAX_TOKENS_INPUT = 120000 // gpt-4o-mini has 128k, leave room for prompt

export const analyzeContract = async (contractText: string, analysisType: 'basic' | 'premium' = 'premium') => {
    const openai = createOpenAIClient()

    // Read custom prompt from file - Asyncly
    const promptFile = analysisType === 'basic' ? 'basic-analysis-prompt.txt' : 'analysis-prompt.txt'
    const promptPath = path.resolve(process.cwd(), `server/prompts/${promptFile}`)
    const systemPrompt = await fs.readFile(promptPath, 'utf-8')

    // Token counting and truncation
    const enc = getEncoding('cl100k_base')
    const tokens = enc.encode(contractText)

    let processedText = contractText
    if (tokens.length > MAX_TOKENS_INPUT) {
        console.warn(`Contract text too long (${tokens.length} tokens). Truncating to ${MAX_TOKENS_INPUT} tokens.`)
        processedText = enc.decode(tokens.slice(0, MAX_TOKENS_INPUT))
    }

    const userPrompt = `
Texto del contrato a analizar:
${processedText}
`

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
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
            temperature: 0.1, // Lower temperature for more consistency in legal analysis
            max_tokens: 8000,
            response_format: { type: 'json_object' },
        })

        const content = response.choices[0]?.message?.content
        if (!content) {
            throw new Error('No response from OpenAI')
        }

        return JSON.parse(content)
    } catch (error) {
        console.error('Error analyzing contract with OpenAI:', error)
        throw error
    }
}
