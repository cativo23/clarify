import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeContract, createOpenAIClient } from '@/server/utils/openai-client'
import { getPromptConfig } from '@/server/utils/config'

// Mock dependencies
const mockOpenAI = vi.fn()
const mockChatCreate = vi.fn()

// 1. Mock OpenAI Class
vi.mock('openai', () => {
    return {
        default: class OpenAI {
            chat = {
                completions: {
                    create: mockChatCreate
                }
            }
            constructor(opts: any) {
                mockOpenAI(opts)
            }
        }
    }
})

// 2. Mock fs/promises
vi.mock('fs/promises', async () => {
    return {
        default: {
            readFile: vi.fn().mockResolvedValue('System Prompt Content')
        },
        readFile: vi.fn().mockResolvedValue('System Prompt Content')
    }
})

// 3. Mock config util
vi.mock('@/server/utils/config', () => ({
    getPromptConfig: vi.fn()
}))

// 4. Mock preprocessing util
vi.mock('@/server/utils/preprocessing', () => ({
    preprocessDocument: vi.fn().mockReturnValue({
        processedText: 'Processed Contract Text',
        originalTokenCount: 100,
        processedTokenCount: 80,
        wasTruncated: false,
        relevantSectionsFound: true
    })
}))

// 5. Mock Runtime Config
const mockRuntimeConfig = vi.fn()
vi.stubGlobal('useRuntimeConfig', mockRuntimeConfig)

describe('OpenAI Client Utils', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        mockRuntimeConfig.mockReturnValue({
            openaiApiKey: 'sk-test-key-123'
        })

        // Default valid config
        vi.mocked(getPromptConfig).mockResolvedValue({
            promptVersion: 'v2',
            tiers: {
                basic: { model: 'gpt-4o-mini', credits: 1, tokenLimits: { input: 1000, output: 500 } },
                premium: { model: 'gpt-4o', credits: 3, tokenLimits: { input: 2000, output: 1000 } },
                forensic: { model: 'gpt-5', credits: 10, tokenLimits: { input: 5000, output: 2000 } }
            },
            features: { preprocessing: true, tokenDebug: false }
        })

        // Default OpenAI response
        mockChatCreate.mockResolvedValue({
            choices: [{
                finish_reason: 'stop',
                message: {
                    content: JSON.stringify({ riskScore: 85, summary: 'High risk' })
                }
            }],
            usage: { total_tokens: 150 }
        })
    })

    describe('createOpenAIClient', () => {
        it('should initialize OpenAI with config API key', () => {
            createOpenAIClient()
            expect(mockOpenAI).toHaveBeenCalledWith({
                apiKey: 'sk-test-key-123'
            })
        })
    })

    describe('analyzeContract', () => {
        it('should call OpenAI with correct parameters', async () => {
            await analyzeContract('Contract Text', 'premium')

            expect(mockChatCreate).toHaveBeenCalledWith(expect.objectContaining({
                model: 'gpt-4o',
                messages: expect.arrayContaining([
                    expect.objectContaining({ role: 'system', content: 'System Prompt Content' }),
                    expect.objectContaining({ role: 'user' })
                ]),
                response_format: { type: 'json_object' }
            }))
        })

        it('should use basic tier model when requested', async () => {
            await analyzeContract('Contract Text', 'basic')

            expect(mockChatCreate).toHaveBeenCalledWith(expect.objectContaining({
                model: 'gpt-4o-mini'
            }))
        })

        it('should strip json markdown from response', async () => {
            mockChatCreate.mockResolvedValue({
                choices: [{
                    message: {
                        content: '```json\n{ "risk": "high" }\n```'
                    }
                }]
            })

            const result = await analyzeContract('raw text')
            expect(result).toEqual(expect.objectContaining({ risk: 'high' }))
        })

        it('[SECURITY] should throw error if configured model is not in whitelist', async () => {
            // Mock config returning malicious model
            vi.mocked(getPromptConfig).mockResolvedValueOnce({
                promptVersion: 'v2',
                tiers: {
                    premium: { model: 'evil-model-v666', credits: 1, tokenLimits: { input: 100, output: 100 } }
                } as any,
                features: { preprocessing: false, tokenDebug: false }
            })

            await expect(analyzeContract('text')).rejects.toThrow('Invalid AI model configuration')
        })

        it('[SECURITY] should handle OpenAI refusal safely', async () => {
            mockChatCreate.mockResolvedValue({
                choices: [{
                    message: {
                        refusal: "I cannot analyze this."
                    }
                }]
            })

            await expect(analyzeContract('text')).rejects.toThrow('Unable to analyze contract')
        })

        it('should attach debug metadata if available', async () => {
            const result = await analyzeContract('text')
            expect(result._debug).toBeDefined()
            expect(result._debug.model_used).toBe('gpt-4o')
            expect(result._debug.preprocessing).toBeDefined()
        })
    })
})
