const express = require("express");
const cron = require('node-cron')
const nodemailer = require('nodemailer');
const app = express();
const host = "0.0.0.0";
const port = 3000;
const requests = []
// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to log requests
app.use((req, res, next) => {
  requests.push({ "url": req.url, "method": req.method, "body": req.body, "query": req.query, "params": req.params, "timestamp": new Date().toLocaleString(), "ip address": req.headers["x-forwarded-for"] || req.connection.remoteAddress })
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
  next();
});

/**
 * Route to scrape a course from a given URL
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {object} Scraper - The scraper object
 * @returns {object} - The scraped course data
 * @throws {object} - The error message
 * @async
 */
async function scrapeCourse(req, res, Scraper) {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "URL parameter is required" });
    }

    const scraper = new Scraper();
    const data = await scraper.scrape(url);
    if (!data) {
      return res.status(404).json({ message: "Course data not found" });
    }
    res.json(data);
  } catch (error) {
    console.error("Error scraping course:", error);
    res.status(500).json({ message: "Failed to scrape course data" });
  }
}

// List of scrapers
const scrapers = [
  "Coursera",
  "OpenClassrooms",
  "FunMooc",
  "Edraak",
  "Edx",
  "Unow",
  "FutureLearn",
  "Udemy",
  "PluralSight",
  "SkillShop",
  "OpenSap",
  "ClassCentral",
];

// Dynamically create routes for each scraper
for (const scraper of scrapers) {
  const Scraper = require(`./Scrapers/${scraper}Scraper`);
  app.post(
    `/api/scrape/${scraper.toLowerCase()}`,
    async (req, res) => await scrapeCourse(req, res, Scraper)
  );
}

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
cron.schedule('0 */6 * * *', () => {
  try {
    const requestsText = requests.map(req => JSON.stringify(req)).join('\n\n');
    sendEmail(requestsText);
    console.log('Requests Email has been sent!');
  } catch (error) {
    console.error("Error sending email:", error);
  }
});

/**
 * Function to send an email with the requests
 */
function sendEmail(text) {

  // Configure transporter (replace with your credentials)
  var transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "7f49ae0f369f1c",
      pass: "6e82c5064af227"
    }
  });

  // Message options
  const mailOptions = {
    from: 'scraper@email.com',
    to: 'molscraper@email.com',
    subject: 'Requests in the last 6 hours',
    text: text
  };

  // Send email
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

app.listen(port, host, () => {
  console.log(`Server Is Running Successfully!`);
});

