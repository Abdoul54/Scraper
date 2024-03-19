const Scraper = require("./Scraper");

class EDX extends Scraper {
  constructor() {
    super("EDX");
    this.selectors = {
      name: '//div[@class="main-block__content course-hero__content"]//h1',
      // orga, //* Not available
      brief: '//div[@class="main-block__content course-hero__content"]//p[1]',
      programme:
        '//div[@class="course-about desktop course-info-content"]/div[4]/div/div[3]/div/div[2]/div/ul/li',
      duration: '//ul[@class="course-offers__details"]/li', //* specify the li
      animateur: '//h3[@class="unow-heading-4 mt-0"]',
      // languages, //* Always fr
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

      const duration = await super
        .extractMany(page, this.selectors.duration)
        .then((durations) =>
          durations
            .map((duration) => {
              if (duration.trim().includes("Durée")) {
                return duration.replace("Durée", "").trim();
              }
            })
            .filter(Boolean)
        );
      return duration;
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

// module.exports = Edraak;

const edXScraper = new EDX();
edXScraper
  .scrape(
    "https://www.unow.fr/formations/chatgpt-midjourney-les-intelligences-artificielles-au-service-de-la-formation/"
  )
  .then(console.log);
// edXScraper
//   .scrape("https://www.edx.org/learn/excel/ibm-analyzing-data-with-excel")
//   .then(console.log);
// edXScraper
//   .scrape(
//     "https://www.edx.org/learn/six-sigma/technische-universitat-munchen-six-sigma-analyze-improve-control"
//   )
//   .then(console.log);
