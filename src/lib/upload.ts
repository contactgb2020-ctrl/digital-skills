import { supabase } from './supabase';

export async function uploadFile(
  bucket: string,
  file: File,
  pathPrefix: string,
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop() || '';
  const fileName = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) {
    return { url: null, error: error.message };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return { url: data.publicUrl, error: null };
}

export async function uploadPrivateFile(
  bucket: string,
  file: File,
  pathPrefix: string,
): Promise<{ path: string | null; error: string | null }> {
  const ext = file.name.split('.').pop() || '';
  const fileName = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) {
    return { path: null, error: error.message };
  }

  return { path: fileName, error: null };
}

export async function getPrivateFileUrl(bucket: string, path: string): Promise<string | null> {
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl || null;
}
