# Token Strategy & Management

## Overview
Clarify uses a **Hybrid Model Strategy** to balance extreme intelligence with cost efficiency. We combine the speed/cost of `gpt-4o-mini` for basic scans with the forensic depth of `gpt-5` for premium audits.

## Strategy: Hybrid Architecture

### 1. Basic Analysis (`gpt-4o-mini`)
- **Use Case:** "Express Scan", Simple leases, TOS, Privacy Policies.
- **Focus:** Detecting the top 5 most critical risks (red flags only).
- **Cost Efficiency:** Unbeatable. 
  - Input: $0.15 / 1M
  - Output: $0.60 / 1M
  - **Avg Cost:** < $0.002 per analysis.

### 2. Premium Analysis (`gpt-5`)
- **Use Case:** "Forensic Audit", Commercial contracts, Employment, vendor agreements.
- **Focus:** Deep reasoning, identifying 95% of risks, suggestions, and omisions.
- **Why GPT-5?**
  - **Inputs are 50% cheaper** than GPT-4o ($1.25 vs $2.50).
  - **Reasoning Capabilities:** GPT-5 "thinks" before answering, drastically reducing legal hallucinations.
  - **Cache Efficiency:** We leverage highly structured prompts to maximize caching (55%+ cache hit rate observed).
  - **Higher Output Cost:** We control this via strict prompt engineering to avoid verbosity in low-risk sections.

## Configuration (v2)
Located in `server/utils/config.ts`.

### Token Limits
| Tier | Model | Input Limit | Output Limit | Budget Est. |
|------|-------|-------------|--------------|-------------|
| **Basic** | `gpt-4o-mini` | 8,000 | 2,500 | $0.002 |
| **Premium** | `gpt-5` | 35,000 | 10,000 | $0.10 - $0.15 |

> **Note**: For Premium, typical usage is ~30k input / ~8k output. The 10k output limit is a "safety cap" to prevent runaway costs ($0.10 max output).

## Processing & Optimization

### 1. Preprocessing (`server/utils/preprocessing.ts`)
We use intelligent semantic chunking:
- **Tokenization**: `js-tiktoken` (cl100k_base).
- **Prioritization**: We prioritize sections containing "Liability", "Termination", "Indemnification", "Payment".
- **Goal**: Fit the most legally significant text into the 35k input window.

### 2. Prompt Engineering
- **GPT-5 Optimization**: The prompt explicitly forbids verbosity on "Green/Low Risk" clauses to save expensive output tokens. We focus the "Reasoning Budget" on high-risk (Red) findings.
- **Structure**: Strict JSON enforcement.

### 3. Error Handling
- **Output Limit Handling**: If GPT-5 hits the 10k token limit, the JSON might be incomplete. The prompt instructs the model to prioritize closing the JSON structure over listing minor findings if it senses the limit approaching.
- **Fallback**: If GPT-5 API fails (rare), we can fallback to `gpt-4o` if configured in DB, but defaults are hardcoded to `gpt-5`.

## Admin Configurations
Admins can adjust limits strictly via defaults in `server/utils/config.ts` or remotely if the `PromptConfig` table is used in Supabase.
**Debug Mode**: Set `features.tokenDebug = true` to see exact token usage in server logs.
