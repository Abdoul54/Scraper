const puppeteer = require("puppeteer");
// const { saveDataToJSON } = require("./fs");

// const urls = [
//   "https://www.coursera.org/learn/project-management-basics",
//   "https://www.coursera.org/learn/project-management-foundations",
// ];

/**
 * This object contains the XPath of the elements to extract from the Coursera course page.
 * @type {Object}
 * @property {string} name - The XPath of the course title.
 * @property {string} orga - The XPath of the organization that offers th e course.
 * @property {string} brief - The XPath of the brief description of the course.
 * @property {string} programme - The XPath of the course program.
 * @property {string} animateur - The XPath of the course animator.
 * @property {string} duration - The XPath of the course duration.
 * @property {string} ratings - The XPath of the course ratings.
 * @property {string} debut - The XPath of the course debut date.
 * @property {string} languages - The XPath of the languages in which the course is available.
 */
const coursera = {
  name: "//h1[@data-e2e='hero-title']",
  orga: "//*[@id='modules']/div/div/div/div[3]/div/div[2]/div[2]/div/div[2]/a/span",
  brief: "//*[@id='modules']/div/div/div/div[1]/div/div/div/div[1]/div/p[1]",
  programme:
    "//*[@id='modules']/div/div/div/div[1]/div/div/div/div[1]/div/p[2]",
  animateur:
    "//*[@id='modules']/div/div/div/div[3]/div/div[1]/div[2]/div/div[2]/div[1]/a/span",
  duration:
    "//*[@id='rendered-content']/div/main/section[2]/div/div/div[2]/div/div/section/div[2]/div[2]/div[1]",
  ratings:
    "//*[@id='rendered-content']/div/main/section[2]/div/div/div[2]/div/div/section/div[2]/div[1]/div[1]",
  debut: null,
  languages: "//*[@role='dialog']/div[2]/div[2]/p[2]",
};

/**
 * This function uses Puppeteer to extract text content from a given XPath.
 * @param {Page} page - The Puppeteer page object.
 * @param {string} xpath - The XPath of the element to extract.
 * @returns {Promise<string>} A promise that resolves to the text content of the element.
 * If the element is not found, the promise resolves to null.
 * @example
 */
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

/**
 *
 * @param {url} url	URL of the webpage to check.
 * @returns {boolean}	A boolean indicating whether the URL exists.
 *
 */
const checkURLExists = async (url) => {
  console.log("Checking URL:", url);
  url = url.split("#")[0];
  console.log("URL after split:", url); 
  const response = await fetch(url, { method: "HEAD" });
  return response.url === url && response.ok;
};

/**
 * This function uses Puppeteer to scrape data from a given array of URLs.
 *
 * @param {string[]} urls - An array of URLs of the webpages to scrape.
 * @returns {Promise<Object>} A promise that resolves to an object containing the scraped data.
 * The object has the following properties:
 * - title: The title of the course.
 * - orga: The organization that offers the course.
 * - brief: A brief description of the course.
 * - programme: The course program.
 * - animateur: The course animator.
 * - languages: The languages in which the course is available.
 *
 */

const scrapeCourseData = async (urls) => {
  let browser;
  let languages;
  let notFound = [];
  let i = 0;
  let lanErrors = [];
  try {
    browser = await puppeteer.launch();
    const coursesData = [];
    for (const url of urls) {
      i++;
      languages = null;
      console.log(`Checking URL n°${i} : ${url}`);
      const pageExists = await checkURLExists(url);
      if (!pageExists) {
        console.log("URL does not exist:", url);
        notFound.push(url);
        continue; // Skip to the next URL
      }

      console.log("Scraping data from:", url);
      const page = await browser.newPage();
      await page.goto(url);

      // Check if the initial selector exists
      const selectorExists = await page.$(
        "xpath///div[2]/div/button/span/span"
      );
      console.log("selectorExists", selectorExists);

      //   div[2]/div/button/span/span
      //   div[2]/div/button/span/span
      if (selectorExists) {
        await page.click("xpath///div[2]/div/button/span/span")
        languages = await extractLanguages(page, coursera.languages);
        Languages= languages.split(",").map((language) => language.trim())
      }

      const [title, orga, brief, programme, animateur] = await Promise.all([
        extractText(page, coursera.name),
        extractText(page, coursera.orga),
        extractText(page, coursera.brief),
        extractText(page, coursera.programme).then((programme) =>
          programme.replace(/\n+/g, " ").replace(/\s+/g, " ")
        ),
        extractText(page, coursera.animateur),
      ]);

      page.close();
      coursesData.push({
        title,
        url,
        orga,
        brief,
        programme,
        animateur,
        languages,
      });
    }

    return coursesData;
  } catch (error) {
    console.error("Error scraping courses:", error);
  } finally {
    if (browser) {
      await browser.close();
      console.log("URLs not found or no longer exist: ", notFound);
      console.log("Errors extracting languages: ", lanErrors);
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

module.exports = { scrapeCourseData };
