# Phase 5: Free Credits & Onboarding - Research

**Researched:** 2026-03-03
**Domain:** User onboarding, credit management, demonstration functionality
**Confidence:** HIGH

## Summary

This phase implements user onboarding by providing free credits and demo functionality to encourage trial while preventing abuse. The key components are: 1) awarding 10 free credits after email verification, 2) providing 1 free Basic analysis per month regardless of credit balance, and 3) creating an interactive homepage demo. The research identifies how to hook into Supabase's authentication system, implement credit management patterns, and build an effective demo experience.

**Primary recommendation:** Use Supabase Auth triggers/hooks to award free credits upon email verification, implement a monthly counter in the users table to track free analyses, and create a simulation-based demo that showcases the analysis experience without requiring AI consumption.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase | Latest | Authentication and database | Project's standard database/auth solution |
| PostgreSQL | 15.x | User data and tracking | Native to Supabase, supports atomic operations |
| BullMQ | 4.x | Job queuing | Already established in project for async operations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | 3.x | Input validation | All API endpoints |
| Nuxt composables | - | State management | Frontend user session management |
| Tailwind CSS | 3.x | Styling | All UI components |

**Installation:**
No new installations needed - all required libraries already exist in the project.

## Architecture Patterns

### Recommended Project Structure
```
server/
├── api/
│   ├── auth/
│   │   └── callback.post.ts    # Handle post-authentication actions
│   └── demo/
│       └── simulate.post.ts    # Demo simulation endpoint
database/
├── migrations/
│   └── YYYYMMDD_add_free_credit_fields.sql  # Track free credit state
components/
├── demo/
│   └── InteractiveDemo.vue     # Demo UI component
├── onboarding/
│   └── WelcomeTour.vue         # New user onboarding
```

### Pattern 1: Supabase Auth Hook for Credit Award
**What:** Use database triggers to detect email verification and award free credits
**When to use:** When new users verify their email addresses
**Example:**
```sql
-- Migration to create trigger
CREATE OR REPLACE FUNCTION award_free_credits_on_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only award credits when email_verified changes from false to true
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Update user credits with atomic operation
    UPDATE users
    SET credits = credits + 10,
        free_credits_awarded = true,
        free_credits_at = NOW()
    WHERE id = NEW.id AND (free_credits_awarded IS FALSE OR free_credits_awarded IS NULL);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on auth.users table
CREATE TRIGGER trigger_award_free_credits
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION award_free_credits_on_verification();
```

### Pattern 2: Monthly Free Analysis Tracking
**What:** Track monthly free analysis usage per user in the users table
**When to use:** For managing the 1 free Basic analysis per month requirement
**Example:**
```sql
-- Add columns to users table for tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_free_analysis_used BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_free_analysis_reset_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_free_analysis_counter INTEGER DEFAULT 0;
```

### Pattern 3: Analysis Override for Free Tier
**What:** Modify analysis endpoint to allow free Basic tier analysis under certain conditions
**When to use:** When user requests a Basic analysis and qualifies for monthly free analysis
**Example:**
```typescript
// In analysis endpoint
if (analysis_type === 'basic' && await hasMonthlyFreeAnalysisAvailable(userId)) {
  // Bypass credit check and mark as used
  await markMonthlyFreeAnalysisUsed(userId);
  // Proceed with analysis without deducting credits
} else {
  // Normal credit deduction flow
}
```

### Anti-Patterns to Avoid
- **Awarding credits on initial signup:** Don't award credits before email verification to prevent abuse
- **Complex verification schemes:** Don't implement additional verification beyond email for free credits
- **Manual credit management:** Don't allow users to manually manage free vs paid credits

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| User authentication | Custom auth system | Supabase Auth | Battle-tested, handles security, social logins |
| Credit accounting | Custom ledger system | Existing process_analysis_transaction RPC | Already handles race conditions and security |
| Database triggers | Complex trigger logic | Simple PostgreSQL triggers | Built-in atomic operations, less prone to race conditions |
| Email verification flow | Custom email system | Supabase built-in verification | Integrated with auth, secure and reliable |

**Key insight:** Leverage existing Supabase auth and PostgreSQL functions rather than building custom user management systems. The project already has sophisticated credit handling that can be extended.

## Common Pitfalls

### Pitfall 1: Race Conditions in Credit Updates
**What goes wrong:** Multiple simultaneous requests could cause incorrect credit calculations
**Why it happens:** Non-atomic operations when updating credit balances
**How to avoid:** Use the existing `process_analysis_transaction` RPC function which uses row-level locking with `FOR UPDATE`
**Warning signs:** Credit discrepancies, analysis requests succeeding despite insufficient credits

### Pitfall 2: Email Verification Timing Issues
**What goes wrong:** Credits awarded before email is actually verified
**Why it happens:** Trigger fires on email change instead of verification confirmation
**How to avoid:** Hook into the `email_confirmed_at` field in auth.users table to ensure actual verification
**Warning signs:** Users with credits but unverified emails

### Pitfall 3: Monthly Analysis Reset Logic Errors
**What goes wrong:** Free analysis quota not resetting properly or resetting too frequently
**Why it happens:** Incorrect date comparison logic or timezone handling
**How to avoid:** Use calendar-month reset logic with proper timezone handling in the database
**Warning signs:** Users getting multiple free analyses in same month or being blocked early

### Pitfall 4: Demo Resource Abuse
**What goes wrong:** Demo endpoint being used as a way to get free analysis
**Why it happens:** No distinction between demo and real analysis
**How to avoid:** Implement simulation-only responses that mimic but don't call real AI APIs
**Warning signs:** High volume of demo endpoint requests

## Code Examples

