const puppeteer = require("puppeteer");
const { saveDataToJSON } = require("./fs");

class Coursera {
  constructor(url) {
    this.url = url;
    this.selectors = {
      name: "//h1[@data-e2e='hero-title']",
      orga: "//*[@id='courses']/div/div/div/div[3]/div/div[2]/div[2]/div/div[2]/a/span",
      //*[@id='modules']/div/div/div/div[3]/div/div[2]/div[2]/div/div[2]/a/span
      brief:
        "//*[@id='courses']/div/div/div/div[1]/div/div/div/div[1]/div/div/div/div/p[1]/span/span",
      programme: "//*[@data-e2e='sdp-course-list-link']",
      animateur:
        '//*[@class="cds-9 css-1gjys39 cds-11 cds-grid-item cds-56 cds-78"]/div/div[2]/div/a[@data-track-component="hero_instructor"]/span',
      duration:
        "//*[@id='rendered-content']/div/main/section[2]/div/div/div[2]/div/div/section/div[2]/div[2]/div[1]",
      ratings:
        "//*[@id='rendered-content']/div/main/section[2]/div/div/div[2]/div/div/section/div[2]/div[1]/div[1]",
      languages: "//*[@role='dialog']/div[2]/div[2]/p[2]",
    };
    this.type = this.checkType(url);
  }

  switchToModules = (selectors) => {
    selectors.orga = selectors.orga.replace("courses", "modules");
    selectors.brief =
      "//*[@id='modules']/div/div/div/div[1]/div/div/div/div[1]/div/p[1]";
    selectors.programme =
      "//*[@id='modules']/div/div/div/div[1]/div/div/div/div[1]/div/p[2]";
    selectors.animateur =
      "//*[@id='modules']/div/div/div/div[3]/div/div[1]/div[2]/div/div[2]/div[1]/a/span";
  };
  checkType(url) {
    // Implementation of checkType function
    let result = url.includes("specializations")
      ? "specialization"
      : url.includes("learn")
      ? "module"
      : "certificate";
    if (result === "module") {
      this.switchToModules(this.selectors);
    }
    return result;
  }

  async extractText(page, xpath) {
    // Implementation of extractText function
    return await page.evaluate((xpath) => {
      const element = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      return element ? element.textContent.trim() : null;
    }, xpath);
  }

  async checkURLExists(url) {
    // Implementation of checkURLExists function
    try {
      const response = await fetch(url, { method: "HEAD" });
      return response.url === url && response.ok;
    } catch (error) {
      console.error("Error checking URL:", error);
      return false;
    }
  }

  async scrapeCourseData() {
    // Implementation of scrapeCourseData function
    let browser;
    let animateur;
    let languages;
    try {
      browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(this.url);

      if (
        await this.checkElementExistence(
          page,
          "xpath///div[2]/div/button/span/span"
        )
      ) {
        await page.click("xpath///div[2]/div/button/span/span");
        languages = await this.extractLanguages(page, this.selectors.languages);
        languages = languages.split(",").map((language) => language.trim());
      }

      if (
        await this.checkElementExistence(
          page,
          "xpath///div[3]/div/div[1]/button/span"
        )
      ) {
        await page.click("xpath///div[3]/div/div[1]/button/span");
        animateur = await this.extractAnimateur(page, this.selectors.animateur);
      }

      const [title, orga, brief, programme] = await Promise.all([
        this.extractText(page, this.selectors.name),
        this.extractText(page, this.selectors.orga),
        this.extractText(page, this.selectors.brief),
        this.extractProgramme(page, this.selectors.programme),
      ]);

      return {
        title,
        url: this.url,
        orga,
        type: this.type,
        brief,
        programme,
        animateur,
        languages,
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

  async extractLanguages(page, selector) {
    // Implementation of extractLanguages function
    try {
      const languages = await this.extractText(page, selector);
      if (languages) {
        return languages
          .split(",")
          .map((lang) => lang.trim())
          .join(", ");
      } else {
        throw new Error("No languages found");
      }
    } catch (error) {
      console.error("Error extracting languages:", error);
      throw error;
    }
  }

  async extractProgramme(page, xpath) {
    // Implementation of extractProgramme function
    return await page.evaluate((xpath) => {
      const iterator = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.ORDERED_NODE_ITERATOR_TYPE,
        null
      );
      let element = iterator.iterateNext();
      const texts = [];
      while (element) {
        texts.push(element.textContent.trim());
        element = iterator.iterateNext();
      }
      return texts;
    }, xpath);
  }

  async extractAnimateur(page, xpath) {
    // Implementation of extractAnimateur function
    return await page.evaluate((xpath) => {
      const iterator = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.ORDERED_NODE_ITERATOR_TYPE,
        null
      );
      let element = iterator.iterateNext();
      const texts = [];
      while (element) {
        if (!texts.includes(element.textContent.trim())) {
          texts.push(element.textContent.trim());
        }
        element = iterator.iterateNext();
      }
      return texts;
    }, xpath);
  }

  async checkElementExistence(page, xpath) {
    // Implementation of checkElementExistence function
    return await page.$(xpath);
  }
}

(async () => {
  const data = [];
  const urls = [
    "https://www.coursera.org/specializations/improve-english",
    "https://www.coursera.org/learn/project-management-basics",
    "https://www.coursera.org/professional-certificates/facebook-social-media-marketing",
  ];
  for (const url of urls) {
    let courseraModel = new Coursera(url);
    let course = await courseraModel.scrapeCourseData();
    data.push(course);
  }
  saveDataToJSON(data);
})();
