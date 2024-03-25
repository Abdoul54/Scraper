const Scraper = require("./Scraper");

/**
 * Udemy scraper
 * @extends Scraper
 * @class
 */
class Udemy extends Scraper {
	/**
	 * Create a Udemy scraper
	 * @constructor
	 * @memberof Udemy
	 * @method
	 */
	constructor() {
		super("Udemy");
		this.selectors = {
			name: '//h1[@data-purpose="lead-title"]',
			brief: '//div[@data-purpose="safely-set-inner-html:description:description"]/p',
			programme: '//span[@class="ud-accordion-panel-title"]/span[1]',
			animateur: '//span[@class="instructor-links--names--fJWai"]/a/span',
			duration: '//span[@class="ud-accordion-panel-title"]/span[2]/span',
			languages: '//div[@data-purpose="lead-course-locale"]/text()',
		};
	}

	/**
	 * Convert durations to HH:MM format
	 * @param {array} durations - The durations to convert
	 * @returns {array} - The durations in HH:MM format
	 * @memberof Udemy
	 * @method
	 */
	convertDurationsToHHMM(durations) {
		return durations.map((duration) => {
			let totalMinutes = 0;
			const parts = duration.split(" ");
			parts.forEach((part) => {
				if (part.includes("hr")) {
					const hours = parseInt(part.replace("hr", ""), 10);
					totalMinutes += hours * 60;
				} else if (part.includes("min")) {
					const minutes = parseInt(part.replace("min", ""), 10);
					totalMinutes += minutes;
				}
			});

			const hours = Math.floor(totalMinutes / 60);
			const minutes = totalMinutes % 60;

			return `${hours.toString().padStart(2, "0")}:${minutes
				.toString()
				.padStart(2, "0")}`;
		});
	}

	/**
	 * Calculate the total duration
	 * @param {array} timeArray - The durations to calculate
	 * @returns {string} - The total duration
	 * @memberof Udemy
	 * @method
	 */
	calculateTotalDuration(timeArray) {
		let totalMinutes = 0;

		for (let i = 0; i < timeArray.length; i++) {
			const [hours, minutes] = timeArray[i].split(":").map(Number);
			totalMinutes += hours * 60 + minutes;
		}

		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;

		return `${hours}:${minutes}`;
	}

	/**
	 * Extract the languages
	 * @param {object} page - The page object
	 * @returns {array} - The languages
	 * @memberof Udemy
	 * @method
	 * @async
	 */
	async extractLanguages(page) {
		const languages = [];
		const langs = await super
			.extractMany(page, this.selectors.languages)
			.then((langs) => langs.map((lang) => lang.toLowerCase()));
		if (langs.length === 0) return null;
		if (langs.includes("english")) {
			languages.push("english");
		}
		if (langs.includes("french")) {
			languages.push("french");
		}
		if (langs.includes("arabic")) {
			languages.push("arabic");
		}
		return languages;
	}

	/**
	 * Scrape the Udemy course data
	 * @param {string} url - The URL of the Udemy course
	 * @returns {object} - The scraped course data
	 * @memberof Udemy
	 * @method
	 * @async
	 * @throws {object} - The error message
	 */
	async scrape(url) {
		try {
			// let languages;
			// if (!(await this.checkURLExists(this.url))) {
			// 	throw new Error("URL does not exist");
			// }
			var { browser, page } = await super.launchBrowser(url);

			const showMoreButton = await page
				.waitForSelector('xpath///button[@data-purpose="show-more"]')
				.catch(() => null);

			var programme = await super.extractMany(
				page,
				'//span[@class="section--section-title--svpHP"]'
			);
			var duration = await super
				.extractMany(page, this.selectors.duration)
				.then((durations) =>
					this.calculateTotalDuration(
						this.convertDurationsToHHMM(durations)
					)
				);
			return {
				programme,
				duration,
			};
		} catch (error) {
			console.error("Error scraping course data:", error);
			return null;
		} finally {
			if (browser) {
				super.closeBrowser(browser);
			}
		}
	}
}

let udemy = new Udemy();
udemy
	.scrape(
		"https://www.udemy.com/course/machinelearning/?couponCode=LETSLEARNNOW"
	)
	.then(console.log);
