const puppeteer = require("puppeteer");

class FunMoocScraper {
  constructor() {
    this.openClassrooms = {
      programme:
        "//*[@id='site-content']/div[2]/div[1]/div/div[1]/div[2]/section/div/ul/li/div/button",
    };
  }

  async extractText(page, xpath) {
    return await page.evaluate((xpath) => {
      const element = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      return element ? element.textContent.trim() : null;
    }, xpath);
  }

  async extractMany(page, xpath) {
    return await page.evaluate((xpath) => {
      const iterator = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.ORDERED_NODE_ITERATOR_TYPE,
        null
      );
      let element = iterator.iterateNext();
      const texts = [];
      while (element) {
        texts.push(element.textContent.trim());
        element = iterator.iterateNext();
      }
      return texts;
    }, xpath);
  }

 

  async clickButton(page, buttonXPath) {
    try {
      if (page.$(buttonXPath)) {
        const button = await page.$(buttonXPath);
        return await button.click();
      }
    } catch (error) {
      console.error("Error clicking button:", error);
      return null;
    }
  }

  async scrapeCourseData(url) {
    let browser;
    if (!(await this.checkURLExists(url))) {
      console.error("URL '" + url + "' does not exist");
      return;
    }
    try {
      browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url);

      console.log(await this.clickButton(page, this.openClassrooms.programme));
    } catch (error) {
      console.error("Error scraping course data:", error);
      return null;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

let scraper = new FunMoocScraper();

scraper
  .scrapeCourseData(
    "https://www.fun-mooc.fr/fr/cours/orisat-teledetection-des-risques-naturels/"
  )
  .then((data) => {
    console.log(data);
  });

//	!  buttons    //section/div/ul/li/div/button
//	!  subbuttons //section/div/ul/li/div/ul/li/div/button

// if (
//   await this.checkElementExistence(page, "xpath///div[2]/div/button/span/span")
// ) {
//   await page.click("xpath///div[2]/div/button/span/span");
//   languages = await this.extractLanguages(page, this.selectors.languages);
//   languages = languages.split(",").map((language) => language.trim());
// }
