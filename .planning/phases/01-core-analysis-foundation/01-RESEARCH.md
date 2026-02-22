# Phase 1: Core Analysis Foundation - Research

**Researched:** 2026-02-22
**Domain:** AI-powered contract analysis pipeline (3-tier: Basic/Premium/Forensic)
**Confidence:** HIGH

## Summary

This research covers the implementation requirements for Phase 1: completing the 3-tier analysis backend with Forensic tier support. The codebase already has substantial infrastructure in place (BullMQ queue, file validation, tier configuration system), but requires a dedicated Forensic prompt and gpt-5 model configuration.

**Primary recommendation:** Create Forensic prompt in `/server/prompts/v2/forensic-analysis-prompt.txt` with 100% coverage requirements, update the migration to include 'forensic' in the analysis_type CHECK constraint, and verify the worker processes all three tiers correctly.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Coverage:** 100% clause coverage required (vs Premium's 95%)
- **Detection:** Everything extra — omissions, inconsistencies, cross-clause analysis must be included
- **Output detail:** Claude's discretion — optimize for value vs token cost (target 15k-40k tokens)
- **Long contracts:** Claude's discretion — use optimal chunking strategy when exceeding context window
- **Use case:** Both high-value contracts ($10k+, multi-year, IP-critical) AND power users who want maximum detail

### Claude's Discretion
- Exact progress indicator design during async processing
- Specific chunking algorithm for long contracts
- Token limit optimization per model
- Cost optimization strategies for Forensic tier
- Error state handling during queue processing
- Notification delivery mechanism (in-app vs email)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TIER-01 | Forensic Tier Backend — gpt-5 model configured and working | Config already supports gpt-5 in DEFAULT_CONFIG; needs prompt file |
| TIER-03 | 3-tier analysis strategy with clear credit costs (1/3/10 credits) | analyze.post.ts already validates 'forensic' enum; credit cost logic needs update |
| UPLOAD-01 | Secure file upload with magic byte validation | Already implemented in `/server/utils/file-validation.ts` |
| QUEUE-01 | BullMQ/Upstash queue for async processing of long-running analyses | Worker plugin exists; needs forensic tier handling verification |
| PROMPT-01 | Forensic Analysis Prompt — Dedicated prompt for exhaustive 100% coverage analysis | **NEEDS CREATION** - see Architecture Patterns section |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| BullMQ | ^5.70.0 | Job queue for async analysis | Industry standard for Node.js queues, supports Redis/Upstash |
| OpenAI SDK | ^6.22.0 | AI model inference | Official SDK, supports gpt-5, gpt-5-mini, gpt-4o-mini |
| ioredis | ^5.9.3 | Redis client | High-performance Redis client, BullMQ dependency |
| Nuxt 3 | ^4.3.1 | Full-stack framework | Vue 3, server routes, TypeScript everywhere |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| js-tiktoken | ^1.0.21 | Token counting | Pre-analysis token estimation |
| pdf-parse | ^2.4.5 | PDF text extraction | Extract text from uploaded contracts |
| zod | ^4 | Schema validation | Request validation in API endpoints |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| BullMQ | Sidekiq/Celery | Would require Ruby/Python stack |
| pdf-parse | pdfjs-dist | pdf-parse is lighter, server-friendly |
| ioredis | node-redis | ioredis has better TypeScript support |

**Installation:**
```bash
# Already installed - no additional packages needed for Phase 1
```

## Architecture Patterns

### Recommended Project Structure
```
server/
├── api/
│   ├── analyze.post.ts          # Entry point for analysis requests (supports basic/premium/forensic)
│   └── upload.post.ts           # File upload with magic byte validation
├── prompts/
│   └── v2/
│       ├── basic-analysis-prompt.txt     # ~3KB, top-5 critical clauses only
│       ├── analysis-prompt.txt           # ~11KB, 95% coverage (Premium)
│       └── forensic-analysis-prompt.txt  # **NEEDS CREATION** - 100% coverage
├── utils/
│   ├── analyzeContract.ts        # OpenAI client with tier handling
│   ├── config.ts                 # Tier configuration loader
│   ├── file-validation.ts        # Magic byte validation
│   ├── queue.ts                  # BullMQ queue setup
│   └── worker.ts                 # Background job processor
└── plugins/
    └── worker.ts                 # Nitro plugin initializing BullMQ worker
```

### Pattern 1: Tier Configuration System
**What:** Dynamic configuration for analysis tiers loaded from database with fallback defaults
**When to use:** For any tier-based feature (model selection, credit costs, token limits)

**Example:**
```typescript
// Source: /server/utils/config.ts
export interface TierInfo {
  model: string;
  credits: number;
  tokenLimits: { input: number; output: number };
}

const DEFAULT_CONFIG: PromptConfig = {
  promptVersion: "v2",
  tiers: {
    basic: {
      model: "gpt-4o-mini",
      credits: 1,
      tokenLimits: { input: 8000, output: 2500 },
    },
    premium: {
      model: "gpt-5-mini",
      credits: 3,
      tokenLimits: { input: 35000, output: 10000 },
    },
    forensic: {
      model: "gpt-5",
      credits: 10,
      tokenLimits: { input: 120000, output: 30000 },
    },
  },
  features: {
    preprocessing: true,
    tokenDebug: false,
  },
};
```

### Pattern 2: Async Analysis Queue
**What:** BullMQ-based job queue for processing long-running analyses in background
**When to use:** All analysis requests (Basic/Premium/Forensic)

**Example:**
```typescript
// Source: /server/plugins/worker.ts
export default defineNitroPlugin((_nitroApp) => {
  const worker = new Worker(
    "analysis-queue",
    async (job) => {
      const { analysisId, userId, storagePath, analysisType } = job.data;

      // 1. Update status to processing
      await supabase.updateAnalysisStatus(analysisId, "processing");

      // 2. Download PDF from storage
      const buffer = await supabase.downloadContractFile(storagePath);

      // 3. Extract text
      const contractText = await extractTextFromPDF(buffer);

      // 4. Analyze with appropriate tier
      const analysisSummary = await analyzeContract(
        contractText,
        analysisType || "premium"
      );

      // 5. Save results
      await supabase.updateAnalysisStatus(analysisId, "completed", {
        summary_json: analysisSummary,
        risk_level: mappedRiskLevel,
      });
    },
    {
      connection: getRedisConnection(),
      concurrency: 2, // Process up to 2 jobs simultaneously
    }
  );
});
```

### Pattern 3: Prompt Loading from Filesystem
**What:** Load AI prompts from `/server/prompts/v2/` directory using `fs` module
**When to use:** All AI analysis requests

**Example:**
```typescript
// Source: /server/utils/openai-client.ts
const promptFile =
  analysisType === "basic"
    ? "basic-analysis-prompt.txt"
    : "analysis-prompt.txt";
const promptPath = path.resolve(
  process.cwd(),
  `server/prompts/${versionToUse}/${promptFile}`,
);

let systemPrompt = "";
try {
  systemPrompt = await fs.readFile(promptPath, "utf-8");
} catch {
  console.error(`CRITICAL: Failed to load prompt from ${promptPath}`);
  throw new Error("System configuration error. Please contact support.");
}
```

### Anti-Patterns to Avoid
- **Hardcoding prompts in TypeScript:** Prompts must live in `/server/prompts/` for iteration without redeployment
- **Skipping magic byte validation:** Never trust file extension alone; always validate with magic bytes
- **Direct service-role key in client:** Never expose Supabase service-role key to frontend
- **Race conditions in credit deduction:** Always use PostgreSQL RPC with `FOR UPDATE` lock

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Job queue for async processing | Custom queue with DB polling | BullMQ | Handles retries, backoff, concurrency, Redis persistence |
| PDF text extraction | Regex parsing PDF binary | pdf-parse library | PDF structure is complex; library handles edge cases |
| Token counting | Manual whitespace splitting | js-tiktoken | OpenAI uses specific tokenization; manual counting is inaccurate |
| File type validation | Extension checking only | Magic byte validation | Attackers can rename .exe to .pdf; magic bytes reveal true type |
| Credit deduction | SELECT then UPDATE | PostgreSQL RPC with FOR UPDATE | Prevents race conditions when user submits multiple requests |

**Key insight:** The codebase already implements these patterns correctly. Phase 1 requires extending existing patterns, not building new infrastructure.

## Common Pitfalls

### Pitfall 1: Forensic Prompt Not Loading
**What goes wrong:** `analyzeContract` function uses hardcoded prompt file mapping that doesn't include 'forensic'
**Why it happens:** Current code only checks for 'basic' vs non-basic (defaults to premium prompt)
**How to avoid:** Update the prompt file resolution logic to handle all three tiers:
```typescript
const promptFile =
  analysisType === "basic"
    ? "basic-analysis-prompt.txt"
    : analysisType === "forensic"
    ? "forensic-analysis-prompt.txt"
    : "analysis-prompt.txt";
```
**Warning signs:** Forensic analysis returns Premium results; no error thrown

### Pitfall 2: Database CHECK Constraint Failure
**What goes wrong:** INSERT fails with "violates check constraint" for analysis_type
**Why it happens:** Migration `20260216000006_add_analysis_types.sql` only allows 'basic' or 'premium'
**How to avoid:** Create new migration to update CHECK constraint:
```sql
ALTER TABLE analyses
ALTER COLUMN analysis_type TYPE TEXT; -- Drop old constraint

ALTER TABLE analyses
ADD CONSTRAINT analyses_analysis_type_check
CHECK (analysis_type IN ('basic', 'premium', 'forensic'));
```
**Warning signs:** 500 error on analyze request with forensic tier

### Pitfall 3: Credit Cost Calculation
**What goes wrong:** All tiers deduct 3 credits (Premium default) instead of tier-specific cost
**Why it happens:** Current code has hardcoded `creditCost = analysis_type === "premium" ? 3 : 1`
**How to avoid:** Update to use configuration-driven credit cost:
```typescript
// Current (WRONG):
const creditCost = analysis_type === "premium" ? 3 : 1;

// Fixed:
const config = await getPromptConfig();
const creditCost = config.tiers[analysis_type]?.credits || 3;
```
**Warning signs:** Forensic analysis deducts 3 credits instead of 10

### Pitfall 4: Token Limit Exceeded for Forensic Tier
**What goes wrong:** Long contracts get truncated before reaching gpt-5's full context window
**Why it happens:** Preprocessing reserves 2k tokens buffer; may need adjustment for Forensic
**How to avoid:** Adjust buffer based on tier:
```typescript
const buffer = analysisType === "forensic" ? 5000 : 2000;
const availableContext = limits.input - buffer;
```
**Warning signs:** Forensic analysis doesn't utilize full 120k context window

### Pitfall 5: Worker Concurrency for Forensic Jobs
**What goes wrong:** Multiple Forensic jobs run simultaneously, exhausting API rate limits
**Why it happens:** Worker has `concurrency: 2` regardless of tier
**How to avoid:** Consider tier-aware concurrency or priority queues:
```typescript
// Option: Priority queue (Forensic gets dedicated slot)
await queue.add("analyze-contract", jobData, {
  priority: analysisType === "forensic" ? 1 : 10,
});
```
**Warning signs:** Frequent rate limit errors during peak usage

## Code Examples

### Example 1: Forensic Prompt Structure
```
# PROMPT FORENSIC - Análisis Exhaustivo de Contratos (v3.0)

## ⚠️ RESTRICCIÓN LEGAL
[Standard legal disclaimer]

## IDENTIDAD DEL SISTEMA
Eres un Auditor Contractual Forense de Élite con 25 años de experiencia...
**Tu objetivo:** Auditoría exhaustiva (100% del contrato) con precisión máxima...

## DIFERENCIA VS PREMIUM
- Cobertura: 100% (vs 95% Premium)
- Análisis cruzado: Detecta inconsistencias entre cláusulas
- Omisiones: Lista exhaustiva de cláusulas ausentes críticas
- Token budget: 15k-40k output (vs 6k-10k Premium)

## ALGORITMO DE ANÁLISIS CRUZADO
[Special instructions for cross-clause analysis]

## FORMATO DE RESPUESTA (JSON ESTRICTO)
[Extended JSON structure with cross-references]
```

### Example 2: Tier-Specific Model Configuration
```typescript
// Source: /server/utils/openai-client.ts
const ALLOWED_MODELS = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-5-mini",
  "gpt-5",
  "o1-mini",
  "o1",
  "o3-mini",
] as const;

function validateModel(model: string): { valid: boolean; model?: AllowedModel } {
  if (!model || typeof model !== "string") {
    return { valid: false };
  }
  const trimmedModel = model.trim();
  if (ALLOWED_MODELS.includes(trimmedModel as AllowedModel)) {
    return { valid: true, model: trimmedModel as AllowedModel };
  }
  console.error("[SECURITY] Invalid model configured:", model);
  return { valid: false };
}
```

### Example 3: Analysis Request Validation
```typescript
// Source: /server/api/analyze.post.ts
const analyzeRequestSchema = z.object({
  file_url: z.string().url("file_url must be a valid URL"),
  contract_name: z
    .string()
    .min(1, "contract_name cannot be empty")
    .max(255, "contract_name must be less than 255 characters")
    .regex(
      /^[a-zA-Z0-9_\-\s]+$/,
      "contract_name can only contain letters, numbers, hyphens, underscores and spaces",
    ),
  analysis_type: z.enum(["basic", "premium", "forensic"]).default("premium"),
});
```

### Example 4: Database RPC with Tier Support
```sql
-- Source: /database/migrations/20260216000001_fix_credit_deduction_race_condition.sql
CREATE OR REPLACE FUNCTION process_analysis_transaction(
    p_contract_name TEXT,
    p_storage_path TEXT,
    p_analysis_type TEXT DEFAULT 'premium',
    p_credit_cost INTEGER DEFAULT 3,
    p_summary_json JSONB DEFAULT NULL,
    p_risk_level TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_analysis_id UUID;
    v_current_credits INTEGER;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User must be logged in';
    END IF;

    -- Lock user row for atomic operation
    SELECT credits INTO v_current_credits
    FROM users WHERE id = v_user_id FOR UPDATE;

    IF v_current_credits < p_credit_cost THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;

    UPDATE users SET credits = credits - p_credit_cost
    WHERE id = v_user_id;

    INSERT INTO analyses (...) VALUES (...) RETURNING id INTO v_analysis_id;
    RETURN v_analysis_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-tier analysis | 3-tier strategy (Basic/Premium/Forensic) | 2026-02 | Users balance cost vs accuracy |
| Hardcoded prompts | External prompt files in `/server/prompts/` | 2026-02 | Iterate prompts without redeployment |
| Synchronous analysis | Async BullMQ queue | 2026-02 | Support 2-5 minute Forensic analyses |
| Extension-only validation | Magic byte validation | 2026-02 | Prevent malware uploads |
| TOCTOU credit deduction | PostgreSQL RPC with FOR UPDATE | 2026-02 | Prevent race conditions |

**Deprecated/outdated:**
- `analysis_type` with only 'basic'/'premium': Phase 1 adds 'forensic'
- Hardcoded credit costs (1/3): Phase 1 uses config-driven costs

## Open Questions

1. **Forensic prompt differentiation from Premium**
   - What we know: Must achieve 100% coverage vs Premium's 95%
   - What's unclear: Specific prompt instructions that guarantee 100% vs 95%
   - Recommendation: Include explicit "analyze EVERY clause" instruction, add cross-clause consistency checks, require exhaustive omissions list

2. **Token limit handling for massive contracts**
   - What we know: Forensic supports 120k input tokens
   - What's unclear: How to handle contracts exceeding 120k tokens
   - Recommendation: Implement smart chunking with overlap, merge findings; or gracefully degrade with clear user messaging

3. **Forensic-specific error handling**
   - What we know: Forensic jobs take 2-5 minutes vs 30-60 seconds for Premium
   - What's unclear: Should Forensic have different retry/backoff strategy?
   - Recommendation: Keep current retry policy (3 attempts, exponential backoff) but consider tier-aware timeout

4. **Notification mechanism for long-running analyses**
   - What we know: Users can navigate away; analysis continues in background
   - What's unclear: How to notify user when Forensic analysis completes
   - Recommendation: Phase 1 uses Supabase Realtime subscription (already enabled); email notification is out of scope

## Sources

### Primary (HIGH confidence)
- **Codebase files analyzed:**
  - `/server/utils/config.ts` - Tier configuration system
  - `/server/utils/openai-client.ts` - AI model handling
  - `/server/plugins/worker.ts` - BullMQ worker implementation
  - `/server/api/analyze.post.ts` - Analysis request validation
  - `/server/api/upload.post.ts` - File upload with validation
  - `/server/utils/file-validation.ts` - Magic byte validation
  - `/server/prompts/v2/analysis-prompt.txt` - Premium prompt reference
  - `/server/prompts/v2/basic-analysis-prompt.txt` - Basic prompt reference
  - `/database/migrations/20260216000006_add_analysis_types.sql` - Analysis type constraint

### Secondary (MEDIUM confidence)
- **Project documentation:**
  - `/CLAUDE.md` - Project architecture and 3-tier strategy
  - `/.planning/REQUIREMENTS.md` - Phase 1 requirement IDs
  - `/.planning/phases/01-core-analysis-foundation/01-CONTEXT.md` - User decisions
  - `/docs/3_TIER_STRATEGY.md` - Tier configuration documentation

### Tertiary (LOW confidence)
- None — all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified from package.json and codebase
- Architecture: HIGH - Direct analysis of implementation files
- Pitfalls: HIGH - Identified from code inspection and requirement gaps
- Prompt design: MEDIUM - Based on existing Premium/Basic prompts as templates

**Research date:** 2026-02-22
**Valid until:** 2026-05-22 (90 days - stable codebase with infrequent major changes)
