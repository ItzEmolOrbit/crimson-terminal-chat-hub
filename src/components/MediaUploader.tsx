
import React, { useRef, useState } from 'react';
import { Upload, Image, Video, Mic, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface MediaUploaderProps {
  onFileSelect: (file: File, type: 'image' | 'video' | 'audio') => void;
  isRecording?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  onFileSelect,
  isRecording,
  onStartRecording,
  onStopRecording
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      toast({
        title: "INVALID FILE TYPE",
        description: ">>> Only images, videos, and audio files are supported",
        variant: "destructive"
      });
      return;
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "FILE TOO LARGE",
        description: ">>> Maximum file size is 10MB",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (file.type.startsWith('image/')) {
        setPreview(result);
        setPreviewType('image');
        onFileSelect(file, 'image');
      } else if (file.type.startsWith('video/')) {
        setPreview(result);
        setPreviewType('video');
        onFileSelect(file, 'video');
      } else if (file.type.startsWith('audio/')) {
        onFileSelect(file, 'audio');
        toast({
          title: "AUDIO FILE SELECTED",
          description: ">>> Audio file ready to send",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const clearPreview = () => {
    setPreview(null);
    setPreviewType(null);
  };

  return (
    <div className="space-y-2">
      {preview && (
        <Card className="p-2 bg-card border-border relative">
          <Button
            onClick={clearPreview}
            className="absolute top-1 right-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 p-1 h-6 w-6"
            size="sm"
          >
            <X className="w-3 h-3" />
          </Button>
          {previewType === 'image' ? (
            <img src={preview} alt="Preview" className="max-h-32 w-auto rounded" />
          ) : (
            <video src={preview} className="max-h-32 w-auto rounded" controls />
          )}
        </Card>
      )}

      <div className="flex space-x-2">
        <div
          className={`flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            dragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground terminal-text">
            Drag & drop or click to upload
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Images, Videos, Audio (max 10MB)
          </p>
        </div>

        <Button
          onClick={isRecording ? onStopRecording : onStartRecording}
          className={`${
            isRecording 
              ? 'bg-destructive recording-pulse text-destructive-foreground hover:bg-destructive/90' 
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          } p-2 h-12 w-12`}
        >
          <Mic className="w-5 h-5" />
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelection(file);
        }}
        className="hidden"
      />
    </div>
  );
};

export default MediaUploader;
