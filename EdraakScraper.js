const Scraper = require("./Scraper");

/**
 * Edraak scraper
 * @extends Scraper
 * @class
 */
class Edraak extends Scraper {
  /**
   * Create an Edraak scraper
   * @constructor
   * @param {string} platform - The name of the platform
   * @param {object} selectors - The selectors to use for scraping
   * @memberof Edraak
   * @method
   */
  constructor() {
    super("Edraak");
    this.selectors = {
      name: '//h1[@class="heroTitle"]',
      orga: '//h4[@class="organizationName"]',
      brief: '//p[@class="descriptionParagraph"]', //* can be multiple p
      programme: '//h4[@class="syllabusItemTitle"]',
      altProgramme: '//div[@class="programSectionContent"]/div/div/ul/li/span',
      // duration, //* Does not exist
      animateur: '//span[@class="teacherName"]',
      // languages, //* en/ar
    };
    this.type = "course";
  }

  /**
   * Check the type of the URL
   * @param {string} url - The URL to check
   * @memberof Edraak
   * @method
   */
  checkType(url) {
    if (url.includes("specialization")) {
      this.type = "specialization";
    }
  }

  /**
   * Extract the programme from the data
   * @param {object} page - The Puppeteer page object
   * @returns {array} - The extracted programme
   * @memberof Edraak
   * @method
   * @async
   */
  async extractProgramme(page) {
    let programme = await super.extractMany(page, this.selectors.programme);
    if (programme.length === 0) {
      programme = await super.extractMany(page, this.selectors.altProgramme);
    }
    return programme;
  }

  /**
   * Switch to the specialization selectors
   * @memberof Edraak
   * @method
   */
  switchToSpecialization() {
    this.selectors.orga = '//img[@class="logoImg"]';
  }

  /**
   * Scrape the Edraak course data
   * @param {string} url - The URL of the Edraak course
   * @returns {object} - The scraped course data
   * @memberof Edraak
   * @method
   * @async
   * @override
   * @throws {object} - The error message
   */
  async scrape(url) {
    try {
      if (!(await super.checkURLExists(url))) {
        console.error("URL '" + url + "' does not exist");
        return;
      }
      var { browser, page } = await super.launchBrowser(url);

      const [title, orga, brief, animateur, programme] = await Promise.all([
        super.extractText(page, this.selectors.name),
        super
          .extractText(page, this.selectors.orga)
          .then((orga) =>
            orga
              ? orga
              : super.extractAttribute(page, this.selectors.orga, "alt")
          ),
        super
          .extractMany(page, this.selectors.brief)
          .then((brief) => brief.join("").trim()),
        super.extractText(page, this.selectors.animateur),
        this.extractProgramme(page, this.selectors.programme).then(
          (programme) => programme.map((prog) => prog.trim())
        ),
      ]);
      return {
        title,
        platform: this.platform,
        url,
        orga,
        brief,
        programme,
        duration: null,
        animateur,
        languages: ["english", "arabic"],
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

module.exports = Edraak;
