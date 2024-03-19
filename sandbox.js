// //! courses
const selectors = {
  name: '//div[@class="course-about desktop course-info-content"]//div[1]/h1',
  orga: '//div[@class="course-about desktop course-info-content"]//div[1]/ul/li[1]/a',
  brief: '//div[@class="mt-2 lead-sm html-data"]',
  programme:
    '//div[@class="course-about desktop course-info-content"]/div[4]/div/div[3]/div/div[2]/div/ul/li',
  //div[@class="course-about desktop course-info-content"]/div[4]/div/div[4]/div/div[2]/div/ul
  duration:
    '//div[@class="course-about desktop course-info-content"]/div[2]/div/div[1]/div/div/div[1]/div/div[1]', //*
  animateur: '//div[@class="instructor-card px-4 py-3.5 rounded"]/div/h3',
  languages:
    '//div[@class="course-about desktop course-info-content"]/div[4]/div/div[2]/div/div/div[2]/ul/li[1]',
  //*[@id="main-content"]/div                              /div[4]/div/div[3]/div/div/div[1]/ul/li[5]/text()
};

const Scraper = require("./Scraper");

class EDX extends Scraper {
  constructor() {
    super("EDX");
    this.selectors = {
      name: '//div[@class="course-about desktop course-info-content"]//div[1]/h1',
      orga: '//div[@class="course-about desktop course-info-content"]//div[1]/ul/li[1]/a',
      brief: '//div[@class="mt-2 lead-sm html-data"]',
      programme:
        '//div[@class="course-about desktop course-info-content"]/div[4]/div/div[3]/div/div[2]/div/ul/li',
      duration:
        '//div[@class="course-about desktop course-info-content"]/div[2]/div/div[1]/div/div/div[1]/div/div[1]', //*
      animateur: '//div[@class="instructor-card px-4 py-3.5 rounded"]/div/h3',
      languages:
        '//div[@class="course-about desktop course-info-content"]/div[4]/div/div[2]/div/div/div[2]/ul/li[1]',
    };
    this.type = "course";
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
  async extractManyWithMutation(page, xpath) {
    return await page.evaluate(async (xpath) => {
      const waitForElements = (xpath) => {
        return new Promise((resolve) => {
          const observer = new MutationObserver((mutations) => {
            const elements = [];
            const iterator = document.evaluate(
              xpath,
              document,
              null,
              XPathResult.ORDERED_NODE_ITERATOR_TYPE,
              null
            );
            let element = iterator.iterateNext();
            while (element) {
              elements.push(element);
              element = iterator.iterateNext();
            }
            if (elements.length > 0) {
              observer.disconnect();
              resolve(elements.map((element) => element.textContent.trim()));
            }
          });
          observer.observe(document, { childList: true, subtree: true });
        });
      };

      const texts = await waitForElements(xpath);
      return texts;
    }, xpath);
  }

  async scrape(url) {
    try {
      if (!(await super.checkURLExists(url))) {
        console.error("URL '" + url + "' does not exist");
        return;
      }
      var { browser, page } = await super.launchBrowser(url);

      const animateur = await this.extractManyWithMutation(page, this.selectors.animateur);
      return { animateur };
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

// module.exports = Edraak;

const edXScraper = new EDX();
edXScraper
  .scrape(
    "https://www.edx.org/learn/python/harvard-university-cs50-s-introduction-to-programming-with-python"
  )
  .then(console.log);
edXScraper
  .scrape("https://www.edx.org/learn/excel/ibm-analyzing-data-with-excel")
  .then(console.log);
edXScraper
  .scrape(
    "https://www.edx.org/learn/six-sigma/technische-universitat-munchen-six-sigma-analyze-improve-control"
  )
  .then(console.log);
