const langdetect = require("langdetect");
const Scraper = require("./Scraper");

class SkillShop extends Scraper {
	/**
	 * Create a SkillShop scraper
	 * @constructor
	 * @memberof SkillShop
	 * @method
	 */
	constructor() {
		super("SkillShop");
		this.selectors = {
			name: '//div[@class="course__header"]/div/h1',
			brief: '//div[@class="course__description postcontent"]',
			programme:
				'//h2[@class="u-headingsection--activity activitysection__name"]/text()[1]',
			animateur: "", //* not provided
			duration:
				'//ul[@class="activityheading__meta activitymeta activitymeta--heading"]/li[3]/text()[2]',
			languages: "", //* detect from brief
		};
	}

	/**
	 * Convert durations to HH:MM format
	 * @param {array} durations - The durations to convert
	 * @returns {array} - The durations in HH:MM format
	 * @memberof SkillShop
	 * @method
	 */
	convertToHHMM(input) {
		if (input.match(/m(s)?|min(s)?/)) {
			input = input.replace(/m|min(s)?/, "");
			let minutes = parseInt(input);
			minutes = minutes < 10 ? `00:0${minutes}` : `00:${minutes}`;
			return minutes;
		} else {
			input = input.replace(/hrs/, "");
			let hours, minutes;
			if (input.includes(".")) {
				hours = Math.floor(parseFloat(input));
				minutes = Math.round((parseFloat(input) - hours) * 60);
			} else {
				hours = parseInt(input);
				minutes = 0;
			}
			hours = hours < 10 ? `0${hours}` : hours;
			minutes = minutes < 10 ? `0${minutes}` : minutes;
			input = `${hours}:${minutes}`;
			return input;
		}
	}

	/**
	 * Detect the language of the text
	 * @param {string} text - The text to detect the language of
	 * @returns {array} - The detected languages
	 * @memberof SkillShop
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
	 * Scrape the SkillShop course data
	 * @param {string} url - The URL of the SkillShop course
	 * @returns {object} - The scraped course data
	 * @memberof SkillShop
	 * @method
	 * @async
	 * @throws {object} - The error message
	 */
	async scrape(url) {
		try {
			var { browser, page } = await super.launchBrowser(url, true);

			const [title, brief, programme, duration] = await Promise.all([
				super.extractText(page, this.selectors.name),
				super
					.extractMany(page, this.selectors.brief)
					.then((text) => text.join("").replace(/\n/g, "")),
				super.extractMany(page, this.selectors.programme),
				super
					.extractText(page, this.selectors.duration)
					.then((time) => console.log("Duration =>", time))
					.then((time) => {
						return this.convertToHHMM(time);
					})
					.catch(() => null),
			]);
			const animateur = [];
			const languages = brief
				? this.detectLanguage(brief)
				: this.detectLanguage(title);

			return {
				title,
				platform: this.platform,
				url,
				orga: "SkillShop",
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

module.exports = SkillShop;
