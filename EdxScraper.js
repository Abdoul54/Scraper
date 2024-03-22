const Scraper = require("./Scraper");
const langdetect = require("langdetect");
/**
 * EDX scraper
 * @extends Scraper
 * @class
 */
class EDX extends Scraper {
	/**
	 * Create an EDX scraper
	 * @constructor
	 * @memberof EDX
	 * @method
	 */
	constructor() {
		super("EDX");
		this.selectors = {
			name: '//div[@class="course-about desktop course-info-content"]//div[1]/h1',
			orga: '//div[@class="course-about desktop course-info-content"]//div[1]/ul/li[1]/a',
			brief: '//div[@class="mt-2 lead-sm html-data"]',
			programme: '//div[@class="mt-2 html-data"]/ul/li',
			altProgramme: '//div[@class="mt-2 html-data"]/p[1]',
			altProgramme2: '//div[@class="mt-2 html-data"]/ol/li',
			duration:
				'//div[@class="course-about desktop course-info-content"]/div[2]/div/div[1]/div/div/div[1]/div/div[1]',
			pace: '//div[@class="course-about desktop course-info-content"]/div[2]/div/div[1]/div/div/div[1]/div/div[2]',
			animateur:
				'//div[@class="instructor-card px-4 py-3.5 rounded"]/div/h3',
			languages:
				'//div[@class="course-about desktop course-info-content"]/div[4]/div/div[2]/div/div/div[2]/ul/li[1]',
		};
		this.type = "course";
	}

	/**
	 * Check the type of the URL
	 * @param {string} url - The URL of the EDX course
	 * @memberof EDX
	 * @method
	 */
	checkType(url) {
		if (url.includes("certificates")) {
			this.type = "certificate";
		}
		this.switchSelectors();
	}

	/**
	 * Switch the selectors based on the type of the course
	 * @memberof EDX
	 * @method
	 */
	switchSelectors() {
		if (this.type === "certificate") {
			this.selectors.name = '//div[@class="title"]';
			this.selectors.orga = '//div[@class="institution"]';
			this.selectors.brief = '//div[@class="overview-info"]/p';
			this.selectors.programme = '//li[@class="bullet-point mb-2"]';
			this.selectors.duration =
				'//div[@class="program-stat"][3]/div[@class="details"]/div[@class="main"]';
			this.selectors.pace =
				'//div[@class="program-stat"][3]/div[@class="details"]/div[@class="secondary"]';
			this.selectors.animateur = '//a[@class="name font-weight-bold"]';
		}
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
	 * Extract the languages and organization from the data
	 * @param {object} page - The Puppeteer page object
	 * @returns {object} - The extracted languages and organization
	 * @memberof EDX
	 * @method
	 * @async
	 */
	async extractLanguagesAndOrga(page) {
		try {
			let elements = await page.$$(
				'xpath///div[@class="course-about desktop course-info-content"]/div[4]/div//ul/li'
			);

			let data = {};
			data["languages"] = [];
			for (let element of elements) {
				let value = await element.evaluate((el) => el.textContent);
				if (
					value.includes("Languages:") ||
					value.includes("Language:")
				) {
					if (
						value.split(": ")[1].includes("English") ||
						value.split(": ")[1].includes("english")
					) {
						data["languages"].push("english");
					}
					if (
						value.split(": ")[1].includes("French") ||
						value.split(": ")[1].includes("french")
					) {
						data["languages"].push("french");
					}
					if (
						value.split(": ")[1].includes("Arabic") ||
						value.split(": ")[1].includes("arabic")
					) {
						data["languages"].push("arabic");
					}
				}
				if (value.includes("Institution:")) {
					data["orga"] = value.split(": ")[1];
				}
			}
			return data;
		} catch (error) {
			console.error("Error scraping course data:", error);
			return null;
		}
	}

	/**
	 * Extract the programme from the course page
	 * @param {object} page - The Puppeteer page
	 * @returns {array} - The programme of the course
	 * @memberof EDX
	 * @method
	 * @async
	 */
	async extractProgramme(page) {
		let programme = await super
			.extractMany(page, this.selectors.programme)
			.then((programme) => programme.map((prog) => prog.trim()));
		if (programme.length === 0) {
			programme = await super
				.extractMany(page, this.selectors.altProgramme)
				.then((programme) =>
					programme[0].split("\n").map((prog) => prog.trim())
				)
				.catch(async () => {
					return await super
						.extractMany(page, this.selectors.altProgramme2)
						.then((programme) => programme);
				});
		}
		return programme;
	}

	/**
	 * Scrape the data from the URL
	 * @param {string} url - The URL to scrape
	 * @returns {object} - The scraped data
	 * @memberof EDX
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

			this.checkType(url);
			if (this.type === "certificate") {
				await page.click(
					'xpath///main[@id="main-content"]/div[3]/div/div[1]/div[2]/div[1]/div/div[1]'
				);
				var orga = await super.extractText(page, this.selectors.orga);
			} else {
				var { languages, orga } = await this.extractLanguagesAndOrga(
					page
				);
			}
			const [title, brief, programme, duration, pace, animateur] =
				await Promise.all([
					await super.extractText(page, this.selectors.name),
					this.type === "certificate"
						? await super
								.extractMany(page, this.selectors.brief)
								.then((brief) =>
									brief.map((el) => el.trim()).join(" ")
								)
						: await super
								.extractMany(page, this.selectors.brief)
								.then((brief) =>
									brief.join(" ").trim().replace(/\n/g, "")
								),
					await this.extractProgramme(page),
					await super
						.extractText(page, this.selectors.duration)
						.then((duration) => duration.split(" ")[0]),
					this.type === "certificate"
						? await super
								.extractText(page, this.selectors.pace)
								.then((pace) => {
									pace = pace.split(" ")[2];
									return pace;
								})
						: super
								.extractText(page, this.selectors.pace)
								.then((pace) => {
									pace = pace.split(" ")[0];
									if (pace.includes("–")) {
										return pace.split("–")[1];
									}
									return pace;
								}),
					this.type === "certificate"
						? await super.extractMany(
								page,
								this.selectors.animateur
						  )
						: super.extractManyWithMutation(
								page,
								this.selectors.animateur
						  ),
				]);

			return {
				title,
				platform: this.platform,
				url,
				orga,
				brief,
				programme,
				duration:
					new String(pace * duration).length === 1
						? `0${pace * duration}:00`
						: `${pace * duration}:00`,
				animateur,
				languages: languages ? languages : this.detectLanguage(brief),
			};
		} catch (error) {
			console.error("Error scraping course data:", error);
			return null;
		} finally {
			if (browser) {
				await browser.close();
			}
		}
	}
}

module.exports = EDX;
