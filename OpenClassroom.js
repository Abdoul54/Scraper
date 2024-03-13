const puppeteer = require("puppeteer");
const langdetect = require("langdetect");

/**
 * OpenClassroomsScraper class
 * @class
 * @classdesc Class for scraping data from OpenClassrooms
 * @returns {Object}
 * @description Class for scraping data from OpenClassrooms
 */
class OpenClassroomsScraper {
  /**
   * Constructor for the OpenClassroomsScraper class
   * @constructor
   * @description Constructor for the OpenClassroomsScraper class
   * @returns {Object}
   */
  constructor() {
    this.platform = "OpenClassrooms";
    this.openClassrooms = {
      name: "//*[@id='course-header']/div[1]/div/div/div/a/h1",
      orga: "//*[@id='tab-courseMenu']/div/a/span",
      brief:
        "//*[@id='mainContent']/article/div[3]/div/div/div/div[2]/div/section/div/div[1]/p",
      programme: "//div[@class='course-part-summary__title']/h3",
      animateur: "//div[@itemprop='name']",
    };
  }

  /**
   * Extracts text from a given xpath
   * @param {Object} page
   * @param {String} xpath
   * @returns {String} text
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
   * Extracts multiple texts from a given xpath
   * @param {Object} page
   * @param {String} xpath
   * @returns {Array} texts
   * @description Extracts multiple texts from a given xpath
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
   * Extracts an attribute from all elements matching a given xpath
   * @param {Object} page
   * @param {String} xpath
   * @param {String} attributeName
   * @returns {Array} attributes
   * @description Extracts an attribute from all elements matching a given xpath
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
            attributes.push(attribute.substring("logo ".length));
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
   * Detects the language of a given text
   * @param {String} text
   * @returns {Array} languages
   * @description Detects the language of a given text
   */
  detectLanguage(text) {
    return langdetect.detect(text);
  }

  /**
   * Scrapes course data from OpenClassrooms
   * @param {String} url
   * @returns {Object} course
   * @description Scrapes course data from OpenClassrooms
   * @async
   */
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

      const [title, orga, brief, animateur, programme] = await Promise.all([
        this.extractText(page, this.openClassrooms.name),
        this.extractAttributeFromAll(
          page,
          this.openClassrooms.orga,
          "data-image-cdn-attr-alt"
        ),
        this.extractMany(page, this.openClassrooms.brief).then((brief) =>
          brief.join(" ")
        ),
        this.extractMany(page, this.openClassrooms.animateur),
        this.extractMany(page, this.openClassrooms.programme),
      ]);

      return {
        title,
        platform: this.platform,
        url,
        orga,
        brief,
        programme,
        animateur,
        language: this.detectLanguage(brief)[0].lang,
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

module.exports = OpenClassroomsScraper;