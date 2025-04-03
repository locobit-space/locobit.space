import { createClient } from '@supabase/supabase-js';
import { readMultipartFormData } from 'h3';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  
  // Initialize Supabase client
  const supabase = createClient(config.public.supabaseUrl, config.supabaseServiceKey);

  // Read file from request
  const formData = await readMultipartFormData(event);
  if (!formData || !formData.length) {
    throw createError({ statusCode: 400, statusMessage: "No file uploaded" });
  }

  const file = formData[0];
  const filePath = `uploads/${Date.now()}-${file.filename}`;

  // Upload file to Supabase Storage
  const { data, error } = await supabase.storage.from('your-bucket-name').upload(filePath, file.data, {
    contentType: file.type,
  });

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return { url: `${config.public.supabaseUrl}/storage/v1/object/public/your-bucket-name/${filePath}` };
});
