import axios from "axios";

const MAX_SIZE_MB = 3;

const resizeImage = async (file) => {
  const maxBytes = MAX_SIZE_MB * 1024 * 1024;
  if (file.size <= maxBytes) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.sqrt(maxBytes / file.size);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.9);
      };
    };
  });
};

export const uploadImage = async (image, presetName, accessToken) => {
  console.log("Starting uploadImage:", { imageName: image.name, sourceImage: image.sourceImage, presetName });

  try {
    const response = await fetch(image.sourceImage);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

    const blob = await response.blob();
    const originalFile = new File([blob], image.name, { type: blob.type });
    const resizedFile = await resizeImage(originalFile);

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
    
    return { ...image, sourceImage: data.url };
  } catch (error) {
    console.error("Error in uploadImage:", { error: error.message });
    throw error;
  }
};

export const reanalyzeImages = async (processedImages) => {
  const reanalyzedImages = [];

  for (const image of processedImages) {
    try {
      const { data: blob } = await axios.get(image.sourceImage, { responseType: "blob" });
      const file = new File([blob], image.name, { type: blob.type });

      const formData = new FormData();
      formData.append("image", file);
      const imageColors = await analyzeImage(formData);

      reanalyzedImages.push({ ...image, colors: { image_colors: imageColors } });
    } catch (error) {
      console.error(`Error reanalyzing image ${image.name}:`, error);
    }
  }

  return reanalyzedImages;
};
