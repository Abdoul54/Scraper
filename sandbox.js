var courseraSelectors = {
  name: "//h1[@data-e2e='hero-title']",
  orga: "//*[@id='courses']/div/div/div/div[3]/div/div[2]/div[2]/div/div[2]/a/span",
  brief:
  "//*[@id='courses']/div/div/div/div[1]/div/div/div/div[1]/div/div/div/div/p[1]/span/span",
  programme: "//*[@data-e2e='sdp-course-list-link']",
  animateur:
  '//*[@class="cds-9 css-1gjys39 cds-11 cds-grid-item cds-56 cds-78"]/div/div[2]/div/a[@data-track-component="hero_instructor"]/span',
  duration:
  "//*[@id='rendered-content']/div/main/section[2]/div/div/div[2]/div/div/section/div[2]/div[2]/div[1]",
  ratings:
  "//*[@id='rendered-content']/div/main/section[2]/div/div/div[2]/div/div/section/div[2]/div[1]/div[1]",
  languages: "//*[@role='dialog']/div[2]/div[2]/p[2]",
};

switchToModules(courseraSelectors);
console.log(courseraSelectors);