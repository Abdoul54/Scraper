const puppeteer = require("puppeteer");

class FunMoocScraper {
  constructor() {
    this.openClassrooms = {
      name: "//h1[@class='subheader__title']", //* Good
      orga: "//a/meta[@property='name']", //* Good
      brief:
        "//*[@id='site-content']/div[2]/div[1]/div/div[1]/div[1]/div/div/p", //? Get all the <p> elements
      programme: "//*[@id='site-content']/div[2]/div[1]/div/div[1]/div[2]/section/div/ul/li/div/button",
      animateur: "//h3[@class='person-glimpse__title']",
	  languages: "//*[@id='site-content']/div[1]/div[2]/div/div[1]/div[3]/div[2]/ul/div/li/span"
    };
  }

  async extractText(page, xpath) {
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

  async extractMany(page, xpath) {
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

  async extractAttributeFromAll(page, xpath, attributeName) {
    return await page.evaluate(
      (xpath, attributeName) => {
        const elements = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );
        const attributes = [];
        for (let i = 0; i < elements.snapshotLength; i++) {
          const element = elements.snapshotItem(i);
          const attribute = element.getAttribute(attributeName);
          if (attribute) {
            attributes.push(attribute);
          }
        }
        return attributes;
      },
      xpath,
      attributeName
    );
  }

  async checkURLExists(url) {
    try {
      const parsedURL = new URL(url);
      url = `${parsedURL.origin}${parsedURL.pathname}${parsedURL.search}`;
      const response = await fetch(url, { method: "HEAD" });

      return (
        parsedURL.pathname === new URL(response.url).pathname && response.ok
      );
    } catch (error) {
      console.error("Error checking URL:", error);
      return false;
    }
  }

  async scrapeCourseData(url) {
    let browser;
    let languages;
    if (!(await this.checkURLExists(url))) {
      console.error("URL '" + url + "' does not exist");
      return;
    }
    try {
      browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url);

      const [title, orga, brief, animateur, programme] = await Promise.all([
        this.extractText(page, this.openClassrooms.name),
        this.extractAttributeFromAll(page, this.openClassrooms.orga, "content"),
        this.extractMany(page, this.openClassrooms.brief).then((brief) =>
          brief.join(" ")
        ),
        this.extractMany(page, this.openClassrooms.animateur),
        this.extractText(page, this.openClassrooms.programme),
      ]);

      return {
        title,
        url,
        orga,
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
}

let scraper = new FunMoocScraper();

scraper
  .scrapeCourseData(
    "https://www.fun-mooc.fr/fr/cours/orisat-teledetection-des-risques-naturels/"
  )
  .then((data) => {
    console.log(data);
  });

//	!  buttons    //section/div/ul/li/div/button
//	!  subbuttons //section/div/ul/li/div/ul/li/div/button
