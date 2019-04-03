'use strict';
const TARGET_INDEX = 0;
const puppeteer = require('puppeteer')
const fs = require('fs');
const csv = require('csv');
const csvSync = require('csv-parse/lib/sync'); // requiring sync module

const file = 'input.csv';
let data = fs.readFileSync(file);
let items = [];

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
  try {
  await page.goto(url);
  } catch(e) {
    let page = await browser.newPage();
    await page.close();
  }
  const title = await page.title()
  const h1s = await page.$$('h1');
  const h1 = h1s[0];
  const checkDescriptions = await page.$$("head > meta[name='description']");
  const checkDescription = checkDescriptions[0];
  const checkOgDescriptions = await page.$$("head > meta[property='og:description']");
  const checkOgDescription = checkOgDescriptions[0];

  //Descriptionの取得
  if (checkDescription == undefined){
    if(checkOgDescription == undefined){
    var descriptionResult = "None";
    } else {
      const ogDescription = await page.evaluate(() => {
        return document.querySelector('meta[property="og:description"]').getAttribute('content');
        });
          var descriptionResult = ogDescription;
    }
  } else { 
  const description = await page.evaluate(() => {
  return document.getElementsByName('description')[0].content
  });
    var descriptionResult = description;
  }
  //End of Descriptionの取得
  
  //h1の取得
  if (h1 == undefined) {
    var h1Result = "None";
  } else {
  const h1Text = await page.evaluate(el => el.innerText, h1);
    var h1Result = h1Text;
  }
  //End of h1の取得
  console.error(`url: ${url}`)
  console.error(`title: ${title}`)
  console.error(`description: ${descriptionResult}`)
  console.error(`h1: ${h1Result}`)
  console.error('-------------------------')
  items.push({url, title, descriptionResult, h1Result});
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
  var label = 'for-loop';
  console.time(label);
  for (const url of urlArray) {
    await getInfo(browser, url)
  }
  console.timeEnd(label);
  const columns = {
    url: "url",
    title: "Title",
    descriptionResult: "description",
    h1Result: "H1",
    };
  csv.stringify(items, { header: true, columns: columns}, function(err, output){
  console.log(output);
  });

  browser.close();
})();

