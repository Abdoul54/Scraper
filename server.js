const express = require("express");
// const Coursera = require("./coursera");
// const OpenClassrooms = require("./OpenClassroom");
// const cors = require("cors");
// const FunMooc = require("./FunMooc");

const Coursera = require("./CourseraScraper");
const OpenClassrooms = require("./OpenClassroomsScraper");
const FunMooc = require("./FunMoocScraper");
const app = express();
const host = "0.0.0.0";
const port = 3000;

app.use(express.json());

/**
 * Route to scrape Coursera data
 * @param {string} url - The URL of the Coursera course
 * @returns {object} - The scraped course data
 * @throws {object} - The error message
 */
app.post("/api/scrape/coursera", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    const courseraScraper = new Coursera(url);
    const data = await courseraScraper.scrape();
    if (!data) {
      return res.status(404).json({ error: "Course data not found" });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to scrape Coursera data" });
  }
});

/**
 * Route to scrape OpenClassrooms data
 * @param {string} url - The URL of the OpenClassrooms course
 * @returns {object} - The scraped course data
 * @throws {object} - The error message
 */
app.post("/api/scrape/openclassrooms", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL parameter is required" });
    }
    const openClassroomsScraper = new OpenClassrooms();
    const data = await openClassroomsScraper.scrape(url);
    if (!data) {
      return res.status(404).json({ error: "Course data not found" });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to scrape OpenClassrooms data" });
  }
});

/**
 * Route to scrape Fun-Mooc data
 * @param {string} url - The URL of the Fun-Mooc course
 * @returns {object} - The scraped course data
 * @throws {object} - The error message
 */
app.post("/api/scrape/funmooc", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL parameter is required" });
    }
    const funMoocScraper = new FunMooc();
    const data = await funMoocScraper.scrape(url);
    if (!data) {
      return res.status(404).json({ error: "Course data not found" });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to scrape Fun-Mooc data" });
  }
});

app.listen(port, host, () => {
  console.log(`Server Is Running Successfully!`);
});
