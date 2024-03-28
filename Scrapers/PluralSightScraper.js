const Scraper = require("./Scraper");

class PluralSight extends Scraper {
	/**
	 * Create a PluralSight scraper
	 * @constructor
	 * @memberof PluralSight
	 * @method
	 */
	constructor() {
		super("PluralSight");
		this.selectors = {
			name: '//div[@id="course-page-hero"]/h1',
			brief: '//div[@class="course-content-about"]/p',
			programme: '//span[@class="ud-accordion-panel-title"]/span[1]',
			animateur: '//div[@class="author-name"]',
			duration:
				'//aside[@class="course-content-right show-for-large-up"]/div[2]/div[4]/div[2]/text()',
			languages: '//div[@data-purpose="lead-course-locale"]/text()',
		};
	}

	/**
	 * Extract the programme content
	 * @param {object} page - The page object
	 * @returns {object} - The programme content
	 * @throws {object} - The error message
	 * @memberof PluralSight
	 * @method
	 * @async
	 */
	async extractProgramme(page) {
		try {
			const programme = {};
			const headers = await super
				.extractMany(page, '//div[@class="toc-title"]')
				.then((headers) =>
					headers.map((header) => header.split("\n")[0].trim())
				);
			for (let i = 1; i <= headers.length; i++) {
				const subheaders = await super.extractMany(
					page,
					`//div[@class="toc-item"][${i}]/div[2]/ul/li/a/span[@class="accordion-content__row__title"]`
				);
				const sectionTitle = headers[i - 1];
				const sectionItems = subheaders.map((sub) => sub.trim());
				programme[sectionTitle] = sectionItems;
			}
			return programme;
		} catch (error) {
			console.error("Error scraping course content:", error);
			return null;
		}
	}

	/**
	 * Convert durations to HH:MM format
	 * @param {array} durations - The durations to convert
	 * @returns {array} - The durations in HH:MM format
	 * @memberof PluralSight
	 * @method
	 */
	convertToHHMM(timeStr) {
		const parts = timeStr.split(" ");

		let hours = 0;
		let minutes = 0;

		parts.forEach((part) => {
			if (part.includes("h")) {
				hours = parseInt(part);
			} else if (part.includes("m")) {
				minutes = parseInt(part);
			}
		});

		const formattedHours = hours.toString().padStart(2, "0");
		const formattedMinutes = minutes.toString().padStart(2, "0");

		return `${formattedHours}:${formattedMinutes}`;
	}

	/**
	 * Scrape the Udemy course data
	 * @param {string} url - The URL of the Udemy course
	 * @returns {object} - The scraped course data
	 * @memberof PluralSight
	 * @method
	 * @async
	 * @throws {object} - The error message
	 */
	async scrape(url) {
		try {
			var { browser, page } = await super.launchBrowser(url, true);

			const [title, brief, animateur, programme, duration] =
				await Promise.all([
					super.extractText(page, this.selectors.name),
					super.extractText(page, this.selectors.brief),
					super.extractMany(page, this.selectors.animateur),
					this.extractProgramme(page),
					super
						.extractText(page, this.selectors.duration)
						.then((time) => this.convertToHHMM(time)),
				]);
			const languages = ["english"];
			return {
				title,
				platform: this.platform,
				url,
				orga: "PluralSight",
				brief,
				programme,
				duration,
				animateur,
				languages,
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

module.exports = PluralSight;
