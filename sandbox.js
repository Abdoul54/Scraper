const axios = require("axios");
axios
  .get("https://www.coursera.org/learn/emotional-intelligence-in-leadership-fr")
  .then(function (response) {
    console.log(response.path);
  })
  .catch(function (error) {
    console.warn(error);
  });
