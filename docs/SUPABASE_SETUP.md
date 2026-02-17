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

## 3. Database Migrations (Recommended)

Clarify uses a Laravel-style migration system to manage database schema changes consistently across environments.

### First-Time Setup
1. Run the initialization script to prepare the migrations table:
   ```bash
   npm run db:init
   ```
2. Copy the SQL printed in your terminal (or from `database/00_INIT_MIGRATIONS_TABLE.sql`).
3. Paste it into the **Supabase SQL Editor** and click **Run**.

### Applying Migrations
Once the migrations table is ready, you can apply all pending migrations:
```bash
npm run db:migrate
```
*Note: Due to Supabase API limitations for complex DDL, you should still copy the content of newly created `.sql` files in `database/migrations/` and execute them in the SQL Editor. The `db:migrate` command records that they have been run to prevent duplicate execution.*

### Migration Commands
- `npm run db:status`: Check which migrations are pending.
- `npm run db:rollback`: Rollback the last batch of migrations (records only).
- `npm run db:seed`: Populate the database with initial/test data.
- `npm run migrate:make <name>`: Create a new timestamped migration file.

---

## 4. Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard.
2. Click "New bucket".
3. Name it: `contracts`
4. Set it to **Public** (so users can access their PDFs).
5. Click "Create bucket".

### Set Storage Policies

1. Click on the `contracts` bucket.
2. Go to "Policies".
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

---

## 5. Configure Authentication

1. Go to **Authentication** → **Providers**.
2. Enable **Email** provider.
3. (Optional) Enable **Google** provider if needed for production.

---

## 6. Set Up Row Level Security (RLS)

The migration files include RLS policies. Verify these in **Database** → **Tables**:

- **users table**: Users can only view/update their own profile.
- **analyses table**: Users can only view their own analyses.
- **transactions table**: Users can only view their own transactions.

---

## 7. Admin Configuration

To grant administrative access to an account:
1. Set the `ADMIN_EMAIL` in your `.env` file.
2. The system uses server-side validation to assign the `is_admin` flag to this specific email.

---

## Troubleshooting

### "Auth session missing!" Error
Ensure your `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correctly set in `.env`.

### Migrations not reflecting in DB
The `db:migrate` command currently **records** the migration as run. You must still execute the SQL content manually in the Supabase Dashboard until a full direct DDL integration is implemented.
