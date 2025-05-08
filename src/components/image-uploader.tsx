"use client";

import type { ChangeEvent } from 'react';
import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProcessedImage } from '@/app/page'; // Import type from page.tsx

interface ImageUploaderProps {
  onImagesUploaded: (images: ProcessedImage[]) => void;
  className?: string;
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_FILE_SIZE_MB = 5;

export function ImageUploader({ onImagesUploaded, className }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const processFiles = useCallback(async (files: FileList | null): Promise<ProcessedImage[]> => {
    if (!files) return [];
    const processed: ProcessedImage[] = [];

    for (const file of Array.from(files)) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: `File "${file.name}" is not a supported image type (JPG, PNG, GIF).`,
          variant: 'destructive',
        });
        continue;
      }

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
         toast({
          title: 'File Too Large',
          description: `File "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`,
          variant: 'destructive',
        });
        continue;
      }
      
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      processed.push({
        id: crypto.randomUUID(),
        file,
        dataUrl,
        name: file.name,
      });
    }
    return processed;
  }, [toast]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const newImages = await processFiles(event.target.files);
    if (newImages.length > 0) {
      onImagesUploaded(newImages);
    }
    // Reset input value to allow uploading the same file again
    event.target.value = ''; 
  };

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const newImages = await processFiles(event.dataTransfer.files);
     if (newImages.length > 0) {
      onImagesUploaded(newImages);
    }
  }, [processFiles, onImagesUploaded]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // Check if drag leaves to a child element, if so, don't set isDragging to false
    if (event.currentTarget.contains(event.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  };

  return (
    <div
      className={className}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      aria-label="Image upload area"
    >
      <label
        htmlFor="image-upload-input"
        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer
                    bg-secondary/50 hover:bg-secondary/70 transition-colors
                    dark:bg-secondary/30 dark:hover:bg-secondary/50
                    ${isDragging ? 'border-primary ring-2 ring-primary' : 'border-border'}`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadCloud className={`w-10 h-10 mb-3 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className={`mb-2 text-sm ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}>
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">JPG, PNG, GIF (MAX. {MAX_FILE_SIZE_MB}MB each)</p>
        </div>
        <Input
          id="image-upload-input"
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={handleFileChange}
          className="hidden"
          aria-describedby="image-upload-description"
        />
      </label>
      <p id="image-upload-description" className="sr-only">
        Upload one or more images in JPG, PNG, or GIF format. Maximum file size is {MAX_FILE_SIZE_MB} megabytes per file.
      </p>
    </div>
  );
}
