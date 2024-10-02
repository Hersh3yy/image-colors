import { kmeans } from "ml-kmeans";
import { rgbToLabColorConvert, euclideanDistanceLab } from "./colorUtils";

export const analyzeImageColorConvert = async (imageData) => {
  console.log("analyzeImageColorConvert started");
  console.log("Input imageData:", {
    ...imageData,
    pixels: imageData.pixels.length + " pixels",
  });

  console.time("kmeans");
  const kmeansResult = kmeans(imageData.pixels, 13);
  console.timeEnd("kmeans");
  console.log("kmeans result:", {
    ...kmeansResult,
    centroids: kmeansResult.centroids.length + " centroids",
  });

  console.time("calculateColorPercentagesColorConvert");
  const analyzedColors = calculateColorPercentagesColorConvert(
    imageData.pixels,
    kmeansResult.clusters,
    kmeansResult.centroids
  );
  console.timeEnd("calculateColorPercentagesColorConvert");
  console.log("analyzedColors result:", analyzedColors);

  return analyzedColors;
};

const calculateColorPercentagesColorConvert = (pixels, labels, centroids) => {
  console.log("calculateColorPercentagesColorConvert started");
  const totalPoints = pixels.length;
  const labelCounts = new Array(centroids.length).fill(0);
  labels.forEach((label) => labelCounts[label]++);
  console.log("Label counts:", labelCounts);

  return centroids.map((centroid, i) => {
    const [r, g, b] = centroid.map(Math.round);
    const colorHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    return {
      color: colorHex,
      percentage: (labelCounts[i] / totalPoints) * 100,
    };
  });
};

// Note: getClosestColorColorConvert function removed as it's not needed for the current implementation
