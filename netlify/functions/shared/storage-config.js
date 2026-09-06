/**
 * storage-config.js - the one place that knows where objects live.
 *
 * Every function used to carry its own copy of the bucket name, endpoint and
 * S3 client construction (10 copies). They now read these values, which come
 * from the environment with the historical defaults as fallbacks.
 *
 * Env vars (set in the Netlify UI or .env for `netlify dev`):
 *   SPACES_BUCKET       default "bengijzel"
 *   SPACES_ENDPOINT     default "https://ams3.digitaloceanspaces.com"
 *   SPACES_REGION       default "us-east-1" (Spaces ignores it; the SDK requires one)
 *   SPACES_PUBLIC_URL   default "https://<bucket>.<endpoint host>" - base URL of
 *                       public objects (uploaded images are public-read; JSON
 *                       feedback/knowledge/model objects are private)
 *   MY_AWS_ACCESS_KEY_ID / MY_AWS_SECRET_ACCESS_KEY   credentials
 *   URL                 provided by Netlify: the site's canonical URL
 */
const { S3Client } = require("@aws-sdk/client-s3");

const BUCKET = process.env.SPACES_BUCKET || "bengijzel";
const ENDPOINT = process.env.SPACES_ENDPOINT || "https://ams3.digitaloceanspaces.com";
const REGION = process.env.SPACES_REGION || "us-east-1";
const PUBLIC_BASE_URL =
  process.env.SPACES_PUBLIC_URL || `https://${BUCKET}.${new URL(ENDPOINT).host}`;

// Netlify sets URL (production) and DEPLOY_PRIME_URL (branch/preview deploys).
const SITE_URL = process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:8888";

const createS3Client = () =>
  new S3Client({
    endpoint: ENDPOINT,
    region: REGION,
    credentials: {
      accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
    },
  });

module.exports = { BUCKET, ENDPOINT, REGION, PUBLIC_BASE_URL, SITE_URL, createS3Client };
