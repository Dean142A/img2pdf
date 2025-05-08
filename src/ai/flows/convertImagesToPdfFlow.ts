'use server';
/**
 * @fileOverview Flow for converting images to a PDF document.
 *
 * - convertImagesToPdfFlow - A function that handles the image to PDF conversion process.
 * - ConvertImagesInput - The input type for the convertImagesToPdfFlow function.
 * - PdfOutput - The return type for the convertImagesToPdfFlow function.
 * - ImageInput - The type for an individual image within the input array.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the input type for an individual image
const ImageInputSchema = z.object({
  dataUrl: z.string().startsWith('data:image/', { message: "Image dataUrl must start with 'data:image/'" }),
  name: z.string(),
  type: z.string(), // e.g., 'image/jpeg', 'image/png'
});
export type ImageInput = z.infer<typeof ImageInputSchema>;

// Define the input schema for the flow (array of images)
const ConvertImagesInputSchema = z.array(ImageInputSchema).min(1, { message: "At least one image is required to create a PDF." });
export type ConvertImagesInput = z.infer<typeof ConvertImagesInputSchema>;

// Define the expected output structure from the Genkit flow
const PdfOutputSchema = z.object({
  pdfDataUrl: z.string().startsWith('data:application/pdf;base64,', { message: "PDF dataUrl must start with 'data:application/pdf;base64,'" }),
  fileName: z.string(),
});
export type PdfOutput = z.infer<typeof PdfOutputSchema>;

// This is the Genkit flow definition.
// It's not exported directly but is called by the exported wrapper function.
const convertImagesToPdfFlowInternal = ai.defineFlow(
  {
    name: 'convertImagesToPdfFlow', // Name for Genkit's registry
    inputSchema: ConvertImagesInputSchema,
    outputSchema: PdfOutputSchema,
  },
  async (images) => {
    // In a real application, this is where you would use a library
    // like pdf-lib or call an external service/tool to generate the PDF from images.
    // For this example, we'll create a very simple mock PDF.
    
    const imageNames = images.map(img => img.name).join(', ');
    const fakePdfContent = `This is a mock PDF document. It would contain the following images: ${imageNames}.`;
    
    // Convert the mock content to a base64 string.
    // In a real scenario, the PDF library would provide the PDF bytes.
    const pdfBase64 = Buffer.from(fakePdfContent, 'utf-8').toString('base64');
    const fileName = `converted-images-${Date.now()}.pdf`;

    // Simulating some processing time, as PDF generation can take a moment.
    await new Promise(resolve => setTimeout(resolve, 300 + images.length * 50)); // Simulate 0.3s + 50ms per image

    return {
      pdfDataUrl: `data:application/pdf;base64,${pdfBase64}`,
      fileName: fileName,
    };
  }
);

// Exported async wrapper function that clients (e.g., Server Actions) will call
export async function convertImagesToPdfFlow(input: ConvertImagesInput): Promise<PdfOutput> {
  // The Genkit flow `convertImagesToPdfFlowInternal` will automatically validate the input
  // against `ConvertImagesInputSchema`. If validation fails, it will throw a ZodError.
  // Similarly, it ensures the output matches `PdfOutputSchema`.
  return convertImagesToPdfFlowInternal(input);
}
