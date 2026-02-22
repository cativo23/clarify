/**
 * File Validation Utility
 *
 * [SECURITY FIX H2] Validates uploaded files using magic byte signatures
 * to prevent malware hosting and file type bypass attacks.
 *
 * Magic bytes (file signatures) are unique byte sequences at the beginning
 * of files that identify their true format, regardless of extension.
 */

/**
 * Supported file types with their magic byte signatures
 */
interface FileSignature {
  extension: string;
  mimeType: string;
  magicBytes: number[][]; // Array of possible signatures (some formats have multiple)
  maxOffset: number; // How many bytes to check from start
}

/**
 * PDF file signature
 * Magic: %PDF- (25 50 44 46 2D)
 */
const PDF_SIGNATURE: FileSignature = {
  extension: "pdf",
  mimeType: "application/pdf",
  magicBytes: [
    [0x25, 0x50, 0x44, 0x46, 0x2d], // %PDF-
    [0x25, 0x21, 0x50, 0x53, 0x2d], // %!PS- (PostScript, sometimes PDF)
  ],
  maxOffset: 5,
};

/**
 * Allowed file types for contract uploads
 * Only PDF is allowed for this application
 */
const ALLOWED_FILE_TYPES: FileSignature[] = [PDF_SIGNATURE];

/**
 * Result of file validation
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string | undefined;
  detectedType?: string | undefined;
  detectedExtension?: string | undefined;
}

/**
 * Validates a file buffer against its magic byte signature
 *
 * @param fileBuffer - The file content as a Buffer
 * @param fileName - The original file name (for extension check)
 * @returns Validation result with error details if invalid
 */
export function validateFileByMagicBytes(
  fileBuffer: Buffer,
  fileName: string,
): FileValidationResult {
  // 1. Minimum size check (need enough bytes for signature)
  if (fileBuffer.length < 4) {
    return {
      isValid: false,
      error: "File too small to be valid",
    };
  }

  // 2. Get file extension from name
  const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";

  // 3. Check against allowed types
  const allowedType = ALLOWED_FILE_TYPES.find(
    (type) => type.extension === fileExtension,
  );

  if (!allowedType) {
    return {
      isValid: false,
      error: `File type .${fileExtension} is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.map((t) => `.${t.extension}`).join(", ")}`,
    };
  }

  // 4. Check magic bytes
  const hasValidSignature = allowedType.magicBytes.some((signature) => {
    if (fileBuffer.length < signature.length) {
      return false;
    }

    for (let i = 0; i < signature.length; i++) {
      if (fileBuffer[i] !== signature[i]) {
        return false;
      }
    }
    return true;
  });

  if (!hasValidSignature) {
    // Try to detect what the file actually is
    const detectedType = detectFileType(fileBuffer);

    return {
      isValid: false,
      error: `File content does not match .${fileExtension} extension. ${detectedType ? `Detected: ${detectedType}` : "Unknown file type"}. This may indicate a malicious file.`,
      detectedType: detectedType || "unknown",
      detectedExtension: detectedType
        ? getFileExtensionFromType(detectedType)
        : undefined,
    };
  }

  // 5. Additional PDF-specific validation
  if (allowedType.extension === "pdf") {
    const pdfValidation = validatePdfStructure(fileBuffer);
    if (!pdfValidation.isValid) {
      return pdfValidation;
    }
  }

  return {
    isValid: true,
    detectedType: allowedType.mimeType,
    detectedExtension: allowedType.extension,
  };
}

/**
 * Additional PDF structure validation
 * Checks for basic PDF structure elements
 */
function validatePdfStructure(buffer: Buffer): FileValidationResult {
  const content = buffer.toString("binary");

  // Check for PDF header anywhere in first 1024 bytes
  // (Some PDFs have binary data before the header)
  const headerEnd = Math.min(1024, buffer.length);
  const headerSection = content.substring(0, headerEnd);

  if (!headerSection.includes("%PDF")) {
    return {
      isValid: false,
      error: "Invalid PDF structure: Missing PDF header",
    };
  }

  // Check for basic PDF structure (simplified check)
  // Real PDFs should have these elements somewhere
  const hasEndObj = content.includes("endobj");
  const hasXref = content.includes("xref") || content.includes("/Type");

  if (!hasEndObj || !hasXref) {
    return {
      isValid: false,
      error: "Invalid PDF structure: Missing required PDF elements",
    };
  }

  return { isValid: true };
}

