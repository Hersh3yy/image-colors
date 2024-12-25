import axios from "axios";
import { useRoute } from '#app';

export const uploadImage = async (image, presetName, accessToken) => {
  console.log("Starting uploadImage:", {
    imageName: image.name,
    sourceImage: image.sourceImage,
    presetName
  });

  try {
    console.log("Fetching image from source...");
    const response = await fetch(image.sourceImage);
    console.log("Fetch response:", {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });

    const blob = await response.blob();
    console.log("Blob created:", {
      size: blob.size,
      type: blob.type
    });

    const file = new File([blob], image.name, { type: blob.type });
    console.log("File created:", {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Create FormData to send the file
    const formData = new FormData();
    formData.append("filename", file.name);
    formData.append("folder", presetName);
    formData.append("contentType", file.type);
    formData.append("file", file); // Append the file directly

    // Upload the file directly to Digital Ocean
    const uploadResponse = await fetch(`/.netlify/functions/upload?access=${accessToken}`, {
      method: 'POST',
      body: formData // Send FormData directly
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.statusText} - ${errorData}`);
    }

    const data = await uploadResponse.json();
    console.log("Upload successful. URL:", data.url);
    
    return data.url;
  } catch (error) {
    console.error("Error in uploadImage:", {
      error,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export const reanalyzeImages = async (processedImages) => {
  const reanalyzedImages = [];

  for (const image of processedImages) {
    try {
      const response = await axios.get(image.sourceImage, {
        responseType: "blob",
      });
      const blob = response.data;
      const file = new File([blob], image.name, { type: blob.type });

      // Analyze the image again
      const formData = new FormData();
      formData.append("image", file);
      const imageColors = await analyzeImage(formData);

      reanalyzedImages.push({
        ...image,
        colors: {
          image_colors: imageColors,
        },
      });
    } catch (error) {
      console.error(`Error reanalyzing image ${image.name}:`, error);
    }
  }

  return reanalyzedImages;
};
