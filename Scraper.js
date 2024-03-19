const puppeteer = require("puppeteer");

class Scraper {
  constructor(platform) {
    this.platform = platform;
  }

  async launchBrowser(url) {
    const browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--single-process",
        "--no-zygote",
      ],
    });
    const page = await browser.newPage();
    await page.goto(url);
    return { browser, page };
  }
  async closeBrowser(browser) {
    await browser.close();
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

  async extractAttribute(page, xpath, attributeName) {
    return await page.evaluate(
      (xpath, attributeName) => {
        const element = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        return element ? element.getAttribute(attributeName) : null;
      },
      xpath,
      attributeName
    );
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

  async checkElementExistence(page, xpath) {
    return await page.$(xpath);
  }
}
module.exports = Scraper;
