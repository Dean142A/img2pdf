"use client";

import React, { useState, useRef } from 'react';
import { ImageCard } from './image-card';
import type { ProcessedImage } from '@/app/page'; // Import type from page.tsx

interface ImageReorderAreaProps {
  images: ProcessedImage[];
  onReorder: (reorderedImages: ProcessedImage[]) => void;
  onRemoveImage: (id: string) => void;
}

export function ImageReorderArea({ images, onReorder, onRemoveImage }: ImageReorderAreaProps) {
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const dragOverItemId = useRef<string | null>(null);

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    // dataTransfer is not strictly needed if managing state internally, but good for clarity / external drops
    event.dataTransfer.setData('text/plain', id); 
    event.dataTransfer.effectAllowed = "move";
    setDraggingItemId(id);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    event.preventDefault(); // Necessary to allow dropping
    dragOverItemId.current = id;
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // Necessary to allow dropping
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!draggingItemId || !dragOverItemId.current || draggingItemId === dragOverItemId.current) {
      setDraggingItemId(null);
      dragOverItemId.current = null;
      return;
    }

    const draggingIndex = images.findIndex(img => img.id === draggingItemId);
    const dragOverIndex = images.findIndex(img => img.id === dragOverItemId.current);

    if (draggingIndex === -1 || dragOverIndex === -1) return;

    const newImages = [...images];
    const [draggedItem] = newImages.splice(draggingIndex, 1);
    newImages.splice(dragOverIndex, 0, draggedItem);
    
    onReorder(newImages);
    setDraggingItemId(null);
    dragOverItemId.current = null;
  };

  const handleDragEnd = () => {
    setDraggingItemId(null);
    dragOverItemId.current = null;
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <p>No images uploaded yet.</p>
        <p>Upload some images to get started!</p>
      </div>
    );
  }

  return (
    <div 
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4 rounded-lg border border-dashed border-border min-h-[200px]"
      onDragOver={handleDragOver} // Handles drag over the container itself
      onDrop={handleDrop} // Handles drop on the container (e.g., if dropped not directly on an item but within area)
      aria-label="Image reorder area. Drag and drop images to change their order."
      role="list"
    >
      {images.map((image) => (
        <div
          key={image.id}
          onDragEnter={(e) => handleDragEnter(e, image.id)}
          // onDragOver is now on parent for general drop, but could be here for item-specific feedback
          role="listitem"
          aria-roledescription="Draggable image item"
        >
          <ImageCard
            image={image}
            onRemove={onRemoveImage}
            isDragging={draggingItemId === image.id}
            onDragStart={(e) => handleDragStart(e, image.id)}
            onDragEnd={handleDragEnd}
          />
        </div>
      ))}
    </div>
  );
}
