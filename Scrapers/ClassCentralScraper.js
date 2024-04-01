const Scraper = require("./Scraper");
const langdetect = require("langdetect");

/**
 * ClassCentral scraper
 * @extends Scraper
 * @class
 */
class ClassCentral extends Scraper {
  /**
   * Create a ClassCentral scraper
   * @constructor
   * @memberof ClassCentral
   * @method
   */
  constructor() {
    super("Class Central");
    this.selectors = {
      name: '//h1[@class="head-2 medium-up-head-1 small-down-margin-bottom-xsmall"]',
      orga: '//a[@class="link-gray-underline text-1"]',
      brief:
        '//div[@class="truncatable-area is-truncated wysiwyg text-1 line-wide"]',
      altBrief: '//div[@class="wysiwyg text-1 line-wide"]',
      programme:
        '//div[@class="truncatable-area is-truncated wysiwyg text-1 line-wide"]/ul/li',
      altProgramme: '//div[@class="wysiwyg text-1 line-wide"]/ul/li',
      animateur:
        '//div[@class="course-noncollapsable-section small-down-padding-medium padding-vert-medium"]/p',
      duration: '//div[@id="details-contents"]/ul/li/div[2]/span',
      languages: '//div[@id="details-contents"]/ul/li/div/span',
    };
  }

  /**
   * Detect the language of the text
   * @param {string} text - The text to detect the language
   * @returns {array} - The detected languages
   * @memberof ClassCentralq
   * @method
   */
  detectLanguage(text) {
    if (langdetect.detect(text)[0].lang === "fr") {
      return ["french"];
    }
    if (langdetect.detect(text)[0].lang === "en") {
      return ["english"];
    }
    if (langdetect.detect(text)[0].lang === "ar") {
      return ["arabic"];
    }
    return [];
  }

  /**
   * Calculate the course duration
   * @param {string} dur - The duration of the course
   * @returns {string} - The calculated duration
   * @memberof ClassCentral
   * @method
   */
  calculateCourseDuration(dur) {
    if (dur.match(/week(s)?/) && dur.match(/hour(s)?/)) {
      let weeks = dur.match(/\d+(?= week)/)[0];
      let hours = dur.match(/\d+(?= hours)/)[0];
      let duration = weeks * hours;
      return new String(duration).length === 1
        ? `0${duration}:00`
        : `${duration}:00`;
    } else if (dur.match(/hour(s)?/)) {
      let duration = dur.match(/\d+(?= hours)/)[0];
      return new String(duration).length === 1
        ? `0${duration}:00`
        : `${duration}:00`;
    } else {
      return "00:00";
    }
  }

  /**
   * Scrape the ClassCentral course data
   * @param {string} url - The URL of the ClassCentral course
   * @returns {object} - The scraped course data
   * @memberof ClassCentral
   * @method
   * @async
   * @throws {object} - The error message
   */
  async scrape(url) {
    try {
      var { browser, page } = await super.launchBrowser(url, true);

      const [title, brief, programme, animateur, duration, orga] =
        await Promise.all([
          super.extractText(page, this.selectors.name),
          super
            .extractText(page, this.selectors.brief)
            .then((data) =>
              data ? data : super.extractText(page, this.selectors.altBrief)
            )
            .then((data) => data.replace(/\n/g, "")),
          super.extractMany(page, this.selectors.programme).then((data) => {
            return data.length > 0
              ? data
              : super.extractMany(page, this.selectors.altProgramme);
          }),
          super.extractMany(page, this.selectors.animateur),
          page
            .$$eval("xpath/" + this.selectors.duration, (nodes) => {
              return nodes.map((node) => node.innerText);
            })
            .then((data) => data.filter((el) => el.match(/hour(s)?/)))
            .then((dur) => this.calculateCourseDuration(dur[0])),
          super.extractText(page, this.selectors.orga),
        ]);

      return {
        title,
        platform: this.platform,
        url,
        orga,
        brief,
        programme,
        animateur,
        duration,
        languages: this.detectLanguage(brief),
      };
    } catch (error) {
      return error;
    } finally {
      if (browser) {
        super.closeBrowser(browser);
      }
    }
  }
}

module.exports = ClassCentral;
