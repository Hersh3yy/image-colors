import axios from "axios";

const COLOR_ANALYZER_API_BASE =
  process.env.COLOR_ANALYZER_API_ENDPOINT || "http://localhost:3001/api";

export const analyzeImageAPI = async (imageData) => {
  try {
    console.time("apiAnalysis");
    const base64Image = await imageDataToBase64(imageData);

    const response = await axios.post(
      `${COLOR_ANALYZER_API_BASE}/analyze`,
      { image: base64Image },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log('RESNSE FROM API ANALYSIS', response)
    console.timeEnd("apiAnalysis");
    return response.data;
  } catch (error) {
    console.error("Error analyzing image with API:", error);
    throw new Error("Failed to analyze image using API");
  }
};

const imageDataToBase64 = async (imageData) => {
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

  return canvas.toDataURL("image/jpeg");
};

export const getClosestColorInfo = async (color) => {
  let url = `${COLOR_ANALYZER_API_BASE}/analyze/closest_color_lab`;
  url += color.r
    ? `?r=${color.r}&g=${color.g}&b=${color.b}`
    : `?hex=${color.html_code.substring(1)}`;
  const response = await axios.get(url);
  return response.data;
};
