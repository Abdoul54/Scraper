const Scraper = require("./Scraper");

class ClassCentral extends Scraper {
  constructor() {
    super("ClassCentral");
    this.selectors = {
      //      name: '//main[@*[starts-with(name(), "data-lookup-course")]]',
      //    orga: '//div[@class="provider"]/a',
      brief:
        '//div[@class="truncatable-area is-truncated wysiwyg text-1 line-wide"][1]',

      programme:
        '//div[@class="truncatable-area is-truncated wysiwyg text-1 line-wide"]/ul/li',
      duration: '//div[@id="details-contents"]/ul/li[5]/div[2]/span',
      animateur: '//*[@id="page-course"]/div[1]/main//div/section[3]/div[1]/p',
      languages: '//div[@id="details-contents"]/ul/li[7]/div[2]/span',
    };
  }

  async extractLanguages(page) {
    const languages = [];
    let langs = await super
      .extractText(page, this.selectors.languages)
      .then((langs) => langs.split(", ").map((lang) => lang.trim()))
      .catch(() => ["English"]);
    if (langs.includes("English")) {
      languages.push("english");
    }
    if (langs.includes("French")) {
      languages.push("french");
    }
    if (langs.includes("Arabic")) {
      languages.push("arabic");
    }
    return languages;
  }
  async extractDuration(page) {
    const duration = await super
      .extractText(page, this.selectors.duration)
      .then((duration) => {
        duration = duration.split("")[0].trim();
        return duration.length === 1 ? `0${duration}:00` : `${duration}:00`;
      });
    return duration;
  }
  async scrape(url) {
    try {
      var { browser, page } = await super.launchBrowser(url);

      const all = await super
        .extractAttribute(
          page,
          '//*[@id="btnProviderCoursePage"]',
          "data-track-props"
        )
        .then((all) => JSON.parse(all));

      const title = all["course_name"];
      const orga = all["course_institution"];
      const languages = all["course_language"];
      const [brief, programme, duration, animateur] = await Promise.all([
        super
          .extractText(page, this.selectors.brief)
          .then((brief) => brief.replace(/(\r\n|\n|\r)/gm, "").trim()),
        super.extractMany(page, this.selectors.programme),
        this.extractDuration(page),
        super.extractMany(page, this.selectors.animateur),
      ]);

      //   const languages = await this.extractLanguages(page);
      //   const brief = await super
      //     .extractText(page, this.selectors.brief)
      //     .then((brief) => brief.replace(/(\r\n|\n|\r)/gm, "").trim());
      //   const programme = await super.extractMany(page, this.selectors.programme);
      //   const duration = await this.extractDuration(page);
      //   const animateur = await super.extractMany(page, this.selectors.animateur);
      console.log({
        title,
        platform: this.platform,
        url,
        orga,
        brief,
        programme,
        duration,
        animateur,
        languages,
      });
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
let scraper = new ClassCentral();
// scraper.scrape(
//   "https://classcentral.com/course/independent-data-analysis-with-python-204189"
// );
scraper.scrape(
  "https://www.classcentral.com/course/google-analytics-for-beginners-98262"
);
// scraper.scrape("https://www.classcentral.com/course/journalism-6009");
