import { getEncoding } from 'js-tiktoken'

const enc = getEncoding('cl100k_base')

const KEYWORDS = {
    money: ['pago', 'precio', 'tarifa', 'reembolso', 'multa', 'penalización', 'dolar', 'euro', 'costo', 'cargo'],
    duration: ['plazo', 'vigencia', 'terminación', 'renovación', 'duración', 'fecha', 'vencimiento', 'cancelación'],
    liability: ['responsabilidad', 'indemnización', 'garantía', 'daño', 'perjuicio', 'culpa', 'negligencia'],
    data: ['datos', 'privacidad', 'personal', 'información', 'confidencial', 'tratamiento', 'ceder'],
    dispute: ['arbitraje', 'jurisdicción', 'ley', 'disputa', 'demanda', 'litigio', 'tribunal', 'juez']
}

interface PreprocessingResult {
    processedText: string
    originalTokenCount: number
    processedTokenCount: number
    wasTruncated: boolean
    relevantSectionsFound: string[]
}

export const preprocessDocument = (text: string, maxTokens: number): PreprocessingResult => {
    const originalTokens = enc.encode(text)
    const originalCount = originalTokens.length

    if (originalCount <= maxTokens) {
        return {
            processedText: text,
            originalTokenCount: originalCount,
            processedTokenCount: originalCount,
            wasTruncated: false,
            relevantSectionsFound: []
        }
    }

    // Split by probable headers (lines that look like headers or double newlines)
    // Heuristic: Split by double newlines to get paragraphs/sections
    const chunks = text.split(/\n\s*\n/)

    const scoredChunks = chunks.map(chunk => {
        const lowerChunk = chunk.toLowerCase()
        let score = 0
        const matchedCategories = new Set<string>()

        // Simple scoring based on keyword presence
        Object.entries(KEYWORDS).forEach(([category, words]) => {
            if (words.some(w => lowerChunk.includes(w))) {
                score += 1
                matchedCategories.add(category)
            }
        })

        // Boost beginning and end of contract (usually important)
        // We can't easily know position here without index, but we'll assemble later.

        return {
            text: chunk,
            score,
            tokens: enc.encode(chunk),
            categories: Array.from(matchedCategories)
        }
    })

    // Prepare result
    let currentTokens = 0
    const finalChunks: string[] = []
    const categoriesFound = new Set<string>()

    // Always include first and last chunk if possible (context)
    if (scoredChunks.length > 0) {
        const first = scoredChunks[0]
        if (first && currentTokens + first.tokens.length < maxTokens) {
            finalChunks.push(first.text)
            currentTokens += first.tokens.length
        }
    }

    // Sort remaining chunks by score desc
    const midChunks = scoredChunks.slice(1, -1).sort((a, b) => b.score - a.score)

    for (const chunk of midChunks) {
        if (currentTokens + chunk.tokens.length < maxTokens) {
            finalChunks.push(chunk.text)
            currentTokens += chunk.tokens.length
            chunk.categories.forEach(c => categoriesFound.add(c))
        }
    }

    // Try to add last chunk
    if (scoredChunks.length > 1) {
        const last = scoredChunks[scoredChunks.length - 1]
        if (last && currentTokens + last.tokens.length < maxTokens) {
            finalChunks.push(last.text)
            currentTokens += last.tokens.length
        }
    }

    // Re-sort final chunks by original order? 
    // Usually better to keep document flow, but identifying original index is needed.
    // Ideally we filter then sort by index. 
    // Let's refine the logic to preserve order.

    // Better logic: Mark chunks to keep, then join.
    const keepIndices = new Set<number>()
    let tokensUsed = 0

    // Always keep start/end
    if (scoredChunks.length > 0) {
        keepIndices.add(0)
        const first = scoredChunks[0]
        if (first) {
            tokensUsed += first.tokens.length
        }
    }
    if (scoredChunks.length > 1) {
        keepIndices.add(scoredChunks.length - 1)
        const last = scoredChunks[scoredChunks.length - 1]
        if (last) {
            tokensUsed += last.tokens.length
        }
    }

    // Fill with high score chunks
    const sortedIndices = scoredChunks.map((_, i) => i)
        .filter(i => !keepIndices.has(i))
        .sort((a, b) => {
            const chunkA = scoredChunks[a]
            const chunkB = scoredChunks[b]
            return (chunkB?.score || 0) - (chunkA?.score || 0)
        })

    for (const i of sortedIndices) {
        const chunk = scoredChunks[i]
        if (!chunk) continue

        if (tokensUsed + chunk.tokens.length <= maxTokens) {
            keepIndices.add(i)
            tokensUsed += chunk.tokens.length
            chunk.categories.forEach(c => categoriesFound.add(c))
        }
    }

    const compiledText = chunks
        .filter((_, i) => keepIndices.has(i))
        .join('\n\n')

    return {
        processedText: compiledText,
        originalTokenCount: originalCount,
        processedTokenCount: tokensUsed,
        wasTruncated: true,
        relevantSectionsFound: Array.from(categoriesFound)
    }
}
