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
import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import { Buffer } from 'buffer'; // Node.js Buffer

// Define the input type for an individual image
const ImageInputSchema = z.object({
  dataUrl: z.string().refine(val => val.startsWith('data:image/'), { 
    message: "Image dataUrl must start with 'data:image/'" 
  }),
  name: z.string(),
  type: z.string(), // e.g., 'image/jpeg', 'image/png'
});
export type ImageInput = z.infer<typeof ImageInputSchema>;

// Define the input schema for the flow (array of images)
const ConvertImagesInputSchema = z.array(ImageInputSchema).min(1, { message: "At least one image is required to create a PDF." });
export type ConvertImagesInput = z.infer<typeof ConvertImagesInputSchema>;

// Define the expected output structure from the Genkit flow
const PdfOutputSchema = z.object({
  pdfDataUrl: z.string().refine(val => val.startsWith('data:application/pdf;base64,'), { 
    message: "PDF dataUrl must start with 'data:application/pdf;base64,'" 
  }),
  fileName: z.string(),
});
export type PdfOutput = z.infer<typeof PdfOutputSchema>;

// This is the Genkit flow definition.
const convertImagesToPdfFlowInternal = ai.defineFlow(
  {
    name: 'convertImagesToPdfFlow', 
    inputSchema: ConvertImagesInputSchema,
    outputSchema: PdfOutputSchema,
  },
  async (images) => {
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (const imageInput of images) {
      const page = pdfDoc.addPage(PageSizes.A4);
      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Extract base64 data from data URL
      const base64Data = imageInput.dataUrl.substring(imageInput.dataUrl.indexOf(',') + 1);
      const imageBytes = Buffer.from(base64Data, 'base64');

      let embeddedImage;
      try {
        if (imageInput.type === 'image/jpeg' || imageInput.type === 'image/jpg') {
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        } else if (imageInput.type === 'image/png') {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else {
          console.warn(`Unsupported image type: ${imageInput.type} for image ${imageInput.name}. Skipping and adding placeholder text.`);
          page.drawText(`Unsupported image: ${imageInput.name} (type: ${imageInput.type})`, {
            x: 50,
            y: pageHeight - 50, // Position from top
            size: 12,
            font: helveticaFont,
            color: rgb(0.9, 0.1, 0.1), // Red color for warning
          });
          continue; // Skip to the next image
        }

        const imageDims = embeddedImage.scale(1); // Get original dimensions

        // Calculate scaling factor to fit image on page while maintaining aspect ratio
        // Define margins (e.g., 50 points on each side)
        const margin = 50;
        const maxImgWidth = pageWidth - 2 * margin;
        const maxImgHeight = pageHeight - 2 * margin;

        let newWidth = imageDims.width;
        let newHeight = imageDims.height;

        // Scale width if it exceeds max width
        if (newWidth > maxImgWidth) {
          const scale = maxImgWidth / newWidth;
          newWidth = maxImgWidth;
          newHeight = newHeight * scale;
        }

        // Scale height if it exceeds max height (after potential width scaling)
        if (newHeight > maxImgHeight) {
          const scale = maxImgHeight / newHeight;
          newHeight = maxImgHeight;
          newWidth = newWidth * scale; // Adjust width again if height scaling was dominant
        }
        
        // Center the image on the page
        const x = (pageWidth - newWidth) / 2;
        const y = (pageHeight - newHeight) / 2;

        page.drawImage(embeddedImage, {
          x: x,
          y: y,
          width: newWidth,
          height: newHeight,
        });

      } catch (embedError) {
        console.error(`Error embedding image ${imageInput.name} (type: ${imageInput.type}):`, embedError);
        page.drawText(`Error embedding image: ${imageInput.name}. It may be corrupted or an unsupported subtype.`, {
            x: 50,
            y: pageHeight - 70, // Slightly lower to avoid overlap with potential unsupported message
            size: 10,
            font: helveticaFont,
            color: rgb(0.9, 0.1, 0.1),
        });
      }
    }

    const pdfBytes = await pdfDoc.save(); // Returns Uint8Array
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    const fileName = `converted-images-${Date.now()}.pdf`;

    return {
      pdfDataUrl: `data:application/pdf;base64,${pdfBase64}`,
      fileName: fileName,
    };
  }
);

// Exported async wrapper function that clients (e.g., Server Actions) will call
export async function convertImagesToPdfFlow(input: ConvertImagesInput): Promise<PdfOutput> {
  return convertImagesToPdfFlowInternal(input);
}
