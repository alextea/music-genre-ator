// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Screenshot configuration from environment variables
const config = {
  screenshotUrl: process.env.SCREENSHOT_URL,
  saveS3Bucket: process.env.SAVE_S3_BUCKET,
  saveS3Region: process.env.SAVE_S3_REGION,
  screenshotW: parseInt(process.env.SCREENSHOT_WIDTH || '1200'),
  screenshotH: parseInt(process.env.SCREENSHOT_HEIGHT || '630'),
  screenshotFormat: process.env.SCREENSHOT_FORMAT || 'png'
};

const getScreenShot = async (url, slug) => {
  const body = {
    type: config.screenshotFormat,
    url: `${url}${slug}`,
    viewport: {
      width: config.screenshotW,
      height: config.screenshotH,
    },
    saveS3Bucket: config.saveS3Bucket,
    saveS3Region: config.saveS3Region,
    saveFilename: `${slug}.${config.screenshotFormat}`
  }

  const settings = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  }

  const response = await fetch(config.screenshotUrl, settings).catch(e => console.error(e));
  if (!response.ok) {
    throw new Error(`HTTP error status: ${response.status}\n` +
      `URL: ${config.screenshotUrl}\n` +
      `Response: ${await response.text()}`);
  } else {
    const data = response.text();
    return data;
  }
}

module.exports.getScreenShot = getScreenShot
