const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const parseFormData = require('./parseFormData'); // Import the new parseFormData function

const s3Client = new S3Client({
  endpoint: "https://ams3.digitaloceanspaces.com",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  },
});

const handler = async (event) => {
  console.log("Received request:", {
    httpMethod: event.httpMethod,
    queryStringParameters: event.queryStringParameters,
    headers: event.headers,
  });

  // Log environment variables
  console.log("Environment Variables:", {
    MY_AWS_ACCESS_KEY_ID: process.env.MY_AWS_ACCESS_KEY_ID || "missing",
    MY_AWS_SECRET_ACCESS_KEY: process.env.MY_AWS_SECRET_ACCESS_KEY || "missing",
    PRESET_ACCESS_TOKEN: process.env.PRESET_ACCESS_TOKEN || "missing",
    ACCESS_QUERY_STRING: event.queryStringParameters?.access || "missing"
  });

  // Check authorization
  const accessToken = event.queryStringParameters?.access;
  if (accessToken !== process.env.PRESET_ACCESS_TOKEN) {
    console.warn("Unauthorized access attempt");
    return { statusCode: 403, body: "Unauthorized" };
  }

  if (event.httpMethod !== "POST") {
    console.warn("Method not allowed:", event.httpMethod);
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    console.log("Parsing form data...");
    const { filename, folder, contentType, file } = await parseFormData(event); // Use the new parseFormData function
    console.log("Parsed request body:", {
      filename,
      folder,
      contentType,
      fileLength: file.length
    });

    // Use the raw file data directly
    const buffer = file; // Use the buffer directly from busboy

    const folderPath = folder ? `${folder}/` : "";
    const key = `image-colors/${folderPath}${Date.now()}-${filename}`;

    console.log("Uploading file to S3:", {
      key,
      contentType,
      bufferLength: buffer.length
    });

    const command = new PutObjectCommand({
      Bucket: "bengijzel",
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read'
    });

    await s3Client.send(command);
    
    const url = `https://bengijzel.ams3.digitaloceanspaces.com/${key}`;
    console.log("Upload successful:", url);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ url }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };
  }
};

module.exports = { handler };