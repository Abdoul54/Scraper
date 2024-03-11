const fs = require("fs").promises; // Importing fs promises API
const saveDataToJSON = async (data) => {
  try {
    // Check if the file exists
    const fileData = await fs.readFile("course_data.json", "utf-8");
    let jsonData = JSON.parse(fileData);
    if (!Array.isArray(jsonData)) {
      throw new Error("Data in file is not an array");
    }
  } catch (error) {
    // If the file doesn't exist or is not valid JSON, create an empty array
    console.log("Creating a new JSON file.");
  }

  // Push the new data to the array
  jsonData.push(data);

  // Write the array to the JSON file
  await fs.writeFile("course_data.json", JSON.stringify(jsonData, null, 2));
  console.log("Data saved to course_data.json");
};

module.exports = {
  saveDataToJSON,
};
