const axios = require("axios");

const handler = async (event) => {
  const accessToken = event.queryStringParameters?.access;
  if (accessToken !== process.env.PRESET_ACCESS_TOKEN) {
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
      const { presetId } = event.queryStringParameters;
      const data = JSON.parse(event.body);
      const response = await axios.put(
        `https://hiren-devs-strapi-j5h2f.ondigitalocean.app/api/color-presets/${presetId}`,
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
