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

  checkType(url) {
    if (url.includes("courses")) {
      this.type = "course";
    } else if (url.includes("paths")) {
      this.type = "path";
      this.switchSelectors();
    }
  }

  switchSelectors() {
    this.selectors = {
      name: '//*[@id="path_details_screen"]/section[1]/div[1]/div/div[1]/div/h1',
      orga: "",
      brief: '//*[@id="path_details_description"]/div/div/p',
      duration:
        '//*[@id="path_details_screen"]/section[1]/div[1]/div/div[1]/div/div/div[1]/div[2]/div/div/div/span/p',
      programme: '//*[@id="path_details_description"]/div/div/ol', //! all the li tags
      animateur:
        '//*[@id="path_details_description"]/div/div/figure[2]/figcaption', //! Needs to be cleaned
    };
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
    return langdetect.detect(text);
  }
  async extractUntilStrongTag(page, xpath) {
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
        if (element.tagName.toLowerCase() === "h3") {
          break; // Exit the loop if a <strong> tag is found
        }
        element = iterator.iterateNext();
      }
      return texts;
    }, xpath);
  }
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
    return texts.join("\n");
  }

  /**
   * Scrape the course data
   * @param {string} url - The URL of the OpenClassrooms course
   * @returns {object} - The scraped course data
   * @throws {object} - The error message
   * @override
   * @async
   * @method
   * @memberof OpenClassrooms
   */
  async scrape(url) {
    try {
      let brief;
      let programme;
      if (!this.checkURLExists(url)) {
        console.error("URL '" + url + "' does not exist");
        return;
      }
      var { browser, page } = await super.launchBrowser(url);
      this.checkType(url);
      if (this.type === "path") {
        brief = await this.extractPathDetailsDescription(page);
        programme = await super
          .extractMany(page, this.selectors.programme)
          .then((programme) => programme[0].trim().split("\n"));
      } else {
        brief = await super
          .extractMany(page, this.selectors.brief)
          .then((brief) => brief.join(" "));
        programme = await super.extractMany(page, this.selectors.programme);
      }

      console.log({
        selectors: this.selectors,
        type: this.type,
      });
      const [title, duration, animateur] = await Promise.all([
        super.extractText(page, this.selectors.name),
        super.extractText(page, this.selectors.duration),
        super.extractMany(page, this.selectors.animateur),
      ]);

      return {
        title,
        platform: this.platform,
        url,
        type: this.type,
        brief,
        programme,
        duration,
        animateur,
        language: [this.detectLanguage(brief)[0].lang],
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
let scraper = new OpenClassrooms();

scraper
  .scrape("https://openclassrooms.com/fr/paths/902-testeur-logiciel")
  .then((data) => {
    console.log(data);
  });

scraper
  .scrape(
    "https://openclassrooms.com/fr/courses/8204091-utilisez-chatgpt-pour-ameliorer-votre-productivite"
  )
  .then((data) => {
    console.log(data);
  });

// "https://openclassrooms.com/fr/courses/4544616-adoptez-les-microservices"
//? path
// {name:'//*[@id="path_details_screen"]/section[1]/div[1]/div/div[1]/div/h1',
// orga: "",
// brief: '//*[@id="path_details_description"]/div/div/p', //! all the p tags
// duration: '//*[@id="path_details_screen"]/section[1]/div[1]/div/div[1]/div/div/div[1]/div[2]/div/div/div/span/p',  //! Needs to be cleaned

// programme: '//*[@id="path_details_description"]/div/div/ol', //! all the li tags
// animateur:'//*[@id="path_details_description"]/div/div/figure[2]/figcaption' //! Needs to be cleaned
// }
//? course

//! Name
//*[@id="course-hero"]/div/div/div[1]/div[1]/h1
//*[@id="path_details_screen"]/section[1]/div[1]/div/div[1]/div/h1
//! Orga
//*[@id="tab-courseMenu"]/div/a/span

//! Brief
//*[@id="r-8217820"]
//! duration
//*[@id="course-header"]/div[2]/div/div/div/div/div[1]/ul/li[1]/span

//! Programme
//div[@class='course-part-summary__title']/h3

//! Animateur
//div[@itemprop='name']
