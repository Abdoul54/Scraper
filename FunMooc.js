const puppeteer = require("puppeteer");

/**
 * Class to scrape course data from FunMooc
 * @class
 * @classdesc Class to scrape course data from FunMooc
 * @returns {Object}
 */
class FunMoocScraper {
  /**
   * @constructor
   * @returns {Object}
   * @description Constructor for FunMoocScraper class
   */
  constructor() {
    this.funMooc = {
      name: "//h1[@class='subheader__title']",
      orga: "//a/meta[@property='name']",
      brief:
        "//*[@id='site-content']/div[2]/div[1]/div/div[1]/div[1]/div/div/p",
      programme:
        "//div[@class='nested-item nested-item--accordion nested-item--1']",
      animateur: "//h3[@class='person-glimpse__title']",
      languages: "//div[@class='subheader__content']/div[2]/ul/div/li/span",
    };
  }

  /**
   * Extracts text from a given xpath
   * @param {Object} page
   * @param {String} xpath
   * @returns {String}
   * @description Extracts text from a given xpath
   * @async
   */
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

  /**
   * Extracts text from a given xpath
   * @param {Object} page
   * @param {String} xpath
   * @returns {String}
   * @description Extracts text from a given xpath
   * @async
   */
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

  /**
   * Extracts attribute from all elements matching a given xpath
   * @param {Object} page
   * @param {String} xpath
   * @param {String} attributeName
   * @returns {Array}
   * @description Extracts attribute from all elements matching a given xpath
   * @async
   */
  async extractAttributeFromAll(page, xpath, attributeName) {
    return await page.evaluate(
      (xpath, attributeName) => {
        const elements = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );
        const attributes = [];
        for (let i = 0; i < elements.snapshotLength; i++) {
          const element = elements.snapshotItem(i);
          const attribute = element.getAttribute(attributeName);
          if (attribute) {
            attributes.push(attribute);
          }
        }
        return attributes;
      },
      xpath,
      attributeName
    );
  }

  /**
   * Checks if a URL exists
   * @param {String} url
   * @returns {Boolean}
   * @description Checks if a URL exists
   * @async
   */
  async checkURLExists(url) {
    try {
      const parsedURL = new URL(url);
      url = `${parsedURL.origin}${parsedURL.pathname}${parsedURL.search}`;
      const response = await fetch(url, { method: "HEAD" });

      return (
        parsedURL.pathname === new URL(response.url).pathname && response.ok
      );
    } catch (error) {
      console.error("Error checking URL:", error);
      return false;
    }
  }

  /**
   * Extracts languages from a given string
   * @param {String} data
   * @returns {Array}
   * @description Extracts languages from a given string
   */
  languageExtractor(data) {
    let languages = [];
    data = data
      .toLowerCase()
      .replace(",", "")
      .split(":")[1]
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1));
    // Check for each language and push the corresponding code into the array
    if (data.includes("Français") || data.includes("French")) {
      languages.push("fr");
    }
    if (data.includes("Anglais") || data.includes("English")) {
      languages.push("en");
    }
    if (data.includes("Arabe") || data.includes("Arabic")) {
      languages.push("ar");
    }
    return languages;
  }

  /**
   * Extracts text from two xpaths and combines them
   * @param {Object} page
   * @param {String} xpath1
   * @param {String} xpath2
   * @returns {Array}
   * @description Extracts text from two xpaths and combines them
   * @async
   */
  async doubleExtraction(page, xpath1, xpath2) {
    const texts = await page.evaluate(
      (xpath1, xpath2) => {
        const iterator1 = document.evaluate(
          xpath1,
          document,
          null,
          XPathResult.ORDERED_NODE_ITERATOR_TYPE,
          null
        );

        const iterator2 = document.evaluate(
          xpath2,
          document,
          null,
          XPathResult.ORDERED_NODE_ITERATOR_TYPE,
          null
        );

        let element1 = iterator1.iterateNext();
        let element2 = iterator2.iterateNext();

        const texts = [];

        while (element1 && element2) {
          const text1 = element1.textContent.trim();
          const text2 = element2.textContent.trim();

          const combinedText = `${text1} - ${text2}`;
          texts.push(combinedText);

          element1 = iterator1.iterateNext();
          element2 = iterator2.iterateNext();
        }

        return texts;
      },
      xpath1,
      xpath2
    );

    return texts;
  }

  /**
   * Scrapes course data from a given URL
   * @param {String} url
   * @returns {Object}
   * @description Scrapes course data from a given URL
   * @async
   */
  async scrapeCourseData(url) {
    let browser;
    let languages;
    if (!(await this.checkURLExists(url))) {
      console.error("URL '" + url + "' does not exist");
      return;
    }
    try {
      browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url);

      const [title, orga, brief, animateur, programme, languages] =
        await Promise.all([
          this.extractText(page, this.funMooc.name),
          this.extractAttributeFromAll(
            page,
            this.funMooc.orga,
            "content"
          ),
          this.extractMany(page, this.funMooc.brief).then((brief) =>
            brief.join("")
          ),
          this.extractMany(page, this.funMooc.animateur).then(
            (animateur) => animateur
          ),
          this.doubleExtraction(
            page,
            this.funMooc.programme,
            this.funMooc.programme + "/ul/li/div/div"
          ).then((programme) =>
            programme.map((item) => {
              return item.replace(/\n\s+/g, " ").trim();
            })
          ),
          this.extractText(page, this.funMooc.languages).then((data) =>
            this.languageExtractor(data)
          ),
        ]);
      return {
        title,
        url,
        orga,
        brief,
        programme,
        animateur,
        languages,
      };
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

module.exports = FunMoocScraper;

// let scraper = new FunMoocScraper();

// scraper
//   .scrapeCourseData(
//     "https://www.fun-mooc.fr/fr/cours/orisat-teledetection-des-risques-naturels/"
//   )
//   .then((data) => console.log(data));

// scraper
//   .scrapeCourseData("https://www.fun-mooc.fr/fr/cours/medical-mycology/")
//   .then((data) => console.log(data));

// //	!  buttons    //section/div/ul/li/div/button
// //	!  subbuttons //section/div/ul/li/div/ul/li/div/button
// // *[@id="site-content"]/div[2]/div[2]/div[1]/section/div/div[2]/div/div/a/h3
// // https://www.fun-mooc.fr/fr/cours/medical-mycology/
