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
        '//div[@class="course-about desktop course-info-content"]/div[2]/div/div[1]/div/div/div[1]/div/div[1]',
      pace: '//div[@class="course-about desktop course-info-content"]/div[2]/div/div[1]/div/div/div[1]/div/div[2]',
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

      const [duration, pace] = await Promise.all([
        super
          .extractText(page, this.selectors.duration)
          .then((duration) => duration.split(" ")[0]),
        super.extractText(page, this.selectors.pace).then((pace) => {
          pace = pace.split(" ")[0];
          console.log(pace); // Add this line
          console.log(pace.includes("–"));
          if (pace.includes("–")) {
            return pace.split("–")[1];
          }
          return pace;
        }),
      ]);
      return {
        duration: pace * duration + ":00",
        pace,
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

let scraper = new EDX();
scraper
  .scrape(
    "https://www.edx.org/learn/chinese-history/harvard-university-chinas-political-and-intellectual-foundations-from-sage-kings-to-confucius"
  )
  .then(console.log);
