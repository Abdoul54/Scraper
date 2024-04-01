const Scraper = require("./Scraper");

class OpenSap extends Scraper {
  /**
   * Create a OpenSap scraper
   * @constructor
   * @memberof OpenSap
   * @method
   */
  constructor() {
    super("OpenSap");
    this.selectors = {
      name: '//div[@class="header-title"]',
      brief: '//div[@class="RenderedMarkdown"]/p[1]',
      programme: '//div[@class="RenderedMarkdown"]/p[4]',
      animateur: '//div[@id="teachers"]//div/h4/a/text()',
      duration: "",
      languages: '//span[@class="shortinfo"][2]/span[2]',
    };
  }

  /**
   * Extract the programme content and duration
   * @param {object} page - The page object
   * @returns {object} - The programme content and duration
   * @memberof OpenSap
   * @method
   * @async
   * @throws {object} - The error message
   */
  async extractProgrammeAndDuration(page) {
    try {
      const info = await page.$eval(
        "xpath///div[@class='RenderedMarkdown']",
        (el) => {
          return el.innerText.trim().split("\n");
        }
      );
      const programme = await this.extractCourseDetails(info, page);
      const duration = this.extractCourseDuration(info);
      return { programme, duration };
    } catch (error) {
      console.error("Error scraping course content:", error);
      return null;
    }
  }

  /**
   * Extract the languages
   * @param {object} page - The page object
   * @returns {array} - The languages
   * @memberof OpenSap
   * @method
   * @async
   */
  async extractLanguages(page) {
    const languages = [];
    const langs = await super
      .extractMany(page, this.selectors.languages)
      .then((langs) => langs.map((lang) => lang.toLowerCase()));
    if (langs.length === 0) return null;
    if (langs.some((element) => element.includes("english"))) {
      languages.push("english");
    }
    if (langs.some((element) => element.includes("french"))) {
      languages.push("french");
    }
    if (langs.some((element) => element.includes("arabic"))) {
      languages.push("arabic");
    }
    return languages;
  }

  /**
   * Calculate the course duration
   * @param {string} dur - The course duration
   * @param {string} pace - The course pace
   * @returns {string} - The course duration
   * @memberof OpenSap
   * @method
   */
  calculateCourseDuration(dur, pace) {
    if (!dur && pace && pace.includes("hours") && pace.includes("total")) {
      let hours = pace.match(/\d+(?= hours)/)[0];
      var duration = hours;
      return new String(duration).length === 1
        ? `0${duration}:00`
        : `${duration}:00`;
    } else {
      if (dur.match(/hour(s)?/) && dur.match(/week(s)?/)) {
        let weeks = dur.match(/\d+(?= week)/)[0];
        let hours = dur.match(/\d+(?= hours)/)[0];
        var duration = weeks * hours;
        return new String(duration).length === 1
          ? `0${duration}:00`
          : `${duration}:00`;
      } else {
        let weeks = dur.match(/\d+(?= week)/)[0];
        let hours = pace.match(/\d+(?= hours)/)[0];
        var duration = weeks * hours;
        return new String(duration).length === 1
          ? `0${duration}:00`
          : `${duration}:00`;
      }
    }
  }

  /**
   * Extract the course duration
   * @param {array} courseInfo - The course information
   * @returns {string} - The course duration
   * @memberof OpenSap
   * @method
   */
  extractCourseDuration(courseInfo) {
    const startIndex = courseInfo.indexOf("Course Characteristics");

    if (startIndex !== -1) {
      let endIndex = startIndex + 1;
      while (
        endIndex < courseInfo.length &&
        courseInfo[endIndex] !== "Course Content"
      ) {
        endIndex++;
      }

      const courseDetails = courseInfo.slice(startIndex + 1, endIndex);
      const durationIndex = courseDetails.findIndex((element) =>
        element.includes("Duration:")
      );
      const effortIndex = courseDetails.findIndex((element) =>
        element.includes("Effort:")
      );

      const duration =
        durationIndex !== -1
          ? courseDetails[durationIndex].split(":")[1].trim()
          : null;
      const effort =
        effortIndex !== -1
          ? courseDetails[effortIndex].split(":")[1].trim()
          : null;

      return this.calculateCourseDuration(duration, effort);
    } else {
      return '"Course Characteristics" section not found';
    }
  }

  /**
   * Extract the course details
   * @param {array} info - The course information
   * @param {object} page - The page object
   * @returns {array} - The course details
   * @memberof OpenSap
   * @method
   * @async
   */
  async extractCourseDetails(info, page) {
    const contentStartIndex = info.indexOf("Course Content");
    if (contentStartIndex === -1) {
      const courseContent = await page.$$eval(
        "xpath///ul[@class='list-unstyled']/li/h4",
        (items) =>
          items.map((item) => item.textContent.trim().replace(/:$/, ""))
      );
      return courseContent;
    }
    const contentEndIndex = info.indexOf("Target Audience");
    const courseContent = info.slice(contentStartIndex + 1, contentEndIndex);
    const filteredContent = courseContent.filter((item) => item.trim() !== "");
    return filteredContent;
  }

  /**
   * Scrape the OpenSap course data
   * @param {string} url - The URL of the OpenSap course
   * @returns {object} - The scraped course data
   * @memberof OpenSap
   * @method
   * @async
   * @throws {object} - The error message
   */
  async scrape(url) {
    try {
      var { browser, page } = await super.launchBrowser(url, true);

      const [title, brief, animateur, languages, { programme, duration }] =
        await Promise.all([
          super.extractText(page, this.selectors.name),
          super.extractText(page, this.selectors.brief),
          super
            .extractMany(page, this.selectors.animateur)
            .then((anim) => anim.filter((a, index) => index < 3)),
          this.extractLanguages(page, this.selectors.languages),
          this.extractProgrammeAndDuration(page),
        ]);

      return {
        title,
        platform: this.platform,
        url,
        orga: "OpenSap",
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

module.exports = OpenSap;
