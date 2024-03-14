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
      if (!this.checkURLExists(url)) {
        console.error("URL '" + url + "' does not exist");
        return;
      }
      var { browser, page } = await super.launchBrowser(url);

      const [title, orga, brief, duration, animateur, programme] =
        await Promise.all([
          super.extractText(page, this.selectors.name),
          super.extractAttributeFromAll(
            page,
            this.selectors.orga,
            "data-image-cdn-attr-alt"
          ),
          super
            .extractMany(page, this.selectors.brief)
            .then((brief) => brief.join(" ")),
          super.extractText(page, this.selectors.duration),
          super.extractMany(page, this.selectors.animateur),
          super.extractMany(page, this.selectors.programme),
        ]);

      return {
        title,
        platform: this.platform,
        url,
        orga,
        brief,
        programme,
        duration,
        animateur,
        language: this.detectLanguage(brief)[0].lang,
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
