// image analyzer support
const MAX_IMAGE_SIZE = 800;

import { kmeans } from "ml-kmeans";
import chroma from "chroma-js";

export const SAMPLE_SIZE = 80000;
export const CHUNK_SIZE = 100000;
export const COLOR_SPACES = {
  RGB: "rgb",
  LAB: "lab",
  HSL: "hsl",
  LCH: "lch",
};

export const samplePixels = (pixels, sampleSize) => {
  const sampledPixels = [];
  const step = Math.max(1, Math.floor(pixels.length / sampleSize));
  for (let i = 0; i < pixels.length; i += step) {
    sampledPixels.push(pixels[i]);
  }
  return sampledPixels;
};

export const convertPixelsToColorSpace = (pixels, colorSpace) => {
  return pixels.map(pixel => {
    const color = chroma(pixel[0], pixel[1], pixel[2]);
    switch (colorSpace) {
      case COLOR_SPACES.LAB:
        return color.lab();
      case COLOR_SPACES.HSL:
        return color.hsl();
      case COLOR_SPACES.LCH:
        return color.lch();
      default:
        return pixel; // RGB
    }
  });
};

export const convertCentroidToRGB = (centroid, colorSpace) => {
  try {
    switch (colorSpace) {
      case COLOR_SPACES.LAB:
        return chroma.lab(...centroid).rgb();
      case COLOR_SPACES.HSL:
        return chroma.hsl(...centroid).rgb();
      case COLOR_SPACES.LCH:
        return chroma.lch(...centroid).rgb();
      default:
        return centroid;
    }
  } catch (error) {
    console.error('Error converting centroid:', error);
    return centroid;
  }
};

export const performKMeans = (pixels, options = {}) => {
  const {
    k = 14,
    colorSpace = COLOR_SPACES.RGB,
    maxIterations = 30,
    tolerance = 1e-6
  } = options;

  console.time("kmeans");
  
  // Convert pixels to desired color space
  const convertedPixels = convertPixelsToColorSpace(pixels, colorSpace);
  
  const kmeansResult = kmeans(convertedPixels, k, {
    maxIterations,
    tolerance,
    initialization: "kmeans++",
  });

  // Convert centroids back to RGB
  kmeansResult.centroids = kmeansResult.centroids.map(
    centroid => convertCentroidToRGB(centroid, colorSpace)
  );

  console.timeEnd("kmeans");
  console.log("kmeans result:", {
    ...kmeansResult,
    centroids: kmeansResult.centroids.length + " centroids",
    colorSpace
  });
  
  return kmeansResult;
};

export const calculateColorPercentages = async (
  pixels,
  centroids,
  findClosestCentroidIndex
) => {
  console.log("calculateColorPercentages started");
  console.log("Number of pixels:", pixels.length);
  console.log("Number of centroids:", centroids.length);

  const totalPoints = pixels.length;
  const labelCounts = new Array(centroids.length).fill(0);

  for (let i = 0; i < pixels.length; i += CHUNK_SIZE) {
    const chunk = pixels.slice(i, i + CHUNK_SIZE);
    await new Promise((resolve) => {
      setTimeout(() => {
        chunk.forEach((pixel) => {
          const closestCentroidIndex = findClosestCentroidIndex(
            pixel,
            centroids
          );
          labelCounts[closestCentroidIndex]++;
        });
        resolve();
      }, 0);
    });
  }

  console.log("Label counts:", labelCounts);

  const colors = centroids.map((centroid, i) => {
    const [r, g, b] = centroid.map(Math.round);
    const colorHex = chroma(r, g, b).hex().toUpperCase();
    return {
      color: colorHex,
      percentage: (labelCounts[i] / totalPoints) * 100,
    };
  });

  console.log("Analyzed colors:", colors);
  return colors;
};

export const euclideanDistance = (a, b) => {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
  );
};

export const loadImageData = async (imageBlob) => {
  console.log("loadImageData started");
  console.log("Input imageBlob:", imageBlob);

  try {
    console.time("createImageBitmap");
    const image = await createImageBitmap(imageBlob);
    console.timeEnd("createImageBitmap");
    console.log("Created ImageBitmap:", {
      width: image.width,
      height: image.height,
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Resize the image if it's too large
    const { width, height } = calculateAspectRatioFit(
      image.width,
      image.height,
      MAX_IMAGE_SIZE,
      MAX_IMAGE_SIZE
    );
    canvas.width = width;
    canvas.height = height;

    console.log("Resized canvas dimensions:", {
      width: canvas.width,
      height: canvas.height,
    });

    console.time("drawImage");
    ctx.drawImage(image, 0, 0, width, height);
    console.timeEnd("drawImage");

    console.time("getImageData");
    const imageData = ctx.getImageData(0, 0, width, height);
    console.timeEnd("getImageData");
    console.log("Raw imageData dimensions:", {
      width: imageData.width,
      height: imageData.height,
      dataLength: imageData.data.length,
    });

    console.time("processPixels");
    const pixels = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      pixels.push([r, g, b]);
    }
    console.timeEnd("processPixels");
    console.log("Processed pixels array length:", pixels.length);
    console.log("First 5 pixels:", pixels.slice(0, 5));

    const result = { pixels, width, height };
    console.log("loadImageData result:", {
      width: result.width,
      height: result.height,
      pixelCount: result.pixels.length,
    });
    return result;
  } catch (error) {
    console.error("Error in loadImageData:", error);
    throw error;
  }
};

const calculateAspectRatioFit = (srcWidth, srcHeight, maxWidth, maxHeight) => {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return { width: srcWidth * ratio, height: srcHeight * ratio };
};
