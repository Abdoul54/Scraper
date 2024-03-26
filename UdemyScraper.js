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
			animateur: '//span[@class="instructor-links--names--fJWai"]/a',
			duration:
				'//span[@class="curriculum--content-length--V3vIz"]/span/span',
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
	 * Clean the text
	 * @param {string} text - The text to clean
	 * @returns {string} - The cleaned text
	 * @memberof Udemy
	 * @method
	 */
	cleanText(text) {
		text = text.replace(/[^\x20-\x7E]/g, "");
		text = text
			.replace(/&quot;/g, '"')
			.replace(/&apos;/g, "'")
			.replace(/&amp;/g, "&")
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">");
		text = text.replace(/\s+/g, " ").trim();
		return text;
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
	 * Extract the programme
	 * @param {object} page - The page object
	 * @returns {array} - The programme
	 * @memberof Udemy
	 * @method
	 * @async
	 * @throws {object} - The error message
	 */
	async extractProgramme(page) {
		try {
			const programme = [];
			const headers = await super.extractManyWithMutation(
				page,
				'//span[@class="section--section-title--svpHP"]'
			);
			for (let i = 1; i <= headers.length; i++) {
				const subheaders = await super.extractMany(
					page,
					`//div[@data-purpose="course-curriculum"]/div[2]/div[${i}]/div[2]/div/ul/li/div/div/div/div/span`
				);
				programme[headers[i - 1]] = subheaders.map((sub) => sub.trim());
			}
			return programme;
		} catch (error) {
			console.error("Error scraping course content:", error);
			return null;
		}
	}

	/**
	 * Check if the course is paid
	 * @param {object} page - The page object
	 * @returns {boolean} - The course payment status
	 * @memberof Udemy
	 * @method
	 * @async
	 * @throws {object} - The error message
	 */
	async checkIsPaid(page) {
		try {
			const isPaid = await super.extractAttribute(
				page,
				'//div[@class="ud-component--course-landing-page--course-landing-page"]',
				"data-component-props"
			);
			return JSON.parse(isPaid).serverSideProps.course.isPaid;
		} catch (error) {
			console.error("Error scraping course content:", error);
			return null;
		}
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
			var { browser, page } = await super.launchBrowser(url);

			if (await this.checkIsPaid(page)) {
				throw new Error("Course is paid");
			}
			const [title, brief, programme, animateur, duration, languages] =
				await Promise.all([
					super.extractText(page, this.selectors.name),
					super
						.extractMany(page, this.selectors.brief)
						.then((paragraphs) => {
							let index = paragraphs.findIndex((paragraph) =>
								paragraph.endsWith(":")
							);
							return index !== -1
								? paragraphs.slice(0, index)
								: paragraphs;
						})
						.then((paragraphs) =>
							this.cleanText(paragraphs.join("\n"))
						),
					this.extractProgramme(page),
					super.extractMany(page, this.selectors.animateur),
					super
						.extractTextPostMutation(page, this.selectors.duration)
						.then((duration) => {
							return this.convertToHHMM(
								duration.replace(/\u00A0/g, " ")
							);
						}),
					this.extractLanguages(page),
				]);

			return {
				title,
				platform: this.platform,
				url,
				orga: "Udemy",
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
module.exports = Udemy;
