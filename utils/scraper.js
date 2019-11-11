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

const scrapeMedium = async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('https://medium.com/search?q=headless%20browser')

  const scrapedData = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll(
        'div.postArticle-content a:first-child[data-action-value]'
      )
    )
      .filter(node => node.querySelector('.graf--title'))
      .map(link => ({
        title: link.querySelector('.graf--title').textContent,
        link: link.getAttribute('data-action-value')
      }))
  )

  await browser.close()
  return scrapedData
}

const scrapeYoutube = async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(
    'https://www.youtube.com/results?search_query=headless+browser'
  )

  const scrapedData = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.ytd-video-renderer #video-title'))
      .map(link => ({
        title: link.getAttribute('title'),
        link: link.getAttribute('href')
      }))
      .slice(0, 10)
  )


  await browser.close()
  return scrapedData
}

module.exports.getScreenShot = getScreenShot
module.exports.scrapeMedium = scrapeMedium
module.exports.scrapeYoutube = scrapeYoutube
