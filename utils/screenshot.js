const puppeteer = require('puppeteer')

const getScreenShot = async (url) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  page.setViewport({
    width: 800,
    height: 400
  })

  await page.screenshot({path: 'screenshot.png'});
  await browser.close();
}

module.exports.getScreenShot = getScreenShot
