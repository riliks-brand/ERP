/**
 * Makes the "brands" Supabase storage bucket PRIVATE.
 * Run once: npx tsx scripts/make-bucket-private.ts
 */
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  "https://hjkouevzcegqhyydtjtg.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // 1. Check current bucket status
  const { data: bucket, error: getErr } = await admin.storage.getBucket("brands");
  if (getErr) {
    console.error("❌ Could not get bucket:", getErr.message);
    process.exit(1);
  }

  console.log("Current bucket config:", {
    name: bucket.name,
    public: bucket.public,
    fileSizeLimit: bucket.file_size_limit,
    allowedMimeTypes: bucket.allowed_mime_types,
  });

  if (!bucket.public) {
    console.log("✅ Bucket is already PRIVATE. No action needed.");
    process.exit(0);
  }

  // 2. Make it private
  const { error: updateErr } = await admin.storage.updateBucket("brands", {
    public: false,
    fileSizeLimit: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
  });

  if (updateErr) {
    console.error("❌ Could not update bucket:", updateErr.message);
    process.exit(1);
  }

  console.log("✅ Bucket 'brands' is now PRIVATE.");
  console.log("   All files require a signed URL to be accessed.");
  console.log("   Existing logoUrl references (public URLs) will break.");
  console.log("   Users should re-upload their logos via Settings.");
}

main().catch(console.error);