/**
 * Attempts to detect file type from magic bytes
 * Used for error reporting when validation fails
 */
function detectFileType(buffer: Buffer): string | null {
  const signatures: Array<{ name: string; bytes: number[] }> = [
    { name: "PDF", bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] },
    { name: "PNG", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
    { name: "JPEG", bytes: [0xff, 0xd8, 0xff] },
    { name: "GIF", bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
    { name: "ZIP", bytes: [0x50, 0x4b, 0x03, 0x04] },
    { name: "Executable (Windows)", bytes: [0x4d, 0x5a] }, // MZ
    { name: "Executable (Linux)", bytes: [0x7f, 0x45, 0x4c, 0x46] }, // ELF
  ];

  for (const sig of signatures) {
    if (buffer.length < sig.bytes.length) continue;

    let matches = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (buffer[i] !== sig.bytes[i]) {
        matches = false;
        break;
      }
    }

    if (matches) {
      return sig.name;
    }
  }

  return null;
}

/**
 * Helper to get extension from detected type name
 */
function getFileExtensionFromType(typeName: string): string {
  const mapping: Record<string, string> = {
    PDF: "pdf",
    PNG: "png",
    JPEG: "jpg",
    GIF: "gif",
    ZIP: "zip",
    "Executable (Windows)": "exe",
    "Executable (Linux)": "elf",
  };
  return mapping[typeName] || "unknown";
}

/**
 * Comprehensive file validation for uploads
 * Combines multiple validation checks
 */
export interface ComprehensiveValidationResult {
  isValid: boolean;
  error?: string | undefined;
  file?:
    | {
        size: number;
        extension: string;
        detectedType: string;
        detectedExtension: string;
      }
    | undefined;
}

/**
 * Performs comprehensive file validation
 *
 * @param fileBuffer - The file content as a Buffer
 * @param fileName - The original file name
 * @param options - Validation options
 * @returns Comprehensive validation result
 */
export function validateFileUpload(
  fileBuffer: Buffer,
  fileName: string,
  options?: {
    maxSizeMB?: number;
    allowedExtensions?: string[];
  },
): ComprehensiveValidationResult {
  const maxSizeMB = options?.maxSizeMB || 10;
  const allowedExtensions = options?.allowedExtensions || ["pdf"];

  // 1. Validate file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (fileBuffer.length > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size (${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
    };
  }

  // 2. Validate file extension (basic check)
  const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File extension .${fileExtension} is not allowed. Allowed: ${allowedExtensions.map((e) => `.${e}`).join(", ")}`,
    };
  }

  // 3. Validate magic bytes (security check)
  const magicByteResult = validateFileByMagicBytes(fileBuffer, fileName);
  if (!magicByteResult.isValid) {
    return {
      isValid: false,
      error: magicByteResult.error,
    };
  }

  return {
    isValid: true,
    file: {
      size: fileBuffer.length,
      extension: fileExtension,
      detectedType: magicByteResult.detectedType || "unknown",
      detectedExtension: magicByteResult.detectedExtension || "unknown",
    },
  };
}

/**
 * Log file validation for security auditing
 */
export function logFileValidation(
  fileName: string,
  fileSize: number,
  result: ComprehensiveValidationResult,
  userId?: string,
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId: userId || "anonymous",
    fileName,
    fileSize,
    isValid: result.isValid,
    error: result.error,
    detectedType: result.file?.detectedType,
  };

  if (result.isValid) {
    console.log("[File Validation] Upload validated:", logEntry);
  } else {
    console.warn("[File Validation] Upload rejected:", logEntry);
  }
}
