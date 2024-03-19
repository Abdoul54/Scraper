// //! courses
// const selectors = {};

// //! specializations
// const selectorss = {
//   name,
//   orga: '//img[@class="logoImg"]', //* Get The Alt
//   brief,
//   programme, //* Does not exist
//   duration,
//   animateur,
//   languages, //* en/ar
// };
const Scraper = require("./Scraper");

class Edraak extends Scraper {
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
  checkType(url) {
    if (url.includes("specialization")) {
      this.type = "specialization";
    }
  }

  async extractProgramme(page) {
    let programme = await super.extractMany(page, this.selectors.programme);
    if (programme.length === 0) {
      programme = await super.extractMany(page, this.selectors.altProgramme);
    }
    return programme;
  }
  switchToSpecialization() {
    this.selectors.orga = '//img[@class="logoImg"]';
  }
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
