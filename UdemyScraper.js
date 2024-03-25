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
	convertToMinutes(timeStr) {
		const [hours, minutes] = timeStr.split("hr ");
		return parseInt(hours) * 60 + parseInt(minutes || 0);
	}

	/**
	 * Calculate the total duration
	 * @param {array} timeArray - The durations to calculate
	 * @returns {string} - The total duration
	 * @memberof Udemy
	 * @method
	 */
	totalDurationAndConvertToHHMM(timeIntervals) {
		const totalMinutes = timeIntervals.reduce(
			(total, time) => total + this.convertToMinutes(time),
			0
		);
		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;
		return `${hours.toString().padStart(2, "0")}:${minutes
			.toString()
			.padStart(2, "0")}`;
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
			const headers = await super.extractManyWithMutation(
				page,
				'//span[@class="section--section-title--svpHP"]'
			);
			const programme = [];
			for (let i = 1; i <= headers.length; i++) {
				const element = await super
					.extractMany(
						page,
						`//div[@data-purpose="course-curriculum"]/div[2]/div[${i}]/div[2]/div/ul/li/div/div/div/div/span`
					)
					.then(
						(subheader) =>
							`<ul>${subheader.map(
								(sub) => `<li>${sub.trim()}</li>`
							)}</ul>`
					)
					.then((subheader) => subheader.replace(/,/g, ""));
				programme.push(
					`<div><h3>${headers[i - 1]}</h3>${element}</div>`
				);
			}
			return programme;
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

			const [title, brief, programme, animateur, duration, languages] =
				await Promise.all([
					await super.extractText(page, this.selectors.name),
					await super
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
					await this.extractProgramme(page),
					await super.extractMany(page, this.selectors.animateur),
					await super
						.extractMany(page, this.selectors.duration)
						.then((durations) =>
							this.totalDurationAndConvertToHHMM(durations)
						),
					await this.extractLanguages(page),
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
