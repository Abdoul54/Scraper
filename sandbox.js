const Scraper = require("./Scraper");
const langdetect = require("langdetect");

/**
 * FutureLearn scraper
 * @extends Scraper
 * @class
 */
class FutureLearn extends Scraper {
	/**
	 * Create a FutureLearn scraper
	 * @constructor
	 * @memberof FutureLearn
	 * @method
	 */
	constructor() {
		super("FutureLearn");
		this.selectors = {
			name: '//div[@id="section-page-header"]//div/h1',
			orga: '//section[@id="section-creators"]/div//div/h2',
			brief: '//section[@id="section-overview"]/div/div/div',
			programme:
				'//section[@id="section-syllabus"]//div/ul/li/div[2]/div/div/div/div/div/div/div/h3',
			altProgramme: '//section[@id="section-topics"]/div/div[2]/ul/li',
			duration: '//div[@id="sticky-banner-start"]/ul/li[1]/div[2]/span',
			altDuration:
				'//div[@id="section-page-header"]/div[3]/ul/li[1]/div[2]/span',
			pace: '//div[@id="sticky-banner-start"]/ul/li[3]/div[2]/span',
			altPace:
				'//div[@id="section-page-header"]/div[3]/ul/li[3]/div[2]/span',
			animateur: '//section[@id="section-educators"]//div/h3/a/span',
			languages: "",
		};
		this.type = "course";
	}

	/**
	 * Detect the language of the text
	 * @param {string} text - The text to detect the language of it
	 * @returns {array} - The detected languages
	 * @memberof EDX
	 * @method
	 */
	detectLanguage(text) {
		if (langdetect.detect(text)[0].lang === "fr") {
			return ["french"];
		}
		if (langdetect.detect(text)[0].lang === "en") {
			return ["english"];
		}
		if (langdetect.detect(text)[0].lang === "ar") {
			return ["arabic"];
		}
		return [];
	}

	/**
	 * Extract languages from the page
	 * @param {Object} page - The page object
	 * @returns {Array} The languages
	 * @memberof FutureLearn
	 * @method
	 * @async
	 */
	async scrape(url) {
		try {
			if (!(await super.checkURLExists(url))) {
				console.error("URL '" + url + "' does not exist");
				return;
			}
			var { browser, page } = await super.launchBrowser(url);
			const [title, orga, brief, programme, duration, pace, animateur] =
				await Promise.all([
					super.extractText(page, this.selectors.name),
					super.extractText(page, this.selectors.orga),
					super
						.extractMany(page, this.selectors.brief)
						.then((briefs) =>
							briefs.join("").replace(/\n/g, " ").trim()
						),
					super
						.extractMany(page, this.selectors.programme)
						.then((programme) =>
							programme.length > 0
								? programme.map((prog) => prog.trim())
								: super
										.extractMany(
											page,
											this.selectors.altProgramme
										)
										.then((altProgramme) =>
											altProgramme.map((prog) =>
												prog.trim()
											)
										)
						),
					super
						.extractText(page, this.selectors.duration)
						.then((duration) =>
							duration !== null
								? duration.split(" ")[0]
								: super
										.extractText(
											page,
											this.selectors.altDuration
										)
										.then(
											(duration) => duration.split(" ")[0]
										)
						),
					super
						.extractText(page, this.selectors.pace)
						.then((pace) =>
							pace
								? pace.split(" ")[0]
								: super
										.extractText(
											page,
											this.selectors.altPace
										)
										.then((pace) => pace.split(" ")[0])
						),
					super.extractMany(page, this.selectors.animateur),
				]);
			return {
				title,
				orga,
				url,
				brief,
				programme,
				duration:
					new String(pace * duration).length === 1
						? `0${pace * duration}:00`
						: `${pace * duration}:00`,
				animateur,
				languages: this.detectLanguage(brief),
			};
		} catch (error) {
			console.error("Error scraping course data:", error);
			return null;
		} finally {
			await browser.close();
		}
	}
}

let futureLearn = new FutureLearn();
futureLearn
	.scrape(
		"https://www.futurelearn.com/courses/harnessing-ai-in-marketing-and-communication"
	)
	.then(console.log);
