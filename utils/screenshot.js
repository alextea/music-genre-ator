const fetch = require('node-fetch')
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

  try {
    const response = await fetch(config.screenshotUrl, settings)
    const data = await response.text();
    return data
  } catch (e) {
    return e
  }
}

module.exports.getScreenShot = getScreenShot
