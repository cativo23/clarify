# Analysis Tiers & Strategy

Clarify uses a **multi-tier model strategy** to balance speed, cost, and depth of analysis. We leverage different OpenAI models based on the tier selected by the user.

## 📊 Summary of Tiers

| Tier | Model | Credits | Focus | Primary Use Case |
| :--- | :--- | :---: | :--- | :--- |
| **Basic** | `gpt-4o-mini` | 1 | Critical Risks | Simple leases, TOS, Privacy Policies |
| **Premium** | `gpt-5-mini` | 3 | Full Reasoning | **Recommended.** deep audit of business contracts |
| **Forensic**| `gpt-5` | 10 | Extreme Precision | High-value audits, complex legal frameworks |

---

## 🛠️ Technical Configuration

The configuration is managed in `server/utils/config.ts` and can be overridden via the `configurations` table in the database.

### Token Limits & Budget

| Tier | Input Limit | Output Limit | Model |
| :--- | :---: | :---: | :--- |
| **Basic** | 8,000 | 2,500 | `gpt-4o-mini` |
| **Premium** | 35,000 | 10,000 | `gpt-5-mini` |
| **Forensic** | 120,000 | 30,000 | `gpt-5` |

### Hybrid Strategy Logic

1.  **GPT-4o-mini (Basic)**: Optimized for extreme cost efficiency (< $0.002/analysis). It identifies "Red Flag" risks only.
2.  **GPT-5-mini (Premium)**: Uses O-series reasoning capability to identify 95%+ of risks while maintaining a moderate token cost.
3.  **GPT-5 (Forensic)**: The flagship model for documents up to 300+ pages. Used when absolute rigor and exhaustive checking are required for high-stakes agreements.

---

## 🚀 Optimization Techniques

### 1. Semantic Preprocessing
We use `js-tiktoken` (cl100k_base) and intelligent semantic chunking to ensure the most legally significant sections (Liability, Termination, Indemnification) are prioritized within the token window.

### 2. Prompt Versioning (v2)
The system uses "Prompt v2", which enforces:
- **Strict JSON Output**: Ensured via system instructions and schema validation.
- **Conciseness on Low Risk**: The model is instructed to be terse for "Green" (Safe) clauses to save output tokens.
- **Reasoning Budget**: For Premium/Forensic, the model "thinks" through the legal implications before generating the risk assessment.

### 3. Cache Efficiency
We use highly structured prompts with static prefixes to maximize OpenAI's prompt caching, achieving up to 55-70% cache hit rates on repetitive structural elements.

---

## 🛡️ Admin Controls
Admins can monitor real-time token usage and estimated costs via the **Admin Analytics Dashboard**.
- **Debug Mode**: Setting `features.tokenDebug = true` enables detailed token logs in the server console.
- **Dynamic Pricing**: The system estimates cost by crossing token usage with the `pricing_tables` database table.
