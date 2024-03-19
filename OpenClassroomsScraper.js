const Scraper = require("./Scraper");
const langdetect = require("langdetect");

/**
 * OpenClassrooms scraper
 * @extends Scraper
 */
class OpenClassrooms extends Scraper {
  /**
   * Create an OpenClassrooms scraper
   * @constructor
   * @param {string} platform - The name of the platform
   * @param {object} selectors - The selectors to use for scraping
   */
  constructor() {
    super("OpenClassrooms");
    this.selectors = {
      name: "//*[@id='course-header']/div[1]/div/div/div/a/h1",
      orga: "//*[@id='tab-courseMenu']/div/a/span",
      brief:
        "//*[@id='mainContent']/article/div[3]/div/div/div/div[2]/div/section/div/div[1]/p",
      duration:
        "//*[@id='course-header']/div[2]/div/div/div/div/div[1]/ul/li[1]/span",

      programme: "//div[@class='course-part-summary__title']/h3",
      animateur: "//div[@itemprop='name']",
    };
    this.type = "course";
  }

  /**
   * Check the type of course
   * @param {string} url - The URL of the OpenClassrooms course
   * @method
   * @memberof OpenClassrooms
   */
  checkType(url) {
    if (url.includes("courses")) {
      this.type = "course";
    } else if (url.includes("paths")) {
      this.type = "path";
      this.switchSelectors();
    }
  }

  /**
   * Switch the selectors based on the type of course
   * @param {string} type - The type of course
   * @method
   * @memberof OpenClassrooms
   * @async
   */
  switchSelectors(type) {
    if (type === "path") {
      this.selectors = {
        name: '//*[@id="path_details_screen"]/section[1]/div[1]/div/div[1]/div/h1',
        orga: "",
        brief: '//*[@id="path_details_description"]/div/div/p',
        duration:
          '//*[@id="path_details_screen"]/section[1]/div[1]/div/div[1]/div/div/div[1]/div[2]/div/div/div/span/p',
        programme: '//*[@id="path_details_description"]/div/div/ol',
        altProgramme1: '//*[@id="path_details_description"]/div/div/ul',
        altProgramme2: '//*[@id="path_details_description"]/div/div/ul[1]',
        animateur:
          '//*[@id="path_details_description"]/div/div/figure[2]/figcaption', //! Needs to be cleaned
      };
    } else if (type === "course") {
      this.selectors = {
        name: "//*[@id='course-header']/div[1]/div/div/div/a/h1",
        orga: "//*[@id='tab-courseMenu']/div/a/span",
        brief:
          "//*[@id='mainContent']/article/div[3]/div/div/div/div[2]/div/section/div/div[1]/p",
        duration:
          "//*[@id='course-header']/div[2]/div/div/div/div/div[1]/ul/li[1]/span",
        programme: "//div[@class='course-part-summary__title']/h3",
        animateur: "//div[@itemprop='name']",
      };
    }
  }
  /**
   * Scrape the course data
   * @param {string} url - The URL of the OpenClassrooms course
   * @returns {object} - The scraped course data
   * @throws {object} - The error message
   * @method
   * @memberof OpenClassrooms
   */
  detectLanguage(text) {
    if (langdetect.detect(text)[0].lang === "fr") {
      return ["french"];
    }
    if (langdetect.detect(text)[0].lang === "en") {
      return ["english"];
    }
    return [];
  }

  /**
   * Extract the description of a path
   * @param {object} page - The Puppeteer page
   * @returns {string} - The extracted description
   * @method
   * @memberof OpenClassrooms
   * @async
   */
  async extractPathDetailsDescription(page) {
    var attempts = 0;
    let texts = [];
    for (let i = 1; i < 10; i++) {
      if (attempts > 3) {
        break;
      }
      const selector = `#path_details_description > div > div > p:nth-child(${i})`;
      const text = await page.evaluate((selector) => {
        const paragraphs = document.querySelectorAll(selector);
        return Array.from(paragraphs).map((paragraph) =>
          paragraph.textContent.trim()
        );
      }, selector);

      if (text.length === 0) {
        attempts++;
      }
      if (text.length > 0) {
        texts.push(...text);
      }
    }
    if (texts[texts.length - 1].endsWith(":")) {
      texts.pop();
    }
    return texts.join("\n");
  }