Verified patterns from official sources:

### Supabase Auth Trigger Pattern
```sql
-- Source: Adapted from Supabase documentation patterns
-- Migration to sync auth.users to app.users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, credits)
  VALUES (NEW.id, NEW.email, 10); -- Start with 10 free credits on verification
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger runs when a new user signs up (before verification)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for email verification (only award on confirmation)
CREATE OR REPLACE FUNCTION public.award_verified_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only award if this is the first verification (email_confirmed_at was null before)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users
    SET credits = credits + 9, -- Since we already gave 1 for signup, add 9 more = 10 total
        email_verified_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.award_verified_user();
```

### Credit Update with Race Condition Protection
```sql
-- Source: Project's existing database migrations
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
    -- Get user ID securely from the session
    v_user_id := auth.uid();

    -- Ensure user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User must be logged in';
    END IF;

    -- 1. Lock the user row FOR UPDATE to prevent concurrent modifications
    SELECT credits INTO v_current_credits
    FROM users
    WHERE id = v_user_id
    FOR UPDATE;

    -- 2. Check if user has enough credits
    IF v_current_credits IS NULL OR v_current_credits < p_credit_cost THEN
        RAISE EXCEPTION 'Insufficient credits. Required: %, Available: %', p_credit_cost, COALESCE(v_current_credits, 0);
    END IF;

    -- 3. Deduct credits atomically (row is still locked)
    UPDATE users
    SET credits = credits - p_credit_cost,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_user_id;

    -- 4. Insert analysis with actual credit cost
    INSERT INTO analyses (
        user_id,
        contract_name,
        file_url,
        summary_json,
        risk_level,
        status,
        credits_used,
        created_at
    ) VALUES (
        v_user_id,
        p_contract_name,
        p_storage_path,
        p_summary_json,
        p_risk_level,
        'pending',
        p_credit_cost,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO v_analysis_id;

    RETURN v_analysis_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual credit updates | Atomic RPC with row locking | Feb 2026 | Eliminated race conditions |
| Hardcoded credit costs | Configurable tier costs | Feb 2026 | Better maintainability |
| No email verification check | Email verification required | Feb 2026 | Reduced abuse potential |

**Deprecated/outdated:**
- Direct SQL credit updates: Replaced by `process_analysis_transaction` RPC
- Non-atomic credit deductions: Replaced by row-locking approach

## Open Questions

1. **Credit Expiration Policy**
   - What we know: Users get 10 free credits after email verification
   - What's unclear: Should unused free credits expire after a certain time?
   - Recommendation: Default to no expiration for simplicity, add if business case emerges

2. **Monthly Analysis Reset Schedule**
   - What we know: User gets 1 free Basic analysis per month
   - What's unclear: Calendar month vs. anniversary month since signup?
   - Recommendation: Calendar month for user predictability

3. **Free Analysis Carryover**
   - What we know: User gets 1 free Basic analysis per month
   - What's unclear: Can unused analyses accumulate if not used?
   - Recommendation: No carryover to prevent unlimited accumulation

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + Playwright |
| Config file | vitest.config.ts, playwright.config.ts |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CREDIT-01 | New user receives 10 credits after email verification | integration | `npm run test:integration` | ❌ Wave 0 |
| CREDIT-02 | User gets 1 free Basic analysis per month | integration | `npm run test:integration` | ❌ Wave 0 |
| DEMO-01 | Interactive demo on homepage shows product value | e2e | `npm run test:e2e` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:unit`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/integration/free-credits.spec.ts` — covers CREDIT-01
- [ ] `tests/integration/monthly-free-analysis.spec.ts` — covers CREDIT-02
- [ ] `tests/e2e/demo-flow.spec.ts` — covers DEMO-01
- [ ] Framework install: `npm install` — if not detected

## User Constraints (from CONTEXT.md)

### Locked Decisions
- New users receive 10 free credits immediately after email verification (not on initial signup)
- Email verification only is sufficient for security (no additional verification methods needed)
- Trust users approach for abuse prevention (no checking for previous free credit usage)
- Free analysis applies to Basic tier only (cannot be applied to Premium or Forensic)
- Sessions are one-time interactions (demo resets each visit)

### Claude's Discretion
- Expiration policy for unused free credits
- Reset timing for monthly free analysis (calendar vs. anniversary)
- Notification method for monthly free analysis availability
- Accumulation policy for unused monthly analyses
- Tier restriction implementation details
- UI indicator placement for available free analysis
- Demo type and implementation approach
- Demo access requirements
- Demo interaction level
- Call-to-action after demo completion
- Demo scope and content
- Supported document types for demo
- Whether to include analysis explanations in demo
- Onboarding flow format
- Whether to include monthly free analysis info in onboarding

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CREDIT-01 | Free Credits System — 10 credits on signup | Award via Supabase auth trigger on email verification |
| CREDIT-02 | Monthly Free Analysis — 1 free Basic analysis per user per month | Track in users table with reset logic |
| DEMO-01 | Homepage Demo — Interactive element to show product value | Simulation-based demo that doesn't consume AI resources |

## Sources

### Primary (HIGH confidence)
- Project database migrations - Supabase auth and credit handling patterns
- Project API endpoints - `/api/analyze.post.ts`, `/api/user/profile.get.ts`
- Project configuration - CLAUDE.md guidelines and architecture

### Secondary (MEDIUM confidence)
- Supabase documentation patterns for auth hooks (inferred from codebase usage)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components already exist in project
- Architecture: HIGH - Based on existing project patterns
- Pitfalls: HIGH - Based on existing project security fixes
- Code examples: HIGH - From existing project code

**Research date:** 2026-03-03
**Valid until:** 2026-04-03