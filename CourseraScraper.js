const Scraper = require("./Scraper");

/**
 * Coursera scraper
 * @extends Scraper
 * @class
 */
class Coursera extends Scraper {
  /**
   * Create a Coursera scraper
   * @constructor
   * @param {string} url - The URL of the Coursera course
   * @memberof Coursera
   * @method
   */
  constructor(url) {
    super("Coursera");
    this.url = url;
    this.selectors = {
      name: "//h1[@data-e2e='hero-title']",
      orga: "//*[@id='courses']/div/div/div/div[3]/div/div[2]/div[2]/div/div[2]/a/span",
      //*[@id='modules']/div/div/div/div[3]/div/div[2]/div[2]/div/div[2]/a/span
      brief:
        "//*[@id='courses']/div/div/div/div[1]/div/div/div/div[1]/div/div/div/div/p[1]/span/span",
      programme: "//*[@data-e2e='sdp-course-list-link']",
      animateur: '//a[@data-track-component="hero_instructor"]/span',
      duration:
        '//*[@id="rendered-content"]/div/main/section[2]/div/div/div[1]/div[2]/section/div[2]/div[3]/div[1]',
      languages: "//*[@role='dialog']/div[2]/div[2]/p[2]",
    };
    this.type = this.checkType(url);
  }

  /**
   * Switch the selectors to the modules page
   * @param {object} selectors - The selectors to switch
   * @memberof Coursera
   * @method
   * @override
   */
  switchToModules = (selectors) => {
    selectors.orga = selectors.orga.replace("courses", "modules");
    selectors.brief =
      "//*[@id='modules']/div/div/div/div[1]/div/div/div/div[1]/div/p[1]";
    selectors.programme =
      "//*[@class='cds-AccordionRoot-container cds-AccordionRoot-silent']/div[1]/button/span/span/span/h3";
    selectors.duration =
      "//*[@id='rendered-content']/div/main/section[2]/div/div/div[2]/div/div/section/div[2]/div[2]/div[1]";
  };

  /**
   * Check the type of the URL
   * @param {string} url - The URL of the Coursera course
   * @returns {string} - The type of the URL
   * @memberof Coursera
   * @method
   */
  checkType(url) {
    let result = url.includes("specializations")
      ? "specialization"
      : url.includes("learn")
      ? "module"
      : "certificate";
    if (result === "module") {
      this.switchToModules(this.selectors);
    }
    return result;
  }

  /**
   * Extract the languages from the course page
   * @param {object} page - The Puppeteer page
   * @param {string} selector - The selector for the languages
   * @returns {array} - The languages of the course
   * @memberof Coursera
   * @method
   * @async
   */
  async extractLanguages(page, selector) {
    try {
      let languages = [];
      let langs = await this.extractText(page, selector);
      if (langs) {
        langs = langs
          .split(",")
          .map((lang) => lang.trim().split(" ")[0])
          .join(", ");
        if (langs.includes("English")) {
          languages.push("en");
        }
        if (langs.includes("Français")) {
          languages.push("fr");
        }
        if (langs.includes("العربية")) {
          languages.push("ar");
        }
        return languages;
      } else {
        throw new Error("No languages found");
      }
    } catch (error) {
      console.error("Error extracting languages:", error);
      throw error;
    }
  }

  /**
   * Extract the programme from the course page
   * @param {object} page - The Puppeteer page
   * @param {string} xpath - The XPath selector for the programme
   * @returns {array} - The programme of the course
   * @memberof Coursera
   * @method
   * @async
   */
  async extractProgramme(page, xpath) {
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
   * Extract the animateur from the course page
   * @param {object} page - The Puppeteer page
   * @param {string} xpath - The XPath selector for the animateur
   * @returns {array} - The animateur of the course
   * @memberof Coursera
   * @method
   * @async
   */
  async extractAnimateur(page, xpath) {
    // Implementation of extractAnimateur function
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
        if (!texts.includes(element.textContent.trim())) {
          texts.push(element.textContent.trim());
        }
        element = iterator.iterateNext();
      }
      return [...new Set(texts)];
    }, xpath);
  }

  /**
   * Extract the duration from the course page
   * @param {object} page - The Puppeteer page
   * @returns {array} - The duration of the course
   * @memberof Coursera
   * @method
   * @async
   */
  async extarctDuration(page) {
    const words = ["hours", "days", "weeks", "months"];
    const elementHandle = await page.$$(
      "xpath///div[@class='cds-119 cds-Typography-base css-h1jogs cds-121']"
    );
    let data = [];

    for (const element of elementHandle) {
      const text = await page.evaluate((el) => el.textContent, element);
      if (words.some((word) => text.includes(word))) {
        data.push(text);
      }
    }
    return [...new Set(data)];
  }

  /**
   * Scrape the course data
   * @returns {object} - The scraped course data
   * @memberof Coursera
   * @method
   * @async
   * @override
   */
  async scrape() {
    try {
      let languages;
      if (!(await this.checkURLExists(this.url))) {
        throw new Error("URL does not exist");
      }
      var { browser, page } = await super.launchBrowser(this.url);

      if (
        await super.checkElementExistence(
          page,
          "xpath///div[2]/div/button/span/span"
        )
      ) {
        await page.click("xpath///div[2]/div/button/span/span");
        languages = await this.extractLanguages(page, this.selectors.languages);
      }
      const [title, orga, brief, programme, duration, animateur] =
        await Promise.all([
          super.extractText(page, this.selectors.name),
          super.extractText(page, this.selectors.orga),
          super.extractText(page, this.selectors.brief),
          this.extractProgramme(page, this.selectors.programme),
          this.extarctDuration(page, this.selectors.duration),
          super
            .extractMany(page, this.selectors.animateur)
            .then((animateur) => [...new Set(animateur)]),
        ]);

      return {
        title,
        platform: this.platform,
        url: this.url,
        orga,
        brief,
        programme,
        duration,
        animateur,
        languages,
      };
    } catch (error) {
      console.error("Error scraping course data:", error);
      return null;
    } finally {
      if (browser) {
        super.closeBrowser(browser);
      }
    }
  }
}

module.exports = Coursera;
