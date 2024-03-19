const Scraper = require("./Scraper");

class Unow extends Scraper {
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
                return duration.replace("Durée", "").trim();
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
        duration,
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
