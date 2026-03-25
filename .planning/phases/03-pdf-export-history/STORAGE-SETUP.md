# Supabase Storage Setup for PDF Export

## Bucket Configuration

### Step 1: Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Configure bucket:
   - **Bucket name**: `analysis-pdfs`
   - **Public**: false (private, signed URLs only)
   - **File size limit**: `10485760` (10MB - more than enough for PDFs)
   - **Allowed MIME types**: (leave empty or add `application/pdf`)

### Step 2: Configure RLS Policies

The bucket needs Row Level Security policies to ensure users can only access their own PDFs.

**Policy: Users can read/write their own PDFs**

```sql
-- Allow authenticated users to upload their own PDFs
CREATE POLICY "Users can upload own PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'analysis-pdfs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to read their own PDFs
CREATE POLICY "Users can read own PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'analysis-pdfs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own PDFs
CREATE POLICY "Users can delete own PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'analysis-pdfs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 3: Verify Setup

Test the bucket configuration:

1. **Test upload**: Call `/api/analyses/[id]/export-pdf` for a completed analysis
2. **Check Storage**: Verify PDF appears in `analysis-pdfs/[user_id]/[analysis_id].pdf`
3. **Test download**: Click "Descargar Reporte (PDF)" button
4. **Test caching**: Download same PDF again - should be faster (cached)

### Storage Path Convention

- **Bucket**: `analysis-pdfs`
- **Path structure**: `[user_id]/[analysis_id].pdf`
- **Example**: `abc123-user-id/def456-analysis-id.pdf`

### Signed URL Configuration

- **Expiry**: 24 hours (86400 seconds)
- **Transform**: origin format (no conversion)
- **Cache control**: 1 year (31536000 seconds)

### Security Considerations

1. **RLS Enforcement**: Policies ensure users can only access PDFs in their own folder
2. **Ownership Verification**: API endpoint verifies `user_id` matches analysis owner
3. **Signed URLs**: 24h expiry prevents permanent URL sharing
4. **Private Bucket**: No public access - all downloads require signed URLs

### Troubleshooting

**Error: "Storage configuration missing"**
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`

**Error: "Failed to store PDF"**
- Verify bucket `analysis-pdfs` exists
- Check RLS policies are correctly configured
- Ensure service role key has storage permissions

**PDF not caching (regenerates every time)**
- Check bucket for existing PDF at `[user_id]/[analysis_id].pdf`
- Verify RLS SELECT policy allows reading
