const puppeteer = require("puppeteer");

const url = "https://www.coursera.org/learn/project-management-basics";

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

const scrapeCourseData = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  const courseData = await page.evaluate((coursera) => {
    const title =
      document.evaluate(
        coursera.name,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue?.textContent || "Title not found";
    const orga =
      document.evaluate(
        coursera.orga,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue?.textContent || "Organisation not found";
    const brief =
      document.evaluate(
        coursera.brief,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue?.textContent || "Brief not found";
    const programme =
      document.evaluate(
        coursera.programme,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue?.textContent || "Programme not found";
    const animateur =
      document.evaluate(
        coursera.animateur,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue?.textContent || "Animateur not found";

    const modules = [];
    // const modules = document.querySelectorAll(coursera.modules);


    const skills = [];
    document.querySelectorAll(".css-yk0mzy > .css-0").forEach((item) => {
      const skillName = item.querySelector("a").textContent.trim();
      skills.push(skillName);
    });

    for (let i = 1; i < 5; i++) {
      let module = `//*[@id="cds-react-aria-${i}8"]/div[1]/button/span/span[1]/span[1]`;
      const moduleName =
        document.evaluate(
          `${module}/h3`,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue?.textContent || null;
      const moduleDuration =
        document.evaluate(
          `${module}/div/span[3]/span`,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue?.textContent || null;
      const moduleAccordion = `//*[@id="cds-react-aria-${i}8-accordion-panel"]/div/div/div/p`;
      const moduleVideos =
        document.evaluate(
          `${moduleAccordion}/span[1]/span`,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue?.textContent || null;
      `${moduleAccordion}/span[1]/span`;
      const moduleReadings =
        document.evaluate(
          `${moduleAccordion}/span[2]/span`,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue?.textContent || null;
      const moduleQuizzes =
        document.evaluate(
          `${moduleAccordion}/span[3]/span`,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue?.textContent || null;
      const moduleDiscussionPrompt =
        document.evaluate(
          `${moduleAccordion}/span[4]/span`,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue?.textContent || null;
      const modulePlugin =
        document.evaluate(
          `${moduleAccordion}/span[5]/span`,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue?.textContent || null;
      const moduleData = {
        name: moduleName,
        duration: moduleDuration,
        videos: moduleVideos,
        readings: moduleReadings,
        quizzes: moduleQuizzes,
		discussionPrompt: moduleDiscussionPrompt,
		plugin: modulePlugin
      };
      modules.push(moduleData);
    }

    return { title, orga, brief, programme, animateur, modules, skills };
  }, coursera);

  console.log(courseData);

  await browser.close();
};

scrapeCourseData();
