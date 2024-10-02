import axios from "axios";

const COLOR_ANALYZER_API_BASE =
  process.env.COLOR_ANALYZER_API_ENDPOINT ||
  "https://squid-app-5flef.ondigitalocean.app";

export const analyzeImageAPI = async (imageData) => {
  console.log("analyzeImageAPI started");
  console.log("Input imageData:", {
    ...imageData,
    pixels: imageData.pixels.length + " pixels",
  });

  try {
    console.time("apiAnalysis");

    // Convert imageData back to a Blob
    console.time("createBlob");
    const blob = await imageDataToBlob(imageData);
    console.timeEnd("createBlob");
    console.log("Blob created:", blob);

    // Prepare form data to send to the API
    const formData = new FormData();
    formData.append("image", blob);

    console.log(
      "Sending request to API:",
      `${COLOR_ANALYZER_API_BASE}/analyze`
    );
    const response = await axios.post(
      `${COLOR_ANALYZER_API_BASE}/analyze`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.timeEnd("apiAnalysis");

    console.log("API response:", response.data);
    return response.data; // Return the entire response data
  } catch (error) {
    console.error("Error analyzing image with API:", error);
    if (error.response) {
      console.error("API Error Response:", error.response.data);
      console.error("API Error Status:", error.response.status);
      console.error("API Error Headers:", error.response.headers);
    } else if (error.request) {
      console.error("API Error Request:", error.request);
    } else {
      console.error("API Error Message:", error.message);
    }
    throw new Error("Failed to analyze image using API");
  }
};

const imageDataToBlob = async (imageData) => {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  const imgData = ctx.createImageData(imageData.width, imageData.height);
  imageData.pixels.forEach((pixel, i) => {
    imgData.data[i * 4] = pixel[0];
    imgData.data[i * 4 + 1] = pixel[1];
    imgData.data[i * 4 + 2] = pixel[2];
    imgData.data[i * 4 + 3] = 255;
  });
  ctx.putImageData(imgData, 0, 0);
  return new Promise((resolve) => canvas.toBlob(resolve));
};
