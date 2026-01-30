import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

export const createOpenAIClient = () => {
    const config = useRuntimeConfig()

    const openai = new OpenAI({
        apiKey: config.openaiApiKey,
    })

    return openai
}

export const analyzeContract = async (contractText: string) => {
    const openai = createOpenAIClient()

    // Read custom prompt from file
    const promptPath = path.resolve(process.cwd(), 'server/prompts/analysis-prompt.txt')
    const systemPrompt = fs.readFileSync(promptPath, 'utf-8')

    const userPrompt = `
Texto del contrato a analizar:
${contractText}
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
            temperature: 0.2,
            max_tokens: 3000,
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
