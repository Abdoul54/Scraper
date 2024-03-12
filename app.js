// // const { scrapeCourseData } = require("./sandbox");


// import { saveDataToJSON } from "./fs";

// // courseraUrls = [
// //   "https://www.coursera.org/learn/learning-how-to-learn",
// //   "https://www.coursera.org/learn/financial-markets-global",
// //   "https://www.coursera.org/learn/wharton-quantitative-modeling",
// //   "https://www.coursera.org/learn/wharton-business-financial-modeling",
// // ];

// let urls = [
//   "https://www.coursera.org/learn/project-management-basics?ranMID=40328&ranEAID=SAyYsTvLiGQ&ranSiteID=SAyYsTvLiGQ-.UeddiBTFEfLzpC1YIEX0Q&siteID=SAyYsTvLiGQ-.UeddiBTFEfLzpC1YIEX0Q&utm_content=10&utm_medium=partners&utm_source=linkshare&utm_campaign=SAyYsTvLiGQ",
//   "https://www.coursera.org/learn/uva-darden-project-management",

//   "https://www.coursera.org/learn/work-smarter-not-harder?ranMID=40328&ranEAID=SAyYsTvLiGQ&ranSiteID=SAyYsTvLiGQ-INShql6MNOihGJfSaUXR.w&siteID=SAyYsTvLiGQ-INShql6MNOihGJfSaUXR.w&utm_content=10&utm_medium=partners&utm_source=linkshare&utm_campaign=SAyYsTvLiGQ",
//   "https://www.coursera.org/learn/problem-solving#about",
//   "https://www.coursera.org/learn/work-smarter-not-harder",
//   "https://www.coursera.org/learn/problem-solving",
//   "https://www.coursera.org/learn/management-leadership-english",
//   "https://www.coursera.org/learn/emotional-intelligence-in-leadership-fr",
//   "https://www.coursera.org/learn/strategic-management?specialization=strategic-management",
//   "https://www.coursera.org/learn/smart-cities",
//   "https://www.coursera.org/learn/infographic-design",
//   "https://www.coursera.org/learn/speak-english-professionally",
//   "https://www.coursera.org/learn/data-structures-design-patterns",
//   "https://www.coursera.org/learn/uva-darden-bcg-pricing-strategy-customer-value?ranMID=40328&ranEAID=7bhGe75fAQ8&ranSiteID=7bhGe75fAQ8-hRivSgiDrXXPjivYsaQhUw&siteID=7bhGe75fAQ8-hRivSgiDrXXPjivYsaQhUw&utm_content=15&utm_medium=partners&utm_source=linkshare&utm_campaign=7bhGe75fAQ8",
//   "https://www.coursera.org/learn/critical-management",
//   "https://www.coursera.org/learn/uva-darden-bcg-pricing-strategy-cost-economics",
//   "https://www.coursera.org/learn/correccion-estilo-variaciones",
//   "https://www.coursera.org/learn/copyright-for-multimedia",
//   "https://www.coursera.org/learn/studying-cities-social-science-methods-for-urban-research",
//   "https://www.coursera.org/learn/supply-chain-logistics?ranMID=40328&ranEAID=7bhGe75fAQ8&ranSiteID=7bhGe75fAQ8-GcgZubi0_mfgQJh.._TS1Q&siteID=7bhGe75fAQ8-GcgZubi0_mfgQJh.._TS1Q&utm_content=15&utm_medium=partners&utm_source=linkshare&utm_campaign=7bhGe75fAQ8",
//   "https://www.coursera.org/learn/supply-chain-principles",
// ];
// // Usage example
// scrapeCourseData(urls)
//   .then((data) => {
//     saveDataToJSON(data);
//   })
//   .catch((error) => {
//     console.error("Error scraping courses:", error);
//   });
// // "https://www.coursera.org/specializations/become-a-journalist",
// // "https://www.coursera.org/specializations/strategic-management?action=enroll",


const langdetect = require('langdetect');

const text = "Volcans, glaciers, mouvements de terrain, failles : autant d’objets naturels qui peuvent constituer un risque fort pour les populations et les infrastructures. Plus de 4 milliards de personnes ont ainsi été affectées par une catastrophe naturelle au cours des deux dernières décennies et le rapport du GIEC pointe un très probable accroissement des risques naturels en lien avec les changements climatiques actuels. Mais peut-on détecter les zones à risques ? Comprendre la physique des aléas ? Peut-on surveiller l’activité de la Terre ? Anticiper des catastrophes ?"; // Your text here

const detectedLanguage = langdetect.detect(text);

console.log(detectedLanguage);
