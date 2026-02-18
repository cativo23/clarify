# Email Verification Setup Guide

**Security Issue:** M6 - Missing Email Verification  
**Status:** ⚠️ Requires Supabase Dashboard Configuration  
**Priority:** Low (accepted risk)

---

## 🔧 Required Configuration

### Step 1: Enable Email Confirmations in Supabase

1. **Go to Supabase Dashboard**
   - URL: https://app.supabase.com
   - Select your project

2. **Navigate to Authentication Settings**
   - Click **Authentication** in sidebar
   - Click **Providers** tab
   - Find **Email** provider

3. **Enable Email Confirmations**
   - Toggle **"Enable email confirmations"** to ON
   - Click **Save**

   ![Enable email confirmations toggle](https://supabase.com/images/docs/auth/email-confirmation.png)

### Step 2: Configure Email Templates (Optional)

1. **Go to Email Templates**
   - **Authentication** → **Email Templates**

2. **Customize "Confirm signup" template**
   - Add your app branding
   - Clear call-to-action button
   - Include support contact info

### Step 3: Run Database Migration

Execute the new migration that allows user profile creation:

```bash
npm run db:migrate
```

Or manually run in Supabase SQL Editor:

```sql
-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow service role to manage users
CREATE POLICY "Service role can manage users"
ON public.users
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
```

---

## 🧪 Testing Email Verification

### Test Flow:

1. **Sign up with a new email**
   ```typescript
   const { data, error } = await supabase.auth.signUp({
     email: 'test@example.com',
     password: 'securepassword123'
   })
   ```

2. **Check email for confirmation link**
   - Supabase sends confirmation email
   - User clicks "Confirm Email" button

3. **Verify user can now log in**
   - Before confirmation: Login blocked
   - After confirmation: Login works

### Check User Status:

In Supabase Dashboard → Authentication → Users:
- **Unconfirmed email**: Gray status indicator
- **Confirmed email**: Green status indicator

---

## ⚠️ Important Notes

### Existing Users

If you have existing users before enabling email verification:

1. **They remain confirmed** - No action needed
2. **New signups** will require confirmation
3. **Consider sending** a re-verification email to existing users

### Development vs Production

You may want different settings:

**Development:**
- Disable email confirmations for faster testing
- Or use temporary email services

**Production:**
- ✅ Always enable email confirmations
- Configure custom SMTP for branded emails

### Magic Link vs OTP

Supabase offers two email verification methods:

| Method | Description | Best For |
|--------|-------------|----------|
| **Magic Link** | Single-use login link | Passwordless auth |
| **OTP** | 6-digit code | Traditional auth |

Configure in: **Authentication** → **Email** → **Email Auth Method**

---

## 🔒 Security Benefits

- ✅ Prevents fake accounts with invalid emails
- ✅ Reduces spam and abuse
- ✅ Ensures users can recover accounts
- ✅ Meets compliance requirements (GDPR, etc.)

---

## 📊 M6 Status After Configuration

Once email verification is enabled:

```
M6: Missing Email Verification
Status: ✅ RESOLVED
Location: Supabase Dashboard Configuration
Impact: All new users must verify email before accessing platform
```

---

## 🆘 Troubleshooting

### Issue: "new row violates row-level security policy"

**Solution:** Run the migration to add INSERT policy:
```bash
npm run db:migrate
```

### Issue: Confirmation emails not sending

**Check:**
1. Supabase email quota (free tier: 100/month)
2. Custom SMTP configuration
3. Spam folder

### Issue: Users can still login without confirming

**Check:**
1. Email confirmations enabled in dashboard
2. User signed up BEFORE enabling (grandfathered in)
3. Clear browser cache and test with new email

---

**Related Documentation:**
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Confirmation Guide](https://supabase.com/docs/guides/auth/auth-email)
- [Security Report](./SECURITY_CONSOLIDATED_REPORT.md)
