const config = require('../config.json')

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
    throw new Error(`HTTP error status: ${response.status}`);
  } else {
    const data = response.text();
    return data;
  }
}

module.exports.getScreenShot = getScreenShot
