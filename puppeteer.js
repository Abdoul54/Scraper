const puppeteer = require("puppeteer");
const { saveDataToJSON } = require("./fs");

const url = "https://www.coursera.org/learn/project-management-basics";
/**
 * This object contains the XPath of the elements to extract from the Coursera course page.
 * @type {Object}
 * @property {string} name - The XPath of the course title.
 * @property {string} orga - The XPath of the organization that offers the course.
 * @property {string} brief - The XPath of the brief description of the course.
 * @property {string} programme - The XPath of the course program.
 * @property {string} animateur - The XPath of the course animator.
 * @property {string} duration - The XPath of the course duration.
 * @property {string} ratings - The XPath of the course ratings.
 * @property {string} debut - The XPath of the course debut date.
 * @property {string} languages - The XPath of the languages in which the course is available.
 */
const coursera = {
  name: "//*[@id='rendered-content']/div/main/section[2]/div/div/div[1]/div[1]/section/h1",
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
  languages: "//*[@class='cds-Dialog-dialog']/div[2]/div[2]/p[2]",
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
 * This function uses Puppeteer to scrape data from a given URL.
 *
 * @param {string} url - The URL of the webpage to scrape.
 * @returns {Promise<Object>} A promise that resolves to an object containing the scraped data.
 * The object has the following properties:
 * - title: The title of the course.
 * - orga: The organization that offers the course.
 * - brief: A brief description of the course.
 * - programme: The course program.
 * - animateur: The course animator.
 * - languages: The languages in which the course is available.
 *
 * @example
 * scrapeCourseData('https://www.coursera.org/learn/project-management-basics')
 *   .then(data => console.log(data));
 */
const scrapeCourseData = async (url) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  await page.click("#rendered-content > div > main > section.css-oe48t8 > div > div > div.cds-9.css-0.cds-11.cds-grid-item.cds-56.cds-80 > div.css-1psltl0 > section > div:nth-child(3) > div > button > span > span");

  await page.waitForSelector(coursera.languages);

  const [title, orga, brief, programme, animateur, languages] = await Promise.all([
    extractText(page, coursera.name),
    extractText(page, coursera.orga),
    extractText(page, coursera.brief),
    extractText(page, coursera.programme).then(programme => programme.replace(/\n+/g, ' ').replace(/\s+/g, ' ')),
    extractText(page, coursera.animateur),
    extractText(page, coursera.languages).then(languages => languages.split(',').map(lang => lang.trim())),
  ]);


  await browser.close();

  return { title, orga, brief, programme, animateur, languages };
};

scrapeCourseData(url).then(console.log);