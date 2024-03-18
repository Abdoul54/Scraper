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
      moduleTitles:
        "//div[@data-testid='accordion-item']/div/div/div/div[1]/div/h3/a",
      moduleDescs:
        "/div/div/div/div[2]/div/div/div/div/div/div/div[2]/div/div/div",
      animateur: '//a[@data-track-component="hero_instructor"]/span',
      progDesc:
        "//*[@class='cds-AccordionRoot-container cds-AccordionRoot-silent']/div[2]/div/div/div/div/div/div",
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
    selectors.progDesc =
      "//*[@class='cds-AccordionRoot-container cds-AccordionRoot-silent']/div[2]/div/div/div/div/div/p";
    selectors.duration =
      "//*[@id='rendered-content']/div/main/section[2]/div/div/div[2]/div/div/section/div[2]/div[2]/div[1]";
    selectors.moduleTitles =
      "//div[@data-testid='accordion-item']/div/div/div/div/button/span/span/span/h3";
    selectors.moduleDescs = "/div/div/div/div/div/div/div/div/div/p";
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

  async extractManyOuterHtml(page, xpath) {
    const elementsWithTags = await page.evaluate((xpath) => {
      // Define your XPath expression here
      const xpathExpression = xpath;
      const result = document.evaluate(
        xpathExpression,
        document,
        null,
        XPathResult.ORDERED_NODE_ITERATOR_TYPE,
        null
      );

      const elements = [];
      let element = result.iterateNext();

      while (element) {
        elements.push(element.outerHTML);
        element = result.iterateNext();
      }

      return elements;
    }, xpath); // pass the xpath argument here

    return elementsWithTags;
  }
  async extractProgramme(page) {
    const programme = [];
    const elementHandle = await page.$$("xpath/" + this.selectors.moduleTitles);
    let counter = 1;
    for (const element of elementHandle) {
      const moduleTitle = await page.evaluate((el) => el.textContent, element);
      let moduleDesc = await super
        .extractMany(
          page,
          `//div[@data-testid="accordion-item"][${counter}]${this.selectors.moduleDescs}`
        )
        .then((moduleDesc) =>
          moduleDesc.join(". ").replace(/\.\./g, ".").replace(/\n/g, "")
        );

      if (moduleDesc.length === 0) {
        moduleDesc = await super
          .extractMany(
            page,
            `//div[@data-testid="accordion-item"][${counter}]/div/div/div/div[2]/div/div/div/div/div/div[1]/ul/li`
          )
          .then((moduleDesc) =>
            moduleDesc.join(". ").replace(/\.\./g, ".").replace(/\n/g, "")
          );
      }
      var module = moduleTitle.trim().concat(" :   " + moduleDesc);
      programme.push(module);

      counter++;
    }
    return programme;
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
      console.log(this.type);

      const programme = await this.extractProgramme(page);

      console.log(this.url);
      console.log(programme);
      // const elementWithTags = await page.evaluate(() => {
      //   // Define your XPath expression here
      //   const xpathExpression =
      //     '//div[@data-testid="accordion-item"][4]/div/div/div/div[2]/div/div/div/div/div/div/div[2]/div/div/div';
      //   const element = document.evaluate(
      //     xpathExpression,
      //     document,
      //     null,
      //     XPathResult.FIRST_ORDERED_NODE_TYPE,
      //     null
      //   ).singleNodeValue;
      //   return element ? element.outerHTML : null;
      // });
      // console.log(elementWithTags);
    } catch (error) {
      console.error("Error scraping course data:", error);
      return null;
    } finally {
      if (browser) {
        super.closeBrowser(browser);
      }
    }
  }

  async extractParallel(page, xpath1, xpath2) {
    try {
      const titleXPath = "xpath/" + xpath1 + "/div/div[1]/h3";
      if (this.type === "specialization") {
        var descriptionXPath = await page.$$(
          "xpath/" + xpath2 + "/div/div/div/div/p"
        );
      } else if (this.type === "certificate") {
        var descriptionXPath = await page.$$(
          "xpath/" + xpath2 + "/ul/li/div/div/div/p/span/span"
        );
      } else {
        var descriptionXPath = await page.$$("xpath/" + xpath2);
      }

      const titleHandles = await page.$$(titleXPath);
      const descriptionHandles = await page.$$(descriptionXPath);

      let data = [];

      const maxLength = Math.max(
        titleHandles.length,
        descriptionHandles.length
      );

      for (let i = 0; i < maxLength; i++) {
        const title =
          i < titleHandles.length
            ? await page.evaluate(
                (el) => el.textContent.trim(),
                titleHandles[i]
              )
            : "";
        let description = "";
        if (i < descriptionHandles.length) {
          const paragraphHandles = await descriptionHandles[i].$$("p");
          const paragraphs = await Promise.all(
            paragraphHandles.map((p) =>
              page.evaluate((el) => el.textContent.trim(), p)
            )
          );
          description = paragraphs.join("\n");
        }
        if (!description) {
          data.push(title);
        } else {
          data.push(`${title}: ${description}`);
        }
      }

      return data;
    } catch (error) {
      console.error("Error extracting parallel data:", error);
      return null;
    }
  }
}
let scraper = new Coursera(
  "https://www.coursera.org/specializations/data-science-fundamentals-python-sql"
);
// "https://www.coursera.org/specializations/become-a-journalist"
// "https://www.coursera.org/professional-certificates/ibm-data-analyst"
// "https://www.coursera.org/learn/financial-markets-global"

scraper.scrape();
scraper = new Coursera(
  "https://www.coursera.org/learn/financial-markets-global"
);

scraper.scrape();
scraper = new Coursera(
  "https://www.coursera.org/specializations/become-a-journalist"
);
scraper.scrape();

scraper = new Coursera(
  "https://www.coursera.org/professional-certificates/ibm-data-analyst"
);
scraper.scrape();

//*[@id="cds-react-aria-27-accordion-panel"]/div/div/p/text()
//*[@class='cds-AccordionRoot-container cds-AccordionRoot-silent']/div[1]/button/span/span/span/h3
//*[@class='cds-AccordionRoot-container cds-AccordionRoot-silent']/div[2]/div/div/div/div/div/p

//*[@data-e2e='sdp-course-list-link']
//*[@class="cds-AccordionRoot-container cds-AccordionRoot-silent"]/div[2]/div/div/div/div/div/div/div/div/div/div/p

//*[@id="cds-react-aria-25"]/div[1]/div/h3/a

//*[@class="cds-AccordionRoot-container cds-AccordionRoot-silent"]/div[2]/div/div/div/div/div/div       /ul/li/div/div/div/p/span/span

/************************************-      spec and cert         -***************************************/
//! module title
//div[@data-testid="accordion-item"]/div/div/div/div[1]/div/h3/a
//! module body
//div[@data-testid="accordion-item"]/div/div/div/div[2]/div/div/div/div/div/div/div[2]/div/div/div
// /div/div /
//   div /
//   div[2] /
//   div /
//   div /
//   div /
//   div /
//   div /
//   div /
//   div[2] /
//   div /
//   div /
//   div;

//! in case its a  list
//div[@data-testid="accordion-item"]/div/div/div/div[2]/div/div/div/div/div/div[1]/ul/li

/************************************-      course         -***************************************/

//! module title
//div[@data-testid='accordion-item']/div/div/div/div/button/span/span/span/h3
//! module body
//div[@data-testid='accordion-item']/div/div/div/div/div/div/div/div/div/p
//! in case its a  list

// https://www.coursera.org/specializations/become-a-journalist
// https://www.coursera.org/learn/financial-markets-global
