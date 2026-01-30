import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')

export const extractTextFromPDF = async (fileBuffer: Buffer): Promise<string> => {
    try {
        const data = await pdfParse(fileBuffer)
        return data.text
    } catch (error) {
        console.error('Error parsing PDF:', error)
        throw new Error('Failed to extract text from PDF')
    }
}

export const validatePDFFile = (file: File): boolean => {
    const validTypes = ['application/pdf']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!validTypes.includes(file.type)) {
        throw new Error('El archivo debe ser un PDF')
    }

    if (file.size > maxSize) {
        throw new Error('El archivo no debe superar los 10MB')
    }

    return true
}
