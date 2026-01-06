// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Screenshot configuration from environment variables
const config = {
  screenshotServiceUrl: process.env.SCREENSHOT_SERVICE_URL,
  screenshotServiceApiKey: process.env.SCREENSHOT_SERVICE_API_KEY,
  saveS3Bucket: process.env.SAVE_S3_BUCKET,
  saveS3Region: process.env.SAVE_S3_REGION,
  screenshotW: parseInt(process.env.SCREENSHOT_WIDTH || '1200'),
  screenshotH: parseInt(process.env.SCREENSHOT_HEIGHT || '630'),
  screenshotFormat: process.env.SCREENSHOT_FORMAT || 'png',
  appName: process.env.APP_NAME || 'music-genre-ator'
};

/**
 * Request a screenshot from the Fly.io screenshot service
 * @param {string} url - Base URL to screenshot
 * @param {string} slug - Slug to append to URL and use for S3 key
 * @returns {Promise<Object>} Response with jobId and status
 */
const captureScreenshot = async (url, slug) => {
  const body = {
    url: `${url}${slug}`,
    storage: {
      provider: 's3',
      bucket: config.saveS3Bucket,
      region: config.saveS3Region,
      key: `${config.appName}/${slug}.${config.screenshotFormat}`
    },
    viewport: {
      width: config.screenshotW,
      height: config.screenshotH
    },
    format: config.screenshotFormat,
    options: {
      waitUntil: 'networkidle0',
      timeout: 30000
    },
    metadata: {
      app: config.appName,
      resourceId: slug,
      resourceType: 'genre'
    }
  };

  const settings = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.screenshotServiceApiKey}`
    },
    body: JSON.stringify(body)
  };

  const response = await fetch(`${config.screenshotServiceUrl}/v1/screenshot`, settings);

  if (!response.ok) {
    throw new Error(`HTTP error status: ${response.status}\n` +
      `URL: ${config.screenshotServiceUrl}/v1/screenshot\n` +
      `Response: ${await response.text()}`);
  }

  const data = await response.json();
  return data;
};

module.exports = {
  captureScreenshot,
  config
};