  /**
   * Extract text content after a mutation
   * @param {object} page - The Puppeteer page
   * @param {string} xpath - The XPath of the element to extract
   * @returns {string} - The extracted text content
   * @method
   * @memberof OpenClassrooms
   * @async
   */
  async extractTextPostMutation(page, xpath) {
    return await page.evaluate(async (xpath) => {
      const waitForElement = (xpath) => {
        return new Promise((resolve) => {
          const observer = new MutationObserver((mutations) => {
            const element = document.evaluate(
              xpath,
              document,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
            ).singleNodeValue;
            if (element) {
              observer.disconnect();
              resolve(element);
            }
          });
          observer.observe(document, { childList: true, subtree: true });
        });
      };

      const element = await waitForElement(xpath);
      return element ? element.textContent.trim() : null;
    }, xpath);
  }

  /**
   * Extract the sibling before a list
   * @param {object} page - The Puppeteer page
   * @param {string} xpath - The XPath of the list
   * @returns {string} - The extracted sibling
   * @method
   * @memberof OpenClassrooms
   * @async
   */ 
  async extractSiblingBeforeLists(page, xpath) {
    return await page.evaluate((xpath) => {
      const ulElements = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
      const siblings = [];
      for (let i = 0; i < ulElements.snapshotLength; i++) {
        const ulElement = ulElements.snapshotItem(i);
        if (ulElement) {
          const precedingSibling = ulElement.previousElementSibling;
          siblings.push(
            precedingSibling.tagName + ": " + precedingSibling.textContent
          );

          if (precedingSibling.tagName === "H2") {
            return ulElement.textContent.trim();
          }
        }
      }
      return null;
    }, xpath);
  }

  /**
   * Extract the programme of a path
   * @param {object} page - The Puppeteer page
   * @returns {string} - The extracted programme
   * @method
   * @memberof OpenClassrooms
   * @async
   */
  async extractProgramme(page) {
    try {
      let programme = await this.extractSiblingBeforeLists(
        page,
        this.selectors.altProgramme1
      )
        .then((programme) => programme.split("\n"))
        .catch(() => {
          null;
        });
      if (!programme) {
        programme = await super
          .extractMany(page, this.selectors.programme)
          .then((programme) =>
            programme && programme[0]
              ? programme[0].trim().split("\n")
              : super
                  .extractMany(page, this.selectors.altProgramme2)
                  .then((programme) => programme[0].trim().split("\n"))
                  .catch((error) => {
                    console.error("Error extracting programme:", error);
                  })
          );
      }
      return programme;
    } catch (error) {
      console.error("Error extracting programme:", error);
      return null;
    }
  }

  /**
   * Scrape the course data
   * @param {string} url - The URL of the OpenClassrooms course
   * @returns {object} - The scraped course data
   * @throws {object} - The error message
   * @async
   * @method
   * @memberof OpenClassrooms
   */
  async scrape(url) {
    try {
      let brief;
      let programme;
      let title;
      let animateur;
      const orga = "OpenClassrooms";
      if (!this.checkURLExists(url)) {
        console.error("URL '" + url + "' does not exist");
        return;
      }
      var { browser, page } = await super.launchBrowser(url);
      this.checkType(url);
      this.switchSelectors(this.type);
      if (this.type === "path") {
        [brief, programme, title] = await Promise.all([
          this.extractPathDetailsDescription(page).then((brief) =>
            brief
              ? brief
              : this.extractMany(
                  page,
                  '//*[@id="path_details_description"]/div/div/p'
                ).then((brief) => brief.slice(0, 3).join(" ").trim())
          ),
          this.extractProgramme(page),
          this.extractTextPostMutation(page, this.selectors.name),
        ]);
        console.log(programme);
        animateur = [];
      } else {
        [brief, programme, title, animateur] = await Promise.all([
          super
            .extractMany(page, this.selectors.brief)
            .then((brief) => brief.join(" ")),
          super.extractMany(page, this.selectors.programme),
          super.extractText(page, this.selectors.name),
          super.extractMany(page, this.selectors.animateur),
        ]);
      }

      const duration = await super.extractText(page, this.selectors.duration);
      return {
        title,
        platform: this.platform,
        orga,
        url,
        // type: this.type,
        brief,
        programme,
        duration,
        animateur,
        language: this.detectLanguage(brief),
      };
    } catch (error) {
      console.error("Error scraping course data:", error);
      return null;
    } finally {
      if (browser) {
        await super.closeBrowser(browser);
      }
    }
  }
}

module.exports = OpenClassrooms;
