---
title: "Stripe Price ID Configuration Gap Closure"
objective: "Replace placeholder Price IDs with actual Stripe Price IDs in the application configuration"
gap_closure: true
wave: 1
autonomous: true
status: pending
created: 2026-03-03
priority: high
---

# 04-05: Stripe Price ID Configuration Gap Closure

## Gap Description

From [04-VERIFICATION.md](./04-VERIFICATION.md):

- **Issue**: Price IDs in `server/utils/stripe-client.ts` (lines 19, 26, 33) contain placeholder values (`price_5credits`, `price_10credits`, `price_25credits`) instead of actual Stripe Price IDs
- **Impact**: Cannot process real payments until actual Stripe Price IDs are configured
- **Root Cause**: Placeholder values were used during development before actual Stripe products were created

## Success Criteria

- [ ] Placeholder Price IDs replaced with actual Stripe Price IDs in `server/utils/stripe-client.ts`
- [ ] Environment variable documentation updated in `.env.example`
- [ ] Documentation updated with instructions for configuring Stripe Price IDs
- [ ] All credit packages (5, 10, 25 credits) have valid corresponding Stripe Price IDs
- [ ] Application successfully connects to Stripe with configured Price IDs

## Tasks

1. **Research Stripe Setup Process**
   - Document how to create Stripe products and obtain Price IDs
   - Verify the expected format of Price IDs

2. **Update Configuration**
   - Replace placeholder Price IDs with actual ones in `server/utils/stripe-client.ts`
   - Add required environment variables to `.env.example`

3. **Update Documentation**
   - Modify `docs/STRIPE_SETUP.md` with instructions for obtaining Price IDs
   - Update any relevant README sections

4. **Testing**
   - Verify the configuration works with Stripe test environment
   - Confirm no breaking changes to existing functionality

## Implementation Notes

- Actual Stripe Price IDs follow the format `price_XXXXXXXXXXXXXXXXXXXXXXXX`
- Need to ensure the credit packages match: 5 credits for $4.99, 10 credits for $8.99, 25 credits for $19.99
- Consider adding environment variables for the Price IDs instead of hardcoding them