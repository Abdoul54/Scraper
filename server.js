const express = require("express");
const Coursera = require("./Coursera");
const OpenClassrooms = require("./OpenClassroom");

const app = express();
const port = 3000;
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/api/coursera/scrape-course", async (req, res) => {
  try {
    const { url } = req.query;

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


app.get('/api/openclassrooms/scrape-course', async (req, res) => {
    try {
      const { url } = req.query;

      console.log(url);
  
      if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
      }
  
      const openClassrooms = new OpenClassrooms();
      const courseData = await openClassrooms.scrapeCourseData(url);
  
      if (!courseData) {
        return res.status(404).json({ error: 'Course data not found' });
      }
  
      return res.json(courseData);
    } catch (error) {
      console.error('Error scraping course:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
