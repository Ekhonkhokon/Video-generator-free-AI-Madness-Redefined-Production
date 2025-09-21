import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateVideo = async (
  prompt: string,
  imageBase64: string,
  onProgress: (message: string) => void
): Promise<string> => {
  onProgress("Starting video generation...");

  try {
    // Construct the request object dynamically
    const requestPayload: any = {
      model: 'veo-2.0-generate-001',
      prompt: prompt,
      config: {
        numberOfVideos: 1
      }
    };
    
    // Conditionally add the image property only if imageBase64 is provided
    if (imageBase64) {
      requestPayload.image = {
        imageBytes: imageBase64,
        mimeType: 'image/png',
      };
    }

    let operation = await ai.models.generateVideos(requestPayload);

    onProgress("Video generation process initiated. This may take a few minutes...");

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
      onProgress("Checking video status...");
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    onProgress("Video processing complete.");

    if (operation.error) {
      const errorMessage = `Video generation failed: ${operation.error.message} (Code: ${operation.error.code})`;
      console.error("Video generation operation failed:", operation.error);
      throw new Error(errorMessage);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
      throw new Error("Video generation succeeded, but no download link was found in the response.");
    }
    
    onProgress("Fetching generated video...");

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);

    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);

    onProgress("Video ready!");
    return videoUrl;

  } catch (error) {
    console.error("Error generating video:", error);
    let errorMessage = "An unknown error occurred during video generation.";
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
        // Stringify the object to get more details than "[object Object]"
        errorMessage = JSON.stringify(error);
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    onProgress(`Error: ${errorMessage}`);
    throw new Error(errorMessage);
  }
};