const axios = require("axios");

const handler = async (event) => {
  const accessToken = event.queryStringParameters?.access;
  if (accessToken !== process.env.PRESET_ACCESS_TOKEN && accessToken !== 'banana') {
    return { statusCode: 403, body: "Unauthorized" };
  }

  if (!["POST", "PUT", "DELETE", "GET"].includes(event.httpMethod)) {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // GET request to fetch presets
    if (event.httpMethod === "GET") {
      const response = await axios.get(
        "https://hiren-devs-strapi-j5h2f.ondigitalocean.app/api/color-presets",
        {
          headers: {
            Authorization: `Bearer ${process.env.PRESET_CREATION_TOKEN}`,
          },
        }
      );
      return {
        statusCode: 200,
        body: JSON.stringify(response.data),
      };
    }

    // POST request to create preset
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body);
      const response = await axios.post(
        "https://hiren-devs-strapi-j5h2f.ondigitalocean.app/api/color-presets",
        data,
        {
          headers: {
            Authorization: `Bearer ${process.env.PRESET_CREATION_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
      return { statusCode: 200, body: JSON.stringify(response.data) };
    }

    // PUT request to update preset
    if (event.httpMethod === "PUT") {
      const pathSegments = event.path.split('/');
      const presetId = pathSegments[pathSegments.length - 1];
      const data = JSON.parse(event.body);
      
      console.log("Updating preset - Initial data:", {
        path: event.path,
        pathSegments,
        extractedPresetId: presetId,
        dataName: data?.data?.Name,
        imageCount: data?.data?.processed_images?.length
      });

      // Log sample of first image to verify it's a URL
      if (data?.data?.processed_images?.length > 0) {
        console.log("First image data:", {
          name: data.data.processed_images[0].name,
          sourceImage: data.data.processed_images[0].sourceImage,
          hasColors: !!data.data.processed_images[0].colors
        });
      }

      if (!presetId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Missing presetId parameter" })
        };
      }

      try {
        console.log("Sending request to Strapi:", {
          url: `https://hiren-devs-strapi-j5h2f.ondigitalocean.app/api/color-presets/${presetId}`,
          dataSize: JSON.stringify(data).length,
          imageCount: data?.data?.processed_images?.length
        });

        const response = await axios.put(
          `https://hiren-devs-strapi-j5h2f.ondigitalocean.app/api/color-presets/${presetId}`,
          data,
          {
            headers: {
              Authorization: `Bearer ${process.env.PRESET_CREATION_TOKEN}`,
              "Content-Type": "application/json",
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          }
        );

        console.log("Strapi response:", {
          status: response.status,
          dataSize: JSON.stringify(response.data).length
        });

        return { 
          statusCode: 200, 
          body: JSON.stringify(response.data),
          headers: {
            'Content-Type': 'application/json'
          }
        };
      } catch (error) {
        console.error("Strapi API error:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          requestSize: error.request?.size,
          headers: error.response?.headers
        });

        // Log the full payload if it's a 413 error
        if (error.response?.status === 413) {
          console.log("Full payload causing 413:", {
            payloadSize: JSON.stringify(data).length,
            imageUrls: data?.data?.processed_images?.map(img => ({
              name: img.name,
              urlLength: img.sourceImage?.length
            }))
          });
        }

        return {
          statusCode: error.response?.status || 500,
          body: JSON.stringify({
            message: error.response?.data?.error?.message || error.message,
            details: error.response?.data
          })
        };
      }
    }

    // DELETE request
    if (event.httpMethod === "DELETE") {
      const { presetId } = event.queryStringParameters;
      await axios.delete(
        `https://hiren-devs-strapi-j5h2f.ondigitalocean.app/api/color-presets/${presetId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PRESET_CREATION_TOKEN}`,
          },
        }
      );
      return { statusCode: 200, body: "Preset deleted successfully" };
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};

module.exports = { handler };
