const Scraper = require("./Scraper");

/**
 * Unow scraper
 * @extends Scraper
 * @class
 */
class Unow extends Scraper {
  /**
   * Create a Unow scraper
   * @constructor
   * @memberof Unow
   * @method
   */
  constructor() {
    super("Unow");
    this.selectors = {
      name: '//div[@class="main-block__content course-hero__content"]//h1',
      brief: '//div[@class="unow-block__content course-grid pb-0"]/div/p',
      briefAlt:
        '//div[@class="main-block__content course-hero__content"]//p[1]',
      programme: '//h4[@class="course-program-detail__title"]',
      duration: '//ul[@class="course-offers__details"]/li',
      animateur: '//h3[@class="unow-heading-4 mt-0"]',
    };
    this.type = "course";
  }

  /**
   * Scrape Unow data
   * @param {string} url - The URL of the Unow course
   * @returns {object} - The scraped course data
   * @async
   * @method
   * @memberof Unow
   * @throws {object} - The error message
   */
  async scrape(url) {
    try {
      if (!(await super.checkURLExists(url))) {
        console.error("URL '" + url + "' does not exist");
        return;
      }
      var { browser, page } = await super.launchBrowser(url);

      const [title, brief, animateur, duration, programme] = await Promise.all([
        super.extractText(page, this.selectors.name),
        super
          .extractMany(page, this.selectors.brief)
          .then((briefs) =>
            briefs
              ? briefs.join("").replace(/\n/g).trim()
              : super.extractMany(page, this.selectors.briefAlt)
          ),
        super.extractMany(page, this.selectors.animateur),
        super.extractMany(page, this.selectors.duration).then((durations) =>
          durations
            .map((duration) => {
              if (duration.trim().includes("Durée")) {
                return (
                  duration.replace("Durée", "").trim().split("h")[0] + ":00"
                );
              }
            })
            .filter(Boolean)
        ),
        super.extractMany(page, this.selectors.programme),
      ]);
      return {
        title,
        platform: this.platform,
        url,
        orga: "Unow",
        brief,
        programme,
        duration: duration[0],
        animateur,
        languages: ["french"],
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

module.exports = Unow;
