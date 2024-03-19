const Scraper = require("./Scraper");
/**
 * EDX scraper
 * @extends Scraper
 * @class
 */
class EDX extends Scraper {
  /**
   * Create an EDX scraper
   * @constructor
   * @memberof EDX
   * @method
   */
  constructor() {
    super("EDX");
    this.selectors = {
      name: '//div[@class="course-about desktop course-info-content"]//div[1]/h1',
      orga: '//div[@class="course-about desktop course-info-content"]//div[1]/ul/li[1]/a',
      brief: '//div[@class="mt-2 lead-sm html-data"]',
      programme: '//div[@class="mt-2 html-data"]/ul/li',
      duration:
        '//div[@class="course-about desktop course-info-content"]/div[2]/div/div[1]/div/div/div[1]/div/div[1]', //*
      animateur: '//div[@class="instructor-card px-4 py-3.5 rounded"]/div/h3',
      languages:
        '//div[@class="course-about desktop course-info-content"]/div[4]/div/div[2]/div/div/div[2]/ul/li[1]',
    };
    this.type = "course";
  }

  /**
   * Extract the languages and organization from the data
   * @param {object} page - The Puppeteer page object
   * @returns {object} - The extracted languages and organization
   * @memberof EDX
   * @method
   * @async
   */
  async extractLanguagesAndOrga(page) {
    try {
      let elements = await page.$$(
        'xpath///div[@class="course-about desktop course-info-content"]/div[4]/div//ul/li'
      );

      let data = {};
      for (let element of elements) {
        let value = await element.evaluate((el) => el.textContent);
        if (value.includes("Languages:") || value.includes("Language:")) {
          data["languages"] = value.split(": ")[1];
        }
        if (value.includes("Institution:")) {
          data["orga"] = value.split(": ")[1];
        }
      }
      return data;
    } catch (error) {
      console.error("Error scraping course data:", error);
      return null;
    }
  }

  /**
   * Scrape the data from the URL
   * @param {string} url - The URL to scrape
   * @returns {object} - The scraped data
   * @memberof EDX
   * @method
   * @async
   */
  async scrape(url) {
    try {
      if (!(await super.checkURLExists(url))) {
        console.error("URL '" + url + "' does not exist");
        return;
      }
      var { browser, page } = await super.launchBrowser(url);

      const [title, brief, animateur, programme, duration] = await Promise.all([
        super.extractText(page, this.selectors.name),
        super
          .extractMany(page, this.selectors.brief)
          .then((brief) => brief.join(" ").trim().replace(/\n/g, "")),
        super.extractManyWithMutation(page, this.selectors.animateur),
        super
          .extractMany(page, this.selectors.programme)
          .then((programme) => programme.map((prog) => prog.trim())),
        super.extractText(page, this.selectors.duration),
      ]);
      const { orga, languages } = await this.extractLanguagesAndOrga(page);
      return {
        title,
        platform: this.platform,
        url,
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
        await browser.close();
      }
    }
  }
}

module.exports = EDX;
