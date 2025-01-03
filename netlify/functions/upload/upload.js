const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const parseFormData = require('./parseFormData');

const s3Client = new S3Client({
  endpoint: "https://ams3.digitaloceanspaces.com",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  },
});

const handler = async (event) => {
  console.log("Starting upload handler with content length:", event.headers['content-length']);

  // Authorization check
  const accessToken = event.queryStringParameters?.access;
  if (accessToken !== process.env.PRESET_ACCESS_TOKEN) {
    return { statusCode: 403, body: "Unauthorized" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    console.log("Parsing form data...");
    const { filename, folder, contentType, file } = await parseFormData(event);
    
    console.log("Form data parsed:", {
      filename: typeof filename === 'object' ? filename.filename : filename,
      folder,
      contentType,
      fileSize: file.length
    });

    const actualFilename = typeof filename === 'object' ? filename.filename : filename;
    const folderPath = folder ? `${folder}/` : "";
    const key = `image-colors/${folderPath}${Date.now()}-${actualFilename}`;
    const actualContentType = contentType || (typeof filename === 'object' ? filename.mimeType : 'application/octet-stream');

    console.log("Uploading to S3:", {
      key,
      contentType: actualContentType,
      fileSize: file.length
    });

    const command = new PutObjectCommand({
      Bucket: "bengijzel",
      Key: key,
      Body: file,
      ContentType: actualContentType,
      ACL: 'public-read'
    });

    const uploadStartTime = Date.now();
    await s3Client.send(command);
    const uploadDuration = Date.now() - uploadStartTime;

    console.log("Upload complete:", {
      duration: uploadDuration,
      fileSize: file.length,
      key
    });
    
    const url = `https://bengijzel.ams3.digitaloceanspaces.com/${key}`;
    
    return {
      statusCode: 200,
      body: JSON.stringify({ url }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  } catch (error) {
    console.error('Upload error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        type: error.name,
        details: error.stack
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }
};

module.exports = { handler };