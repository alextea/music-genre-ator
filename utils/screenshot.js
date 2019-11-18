const puppeteer = require('puppeteer')

const getScreenShot = async (url, slug) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url + slug);
  page.setViewport({
    width: 800,
    height: 400
  })

  await page.screenshot({path: './public/images/' + slug + '.png'});
  await browser.close();
}

module.exports.getScreenShot = getScreenShot
