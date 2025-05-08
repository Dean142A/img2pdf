"use server";

// Import the specific flow function and its types
import { 
  convertImagesToPdfFlow, 
  type ConvertImagesInput,
} from '@/ai/flows/convertImagesToPdfFlow'; 
import { z } from 'zod'; // z is used for error handling

// The Schemas (ImageInputSchema, PdfOutputSchema, ConvertImagesInputSchema) are now defined in the flow file.
// We use ConvertImagesInput as the type for the 'images' parameter, which is an array of image objects.

export async function generatePdfFromImagesAction(
  images: ConvertImagesInput 
): Promise<{ success: boolean; pdfDataUrl?: string; fileName?: string; error?: string }> {
  try {
    // Input validation (parsing with the schema) will be handled by the Genkit flow itself
    // when `convertImagesToPdfFlow` is called, as its definition includes `inputSchema`.
    // If `images` doesn't conform, the flow will throw a ZodError.

    const result = await convertImagesToPdfFlow(images); // Direct call to the flow wrapper
    
    // The 'result' is already validated by the flow's outputSchema if it completes successfully.

    return {
      success: true,
      pdfDataUrl: result.pdfDataUrl,
      fileName: result.fileName,
    };
  } catch (error) {
    console.error("Error in generatePdfFromImagesAction:", error);
    if (error instanceof z.ZodError) {
      // This can catch ZodErrors from the flow's input validation
      return { success: false, error: `Invalid data format: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}` };
    }
    const errorMessage = (typeof error === 'object' && error !== null && 'message' in error) 
                         ? String(error.message) 
                         : "An unknown error occurred during PDF conversion.";
    return { success: false, error: errorMessage };
  }
}

