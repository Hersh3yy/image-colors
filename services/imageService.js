import axios from "axios";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  endpoint: "https://ams3.digitaloceanspaces.com",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY || "",
  },
});

export const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const thumbnailWidth = 104;
        const thumbnailHeight = thumbnailWidth / aspectRatio;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = thumbnailWidth;
        canvas.height = thumbnailHeight;
        ctx.drawImage(img, 0, 0, thumbnailWidth, thumbnailHeight);

        const resizedImage = canvas.toDataURL("image/jpeg");
        resolve(resizedImage);
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

export const uploadToDigitalOcean = async (file, presetName = "") => {
  const folder = presetName ? `${presetName}/` : "";
  const fileName = `image-colors/${folder}${Date.now()}-${file.name}`;

  const params = {
    Bucket: "bengijzel",
    Key: fileName,
    Body: file,
    ACL: "public-read",
    ContentType: file.type || "image/jpeg",
  };

  console.log("Uploading file:", fileName);
  console.log("Upload parameters:", params);

  try {
    const result = await s3Client.send(new PutObjectCommand(params));
    console.log("Upload successful. Result:", result);
    return `https://bengijzel.ams3.cdn.digitaloceanspaces.com/${fileName}`;
  } catch (err) {
    console.error("Error during upload:", err);
    throw err;
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

      // Convert image to Base64
      const base64Image = await convertToBase64(file);

      // Analyze the image again
      const formData = new FormData();
      formData.append("image", file);
      const imageColors = await analyzeImage(formData);

      reanalyzedImages.push({
        ...image,
        base64Image,
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
