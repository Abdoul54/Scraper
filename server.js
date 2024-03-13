const express = require("express");
const Coursera = require("./coursera");
const OpenClassrooms = require("./OpenClassroom");
const cors = require("cors");
const FunMooc = require("./FunMooc");
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

/**
 * Scrape course data from Coursera
 * @param {string} url - URL of the course to scrape
 * @returns {Promise<object>} - Course data
 */
app.post("/api/coursera/scrape-course", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    const coursera = new Coursera(url);
    const courseData = await coursera.scrapeCourseData();

    if (!courseData) {
      return res.status(404).json({ error: "Course data not found" });
    }

    return res.json(courseData);
  } catch (error) {
    console.error("Error scraping course:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Scrape course data from OpenClassrooms
 * @param {string} url - URL of the course to scrape
 * @returns {Promise<object>} - Course data
 */
app.post("/api/openclassrooms/scrape-course", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    const openClassrooms = new OpenClassrooms();
    const courseData = await openClassrooms.scrapeCourseData(url);

    if (!courseData) {
      return res.status(404).json({ error: "Course data not found" });
    }

    return res.json(courseData);
  } catch (error) {
    console.error("Error scraping course:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Scrape course data from Fun-Mooc
 * @param {string} url - URL of the course to scrape
 * @returns {Promise<object>} - Course data
 */
app.post("/api/fun-mooc/scrape-course", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    const funMooc = new FunMooc();
    const courseData = await funMooc.scrapeCourseData(url);

    if (!courseData) {
      return res.status(404).json({ error: "Course data not found" });
    }

    return res.json(courseData);
  } catch (error) {
    console.error("Error scraping course:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});