const puppeteer = require("puppeteer");
const { saveDataToJSON } = require("./fs");

//const url = "https://www.coursera.org/learn/project-management-basics";

const coursera = {
  name: "//*[@id='rendered-content']/div/main/section[2]/div/div/div[1]/div[1]/section/h1",
  orga: "//*[@id='modules']/div/div/div/div[3]/div/div[2]/div[2]/div/div[2]/a/span",
  brief: "//*[@id='modules']/div/div/div/div[1]/div/div/div/div[1]/div/p[1]",
  programme:
    "//*[@id='modules']/div/div/div/div[1]/div/div/div/div[1]/div/p[2]",
  animateur:
    "//*[@id='modules']/div/div/div/div[3]/div/div[1]/div[2]/div/div[2]/div[1]/a/span",
  modules: "#modules > div > div > div > div:nth-child(2) > div > div > div",
  duration:
    "//*[@id='rendered-content']/div/main/section[2]/div/div/div[2]/div/div/section/div[2]/div[2]/div[1]",
  ratings:
    "//*[@id='rendered-content']/div/main/section[2]/div/div/div[2]/div/div/section/div[2]/div[1]/div[1]",
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

const extractModulesData = async (page, moduleXPath, index) => {
  const moduleName = await extractText(
    page,
    `${moduleXPath}/div[1]/button/span/span[1]/span[1]/h3`
  );
  const moduleDuration = await extractText(
    page,
    `${moduleXPath}/div[1]/button/span/span[1]/span[1]/div/span[3]/span`
  );
  moduleData = await extractModuleData(page, index);
  return {
    name: moduleName,
    duration: moduleDuration,
    videos: moduleData.videos,
    readings: moduleData.readings,
    quizzes: moduleData.quizzes,
    discussionPrompt: moduleData.discussionPrompt,
    plugin: moduleData.plugin,
  };
};

const extractModuleData = async (page, index) => {
  const moduleXPath = `//*[@id="cds-react-aria-${index}8-accordion-panel"]/div/div/div/p`;
  /html/body/div[2]/div/main/div[5]/div/div/div/div[2]/div/div/div/div[2]/div/div/div/div[1]/button/span/span[1]/span[1]/h3
  /html/body/div[2]/div/main/div[5]/div/div/div/div[2]/div/div/div/div[1]/div/div/div/div[1]/button/span/span[1]/span[1]/div/span[1]
  const moduleVideos = await extractText(page, `${moduleXPath}/span[1]/span`);
  const moduleReadings = await extractText(page, `${moduleXPath}/span[2]/span`);
  const moduleQuizzes = await extractText(page, `${moduleXPath}/span[3]/span`);
  const moduleDiscussionPrompt = await extractText(
    page,
    `${moduleXPath}/span[4]/span`
  );
  const modulePlugin = await extractText(page, `${moduleXPath}/span[5]/span`);
  return {
    videos: moduleVideos,
    readings: moduleReadings,
    quizzes: moduleQuizzes,
    discussionPrompt: moduleDiscussionPrompt,
    plugin: modulePlugin,
  };
};

const scrapeCourseData = async (urls) => {
  const browser = await puppeteer.launch();
  for (const url of urls) {
    const page = await browser.newPage();
    await page.goto(url);

    const title = await extractText(page, coursera.name);
    const orga = await extractText(page, coursera.orga);
    const brief = await extractText(page, coursera.brief);
    const programme = await extractText(page, coursera.programme);
    const animateur = await extractText(page, coursera.animateur);

    const modules = [];
    for (let i = 1; i < 5; i++) {
      const moduleXPath = `//*[@id="cds-react-aria-${i}8"]`;
      const moduleData = await extractModulesData(page, moduleXPath, i);
      modules.push(moduleData);
    }

    saveDataToJSON({ title, orga, brief, programme, animateur, modules });

    await page.close();
  }
  await browser.close();
};

module.exports = {
  scrapeCourseData,
};
