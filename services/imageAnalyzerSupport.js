const MAX_IMAGE_SIZE = 800; // Maximum width or height for analysis

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

export const getClosestParentColor = (color, parentColors, algorithm) => {
  console.log(`Getting closest parent color for ${color} using ${algorithm}`);
  // Dummy implementation - just return the first parent color
  return parentColors[0].name;
};
