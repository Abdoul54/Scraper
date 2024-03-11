const puppeteer = require("puppeteer");

const url = "https://www.coursera.org/specializations/improve-english";

const coursera = {
  name: "//h1[@data-e2e='hero-title']",
  orga: "//*[@id='courses']/div/div/div/div[3]/div/div[2]/div[2]/div/div[2]/a/span",
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

const extractText = async (page, xpath) => {
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
};

const checkURLExists = async (url) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.url === url && response.ok;
  } catch (error) {
    console.error("Error checking URL:", error);
    return false;
  }
};

const scrapeCourseData = async (url) => {
  let browser;
  let animateur;
  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    if (checkElementExistence(page, "xpath///div[2]/div/button/span/span")) {
      await page.click("xpath///div[2]/div/button/span/span");
      languages = await extractLanguages(page, coursera.languages);
      languages = languages.split(",").map((language) => language.trim());
    }

    if (checkElementExistence(page, "xpath///div[3]/div/div[1]/button/span")) {
      await page.click("xpath///div[3]/div/div[1]/button/span");
      animateur = await extractAnimateur(page, coursera.animateur);
    }

    const [title, orga, brief, programme] = await Promise.all([
      extractText(page, coursera.name),
      extractText(page, coursera.orga),
      extractText(page, coursera.brief),
      extractProgramme(page, coursera.programme),
    ]);

    return {
      title,
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
};
async function extractLanguages(page, selector) {
  try {
    const languages = await extractText(page, selector);
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
scrapeCourseData(url).then((data) => {
  console.log(data);
});

const extractProgramme = async (page, xpath) => {
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
};

const extractAnimateur = async (page, xpath) => {
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
};

const checkElementExistence = async (page, xpath) => {
  return await page.$(xpath);
};
