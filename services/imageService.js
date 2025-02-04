import axios from "axios";
import { useRoute } from '#app';

const resizeImage = async (file, maxSizeMB = 3) => {
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size <= maxBytes) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        const ratio = Math.sqrt(maxBytes / file.size);
        width *= ratio;
        height *= ratio;
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.9);
      };
    };
  });
};

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

    const originalFile = new File([blob], image.name, { type: blob.type });
    
    // Resize the image if needed
    const resizedFile = await resizeImage(originalFile, 3);
    
    const formData = new FormData();
    formData.append("filename", resizedFile.name);
    formData.append("folder", presetName);
    formData.append("contentType", resizedFile.type);
    formData.append("file", resizedFile);

    const uploadResponse = await fetch(`/.netlify/functions/upload?access=${accessToken}`, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.statusText} - ${errorData}`);
    }

    const data = await uploadResponse.json();
    console.log("Upload successful. URL:", data.url);
    
    // Return the image data with the new URL
    return {
      ...image,
      sourceImage: data.url,
    };
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
