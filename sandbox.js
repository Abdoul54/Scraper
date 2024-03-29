const langdetect = require("langdetect");
const Scraper = require("./Scrapers/Scraper");

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
      brief: '//div[@class="RenderedMarkdown"]/p[1]', //* Should be limited
      programme: '//div[@class="RenderedMarkdown"]/p[4]',
      animateur: '//div[@id="teachers"]//div/h4/a/text()', //* Should be limited
      duration: "", //* not provided
      languages: '//span[@class="shortinfo"][2]/span[2]', //* Shoulf be cleaned
    };
  }
  //*[@id="egc2"]/div/div[2]/div[1]/div[1]/div/ul/li[2]
  //*[@id="s4h36"]/div/div[2]/div[1]/div[1]/div/ul[2]/li[2]
  /**
   * Convert durations to HH:MM format
   * @param {array} durations - The durations to convert
   * @returns {array} - The durations in HH:MM format
   * @memberof OpenSap
   * @method
   */
  convertToHHMM(input) {
    if (input.match(/m(s)?|min(s)?/)) {
      input = input.replace(/m|min(s)?/, "");
      let minutes = parseInt(input);
      minutes = minutes < 10 ? `00:0${minutes}` : `00:${minutes}`;
      return minutes;
    } else {
      input = input.replace(/hrs/, "");
      let hours, minutes;
      if (input.includes(".")) {
        hours = Math.floor(parseFloat(input));
        minutes = Math.round((parseFloat(input) - hours) * 60);
      } else {
        hours = parseInt(input);
        minutes = 0;
      }
      hours = hours < 10 ? `0${hours}` : hours;
      minutes = minutes < 10 ? `0${minutes}` : minutes;
      input = `${hours}:${minutes}`;
      return input;
    }
  }

  /**
   * Extract the programme content
   * @param {object} page - The page object
   * @returns {object} - The programme content
   * @throws {object} - The error message
   * @memberof PluralSight
   * @method
   * @async
   */
  async extractProgrammeAndDuration(page) {
    try {
      const info = await page.$eval(
        "xpath///div[@class='RenderedMarkdown']",
        (el) => {
          return el.innerText.trim().split("\n");
        }
      );
      const programme = this.extractCourseDetails(info);
      const duration = this.extractCourseDuration(info);
      return { programme, duration };
    } catch (error) {
      console.error("Error scraping course content:", error);
      return null;
    }
  }

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

  calculateCourseDuration(dur, pace) {
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

  extractCourseDetails(info) {
    const contentStartIndex = info.indexOf("Course Content");
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

let openSapScraper = new OpenSap();

// openSapScraper.scrape("https://open.sap.com/courses/s4h36").then(console.log);
openSapScraper.scrape("https://open.sap.com/courses/egc2").then(console.log);
