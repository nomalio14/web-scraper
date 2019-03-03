'use strict';
const TARGET_INDEX = 0;
const puppeteer = require('puppeteer')
const fs = require('fs');
const csvSync = require('csv-parse/lib/sync'); // requiring sync module

const file = 'input.csv';
let data = fs.readFileSync(file);

let res = csvSync(data);
let urlArray = res.map(x => x[TARGET_INDEX])

const getInfo = async (browser, url) => {
  let page = await browser.newPage();

  await page.setRequestInterception(true);

  page.on('request', (req) => {
    if (req.resourceType() === 'image') {
      req.abort();
    }
    else {
      req.continue();
    }
  });
  await page.goto(url);
  const title = await page.title()
  const h1s = await page.$$('h1');
  const h1 = h1s[1];
  //Descriptionの取得
  const description = await page.evaluate(() => {
    return document.getElementsByName('description')[0].content
  })
  //End of Descriptionの取得
  //h1の取得
  if (h1 == undefined) {
    console.log(`h1: None`)
  } else {
  const h1Text = await page.evaluate(el => el.innerText, h1);
  console.log(`h1: ${h1Text}`)
  }
  //End of h1の取得

  console.log(`description : ${description}`)
  console.log(`url: ${url}`)
  console.log(`title: ${title}`)
  console.log('-------------------------')

  await page.close();
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-sandbox',
      '--no-zygote',
      '--single-process'
    ]
  });

  for (const url of urlArray) {
    await getInfo(browser, url)
  }
  browser.close();
})();

