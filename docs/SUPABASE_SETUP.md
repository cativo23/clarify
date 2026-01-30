# Supabase Setup Instructions

This guide will help you set up Supabase for the Clarify project.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in the details:
   - **Name**: Clarify
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
4. Click "Create new project"

## 2. Get Your API Keys

1. Once the project is created, go to **Settings** → **API**
2. Copy the following values to your `.env` file:
   ```env
   SUPABASE_URL=<your-project-url>
   SUPABASE_ANON_KEY=<your-anon-public-key>
   SUPABASE_SERVICE_KEY=<your-service-role-key>
   ```

## 3. Run Database Migrations

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy and paste the contents of `database/init.sql`
4. Click "Run" to execute the SQL

This will create:
- `users` table
- `analyses` table
- `transactions` table
- Indexes and triggers

## 4. Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click "New bucket"
3. Name it: `contracts`
4. Set it to **Public** (so users can access their PDFs)
5. Click "Create bucket"

### Set Storage Policies

1. Click on the `contracts` bucket
2. Go to "Policies"
3. Add the following policies:

**Upload Policy:**
```sql
CREATE POLICY "Users can upload their own contracts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contracts' AND (storage.foldername(name))[1] = auth.uid()::text);
```

**Select Policy:**
```sql
CREATE POLICY "Users can view their own contracts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'contracts' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## 5. Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (already enabled by default)
3. (Optional) Enable **Google** provider:
   - Click on Google
   - Follow instructions to set up Google OAuth
   - Add your Client ID and Client Secret

## 6. Set Up Row Level Security (RLS)

The SQL script already includes RLS policies, but verify in **Database** → **Tables**:

### users table policies:
- Users can view their own profile
- Users can update their own profile

### analyses table policies:
- Users can view their own analyses
- Users can create analyses
- Service role can manage all analyses

### transactions table policies:
- Users can view their own transactions
- Service role can manage all transactions

## 7. Test the Connection

Run your Nuxt app locally:
```bash
npm run dev
```

Try to:
1. Sign up for a new account
2. Check if the user appears in the `users` table
3. Upload a test PDF
4. Check if it appears in the `contracts` bucket

## 8. (Optional) Set Up Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize the email templates for:
   - Confirm signup
   - Magic Link
   - Reset password

## Troubleshooting

### Can't upload files
- Check that the `contracts` bucket exists
- Verify storage policies are correctly set
- Check that bucket is public

### Authentication not working
- Verify API keys in `.env`
- Check that email provider is enabled
- Look at browser console for errors

### Database queries failing
- Verify RLS policies are set
- Check that tables exist
- Look at Supabase logs in the dashboard

## Next Steps

Once Supabase is configured:
1. Update your `.env` file with the correct values
2. Restart your development server
3. Test the full flow: signup → upload → analyze
