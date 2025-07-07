
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import config from '../../config.json';

export const useMediaUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadFile = async (file: File, bucket: string = 'media'): Promise<string | null> => {
    if (!user) {
      toast({
        title: "UPLOAD FAILED",
        description: ">>> Please sign in to upload files",
        variant: "destructive"
      });
      return null;
    }

    // Validate file size
    const maxSizeMB = config.app.max_file_size_mb;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "FILE TOO LARGE",
        description: `>>> Maximum file size is ${maxSizeMB}MB`,
        variant: "destructive"
      });
      return null;
    }

    // Validate file type
    const allowedTypes = config.app.allowed_file_types;
    const isValidType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'));
      }
      return file.type === type;
    });

    if (!isValidType) {
      toast({
        title: "INVALID FILE TYPE",
        description: ">>> Only images, videos, and audio files are supported",
        variant: "destructive"
      });
      return null;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      toast({
        title: "UPLOAD SUCCESSFUL",
        description: ">>> File uploaded and encrypted",
      });

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "UPLOAD FAILED",
        description: `>>> ${error.message}`,
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (filePath: string, bucket: string = 'media'): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error: any) {
      toast({
        title: "DELETE FAILED",
        description: `>>> ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading
  };
};
