const express = require("express");
const Coursera = require("./CourseraScraper");
const OpenClassrooms = require("./OpenClassroomsScraper");
const FunMooc = require("./FunMoocScraper");
const Edraak = require("./EdraakScraper");
const Edx = require("./EdxScraper");
const Unow = require("./UnowScraper");
const FutureLearn = require("./FutureLearnScraper");
const app = express();
const host = "0.0.0.0";
const port = 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log("========================================");
  console.log("Request received");
  console.log(`Request received at ${new Date().toLocaleString()}`);
  console.log(
    "Client IP:",
    req.headers["x-forwarded-for"] || req.connection.remoteAddress
  );
  console.log("Request URL:", req.url);
  console.log("Request Method:", req.method);
  console.log("Request Parameters:", req.params);
  console.log("Query Parameters:", req.query);
  console.log("Request Body:", req.body);
  console.log("Response Status Code:", res.statusCode);
  next();
});

/**
 * Route to scrape Coursera data
 * @param {string} url - The URL of the Coursera course
 * @returns {object} - The scraped course data
 * @throws {object} - The error message
 * @async
 */
app.post("/api/scrape/coursera", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "URL parameter is required" });
    }

    const courseraScraper = new Coursera(url);
    const data = await courseraScraper.scrape();
    if (!data) {
      return res.status(404).json({ message: "Course data not found" });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to scrape Coursera data", error });
  }
});

/**
 * Route to scrape OpenClassrooms data
 * @param {string} url - The URL of the OpenClassrooms course
 * @returns {object} - The scraped course data
 * @throws {object} - The error message
 * @async
 */
app.post("/api/scrape/openclassrooms", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "URL parameter is required" });
    }
    const openClassroomsScraper = new OpenClassrooms();
    const data = await openClassroomsScraper.scrape(url);
    if (!data) {
      return res.status(404).json({ message: "Course data not found" });
    }
    res.json(data);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to scrape OpenClassrooms data", error });
  }
});

/**
 * Route to scrape Fun-Mooc data
 * @param {string} url - The URL of the Fun-Mooc course
 * @returns {object} - The scraped course data
 * @throws {object} - The error message
 * @async
 */
app.post("/api/scrape/funmooc", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "URL parameter is required" });
    }
    const funMoocScraper = new FunMooc();
    const data = await funMoocScraper.scrape(url);
    if (!data) {
      return res.status(404).json({ message: "Course data not found" });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to scrape Fun-Mooc data", error });
  }
});

/**
 * Route to scrape Edraak data
 * @param {string} url - The URL of the Edraak course
 * @returns {object} - The scraped course data
 * @throws {object} - The error message
 * @async
 */
app.post("/api/scrape/edraak", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "URL parameter is required" });
    }
    const edraakScraper = new Edraak();
    const data = await edraakScraper.scrape(url);
    if (!data) {
      return res.status(404).json({ message: "Course data not found" });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to scrape Edraak data", error });
  }
});

/**
 * Route to scrape Edx data
 * @param {string} url - The URL of the Edx course
 * @returns {object} - The scraped course data
 * @throws {object} - The error message
 * @async
 */
app.post("/api/scrape/edx", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "URL parameter is required" });
    }
    const edxScraper = new Edx();
    const data = await edxScraper.scrape(url);
    if (!data) {
      return res.status(404).json({ message: "Course data not found" });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to scrape Edx data", error });
  }
});

/**
 * Route to scrape Unow data
 * @param {string} url - The URL of the Unow course
 * @returns {object} - The scraped course data
 * @throws {object} - The error message
 * @async
 */
app.post("/api/scrape/unow", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "URL parameter is required" });
    }
    const unowScraper = new Unow();
    const data = await unowScraper.scrape(url);
    if (!data) {
      return res.status(404).json({ message: "Course data not found" });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to scrape Unow data", error });
  }
});

/**
 * Route to scrape FutureLearn data
 * @param {string} url - The URL of the FutureLearn course
 * @returns {object} - The scraped course data
 * @throws {object} - The error message
 * @async
 */
app.post("/api/scrape/futurelearn", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "URL parameter is required" });
    }
    const futureLearnScraper = new FutureLearn();
    const data = await futureLearnScraper.scrape(url);
    if (!data) {
      return res.status(404).json({ message: "Course data not found" });
    }
    res.json(data);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to scrape FutureLearn data", error });
  }
});

//! ********************** HEALTH CHECK ROUTES *********************** */

/**
 * Route to test the health of the server
 * @returns {string} - The server status
 * @throws {object} - The error message
 */
app.get("/health", async (req, res) => {
  try {
    res.send("<h1>IT IS WORKING</h1>");
  } catch (error) {
    res.status(500).json({ message: "IT IS NOT WORKING" });
  }
});

/**
 * Route to test the health of the API
 * @returns {object} - The API status
 * @throws {object} - The error message
 */
app.get("/api/health", async (req, res) => {
  try {
    res.status(200).json({ message: "API is working" });
  } catch (error) {
    res.status(500).json({ message: "API is not working" });
  }
});

app.listen(port, host, () => {
  console.log(`Server Is Running Successfully!`);
});
