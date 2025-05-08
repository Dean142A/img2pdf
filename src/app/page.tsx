"use client";

import React, { useState, useEffect } from 'react';
import { ImageUploader } from '@/components/image-uploader';
import { ImageReorderArea } from '@/components/image-reorder-area';
import { Button } from '@/components/ui/button';
import { generatePdfFromImagesAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { FileDown, Loader2, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface ProcessedImage {
  id: string;
  file: File; // Keep original file for potential future use, though action uses dataUrl
  dataUrl: string;
  name: string;
}

export default function ImageToPdfPage() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('converted_document.pdf');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleImagesUploaded = (newImages: ProcessedImage[]) => {
    setImages((prevImages) => [...prevImages, ...newImages]);
    setPdfUrl(null); // Reset PDF if new images are added
    toast({
      title: 'Images Uploaded',
      description: `${newImages.length} image(s) added to the list.`,
    });
  };

  const handleReorder = (reorderedImages: ProcessedImage[]) => {
    setImages(reorderedImages);
    setPdfUrl(null); // Reset PDF if order changes
  };

  const handleRemoveImage = (id: string) => {
    setImages((prevImages) => prevImages.filter((img) => img.id !== id));
    setPdfUrl(null); // Reset PDF if an image is removed
    toast({
      title: 'Image Removed',
      description: 'The image has been removed from the list.',
    });
  };

  const handleConvertToPdf = async () => {
    if (images.length === 0) {
      toast({
        title: 'No Images',
        description: 'Please upload images before converting to PDF.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setPdfUrl(null);

    const imageInputs = images.map(img => ({
      dataUrl: img.dataUrl,
      name: img.name,
      type: img.file.type,
    }));

    try {
      const result = await generatePdfFromImagesAction(imageInputs);
      if (result.success && result.pdfDataUrl) {
        setPdfUrl(result.pdfDataUrl);
        setPdfFileName(result.fileName || 'converted_document.pdf');
        toast({
          title: 'PDF Generated Successfully!',
          description: 'Your PDF is ready for download.',
          variant: 'default', // Default variant often has neutral/positive styling
          className: 'bg-accent text-accent-foreground border-accent', // Use success accent
        });
      } else {
        throw new Error(result.error || 'Unknown error during PDF conversion.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'PDF Conversion Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('PDF Conversion Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) {
    // Render a loading state or null during server-side rendering and initial client-side mount
    // This helps avoid hydration mismatches if any component relies on window or browser APIs immediately
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Image2PDF Magic...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="py-6 px-4 sm:px-8 shadow-sm bg-card">
        <div className="container mx-auto flex items-center gap-2">
          <ImageIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Image2PDF <span className="text-primary">Magic</span></h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-8">
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Upload Your Images</CardTitle>
            <CardDescription>
              Drag and drop or click to upload JPG, PNG, or GIF files. Then, reorder them as you like.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUploader onImagesUploaded={handleImagesUploaded} className="mb-6" />
          </CardContent>
        </Card>

        {images.length > 0 && (
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Arrange Your Images</CardTitle>
              <CardDescription>
                Drag and drop the images to set their order in the PDF. The first image will be the first page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageReorderArea
                images={images}
                onReorder={handleReorder}
                onRemoveImage={handleRemoveImage}
              />
            </CardContent>
          </Card>
        )}
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 my-8">
          <Button
            onClick={handleConvertToPdf}
            disabled={isLoading || images.length === 0}
            size="lg"
            className="w-full sm:w-auto"
            aria-live="polite"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Converting...
              </>
            ) : (
              'Convert to PDF'
            )}
          </Button>

          {pdfUrl && (
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            >
              <a href={pdfUrl} download={pdfFileName}>
                <FileDown className="mr-2 h-5 w-5" />
                Download PDF
              </a>
            </Button>
          )}
        </div>
      </main>

      <footer className="text-center py-6 px-4 sm:px-8 text-sm text-muted-foreground bg-card border-t">
        <p>&copy; {new Date().getFullYear()} Image2PDF Magic. All rights reserved.</p>
        <p className="mt-1">Powered by magic (and code).</p>
      </footer>
    </div>
  );
}
