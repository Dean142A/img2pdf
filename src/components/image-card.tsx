"use client";

import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import type { ProcessedImage } from '@/app/page'; // Import type from page.tsx

interface ImageCardProps {
  image: ProcessedImage;
  onRemove: (id: string) => void;
  isDragging?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void;
  className?: string;
}

export function ImageCard({
  image,
  onRemove,
  isDragging = false,
  onDragStart,
  onDragEnd,
  className,
}: ImageCardProps) {
  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`w-full max-w-xs shadow-md transition-all duration-150 ease-in-out transform hover:shadow-lg ${
        isDragging ? 'opacity-50 scale-95 shadow-xl ring-2 ring-primary' : 'opacity-100 scale-100'
      } ${className}`}
      aria-label={`Image: ${image.name}`}
      aria-grabbed={isDragging}
    >
      <CardHeader className="p-3 relative">
        <CardTitle className="text-sm truncate pr-10" title={image.name}>
          {image.name}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(image.id)}
          className="absolute top-1 right-1 h-7 w-7"
          aria-label={`Remove ${image.name}`}
        >
          <Trash2 className="h-4 w-4 text-destructive/80 hover:text-destructive" />
        </Button>
      </CardHeader>
      <CardContent className="p-0 aspect-square overflow-hidden flex items-center justify-center bg-muted/30">
        <Image
          src={image.dataUrl}
          alt={`Preview of ${image.name}`}
          width={150}
          height={150}
          className="object-contain w-full h-full max-h-[150px] max-w-[150px]"
          data-ai-hint="uploaded image"
          onError={(e) => {
            // In case dataUrl is invalid or image fails to load
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder.svg'; 
            target.alt = 'Placeholder image';
          }}
        />
      </CardContent>
      <CardFooter className="p-2 flex justify-center items-center cursor-grab text-muted-foreground hover:text-foreground transition-colors">
        <GripVertical className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Drag to reorder</span>
      </CardFooter>
    </Card>
  );
}
