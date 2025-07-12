import { createClient } from "@supabase/supabase-js";
import { readMultipartFormData } from "h3";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // Initialize Supabase client
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  );

  // Read file from request
  const formData = await readMultipartFormData(event);
  if (!formData || !formData.length) {
    throw createError({ statusCode: 400, statusMessage: "No file uploaded" });
  }

  const file = formData[0];

  console.log(file)

  const filePath = `uploads/${Date.now()}-${file.filename}`;

  const bucketName = 'nostr-public'

  // Upload file to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload('test', file.data, {
      contentType: file.type,
    });

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return {
    data,
    url: `${config.public.supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`,
  };
});
