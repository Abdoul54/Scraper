const Scraper = require("./Scraper");

/**
 * Coursera scraper
 * @extends Scraper
 * @class
 */
class Coursera extends Scraper {
	/**
	 * Create a Coursera scraper
	 * @constructor
	 * @param {string} url - The URL of the Coursera course
	 * @memberof Coursera
	 * @method
	 */
	constructor(url) {
		super("Coursera");
		this.selectors = {
			name: "//h1[@data-e2e='hero-title']",
			orga: "//*[@id='courses']/div/div/div/div[3]/div/div[2]/div[2]/div/div[2]/a/span",
			//*[@id='modules']/div/div/div/div[3]/div/div[2]/div[2]/div/div[2]/a/span
			brief: "//*[@id='courses']/div/div/div/div[1]/div/div/div/div[1]/div/div/div/div/p[1]/span/span",
			moduleTitles:
				"//div[@data-testid='accordion-item']/div/div/div/div[1]/div/h3/a",
			moduleDescs:
				"/div/div/div/div[2]/div/div/div/div/div/div/div[2]/div/div/div",
			animateur: '//a[@data-track-component="hero_instructor"]/span',
			duration:
				'//*[@id="rendered-content"]/div/main/section[2]/div/div/div[1]/div[2]/section/div[2]/div[3]/div[1]',
			languages: "//*[@role='dialog']/div[2]/div[2]/p[2]",
		};
	}

	/**
	 * Switch the selectors to the modules page
	 * @param {object} selectors - The selectors to switch
	 * @memberof Coursera
	 * @method
	 */
	switchToModules = (selectors) => {
		selectors.orga = selectors.orga.replace("courses", "modules");
		selectors.brief =
			"//*[@id='modules']/div/div/div/div[1]/div/div/div/div[1]/div/p[1]";
		selectors.programme =
			"//*[@class='cds-AccordionRoot-container cds-AccordionRoot-silent']/div[1]/button/span/span/span/h3";
		selectors.duration =
			"//*[@id='rendered-content']/div/main/section[2]/div/div/div[2]/div/div/section/div[2]/div[2]/div[1]";
		selectors.moduleTitles =
			"//div[@data-testid='accordion-item']/div/div/div/div/button/span/span/span/h3";
		selectors.moduleDescs = "/div/div/div/div/div/div/div/div/div/p";
	};

	/**
	 * Check the type of the URL
	 * @param {string} url - The URL of the Coursera course
	 * @returns {string} - The type of the URL
	 * @memberof Coursera
	 * @method
	 */
	checkType(url) {
		let result = url.includes("specializations")
			? "specialization"
			: url.includes("learn")
			? "module"
			: "certificate";
		if (result === "module") {
			this.switchToModules(this.selectors);
		}
		return result;
	}

	/**
	 * Convert hours to HH:MM format
	 * @param {number} hours - The hours to convert
	 * @returns {string} - The hours in HH:MM format
	 * @memberof Coursera
	 * @method
	 */
	convertHoursToHHMM(hours) {
		var integerHours = Math.floor(hours);
		var decimalHours = hours - integerHours;

		var minutes = Math.round(decimalHours * 60);

		var formattedHours = ("0" + integerHours).slice(-2);
		var formattedMinutes = ("0" + minutes).slice(-2);

		return formattedHours + ":" + formattedMinutes;
	}

	/**
	 * Convert months and hours per week to HH:MM format
	 * @param {number} months - The number of months
	 * @param {number} hoursPerWeek - The number of hours per week
	 * @returns {string} - The duration in HH:MM format
	 * @memberof Coursera
	 * @method
	 */
	convertMonthsAndHoursToHHMM(months, hoursPerWeek) {
		var totalHours = months * 4 * hoursPerWeek;

		var formattedHours = ("0" + Math.floor(totalHours)).slice(-2);
		var formattedMinutes = "00";

		return formattedHours + ":" + formattedMinutes;
	}

	/**
	 * Convert the duration to HH:MM format
	 * @param {string} duration - The duration to convert
	 * @returns {string} - The duration in HH:MM format
	 * @memberof Coursera
	 * @method
	 */
	convertDurationToHHMM(duration) {
		if (duration.includes("months")) {
			var [months, hoursPerWeek] = duration.match(/\d+/g);
			return this.convertMonthsAndHoursToHHMM(
				parseInt(months),
				parseInt(hoursPerWeek)
			);
		} else {
			var hours = parseFloat(duration);
			return this.convertHoursToHHMM(hours);
		}
	}

	/**
	 * Extract the languages from the course page
	 * @param {object} page - The Puppeteer page
	 * @param {string} selector - The selector for the languages
	 * @returns {array} - The languages of the course
	 * @memberof Coursera
	 * @method
	 * @async
	 */
	async extractLanguages(page, selector) {
		try {
			let languages = [];
			let langs = await this.extractText(page, selector);
			langs = langs
				?.split(",")
				.map((lang) => lang.trim().split(" ")[0])
				.join(", ");
			if (langs.includes("English")) {
				languages.push("english");
			}
			if (langs.includes("Français")) {
				languages.push("french");
			}
			if (langs.includes("العربية")) {
				languages.push("arabic");
			}
			return languages;
		} catch (error) {
			console.error("Error extracting languages:", error);
			throw error;
		}
	}

	/**
	 * Extract the animateur from the course page
	 * @param {object} page - The Puppeteer page
	 * @param {string} xpath - The XPath selector for the animateur
	 * @returns {array} - The animateur of the course
	 * @memberof Coursera
	 * @method
	 * @async
	 */
	async extractAnimateur(page, xpath) {
		// Implementation of extractAnimateur function
		return await page.evaluate((xpath) => {
			const iterator = document.evaluate(
				xpath,
				document,
				null,
				XPathResult.ORDERED_NODE_ITERATOR_TYPE,
				null
			);
			let element = iterator.iterateNext();
			const texts = [];
			while (element) {
				if (!texts.includes(element.textContent.trim())) {
					texts.push(element.textContent.trim());
				}
				element = iterator.iterateNext();
			}
			return [...new Set(texts)];
		}, xpath);
	}

	/**
	 * Extract the duration from the course page
	 * @param {object} page - The Puppeteer page
	 * @returns {array} - The duration of the course
	 * @memberof Coursera
	 * @method
	 * @async
	 */
	async extractDuration(page) {
		const words = ["hours", "days", "weeks", "months"];
		const elementHandle = await page.$$(
			"xpath///div[@class='cds-119 cds-Typography-base css-h1jogs cds-121']"
		);
		let data = [];

		for (const element of elementHandle) {
			const text = await page.evaluate((el) => el.textContent, element);
			if (words.some((word) => text.includes(word))) {
				data.push(text);
			}
		}
		return [...new Set(data)];
	}

	/**
	 * Extract the programme from the course page
	 * @param {object} page - The Puppeteer page
	 * @returns {array} - The programme of the course
	 * @memberof Coursera
	 * @method
	 * @async
	 */
	async extractProgramme(page) {
		const programme = [];
		const elementHandle = await page.$$(
			"xpath/" + this.selectors.moduleTitles
		);
		let counter = 1;
		for (const element of elementHandle) {
			const moduleTitle = await page.evaluate(
				(el) => el.textContent,
				element
			);
			let moduleDesc = await super
				.extractMany(
					page,
					`//div[@data-testid="accordion-item"][${counter}]${this.selectors.moduleDescs}`
				)
				.then((moduleDesc) =>
					moduleDesc
						.join(". ")
						.replace(/\.\./g, ".")
						.replace(/\n/g, "")
				);

			if (moduleDesc.length === 0) {
				moduleDesc = await super
					.extractMany(
						page,
						`//div[@data-testid="accordion-item"][${counter}]/div/div/div/div[2]/div/div/div/div/div/div[1]/ul/li`
					)
					.then((moduleDesc) =>
						moduleDesc
							.join(". ")
							.replace(/\.\./g, ".")
							.replace(/\n/g, "")
					);
			}
			var module = moduleDesc
				? moduleTitle.trim().concat(" :   " + moduleDesc)
				: moduleTitle.trim();
			programme.push(module);

			counter++;
		}
		return programme;
	}

	/**
	 * Scrape the course data
	 * @returns {object} - The scraped course data
	 * @memberof Coursera
	 * @method
	 * @async
	 */
	async scrape(url) {
		try {
			let languages;
			if (!(await this.checkURLExists(url))) {
				throw new Error("URL does not exist");
			}
			var { browser, page } = await super.launchBrowser(url);
			this.checkType(url)
			
			if (
				await super.checkElementExistence(
					page,
					"xpath///div[2]/div/button/span/span"
				)
			) {
				await page.click("xpath///div[2]/div/button/span/span");
				languages = await this.extractLanguages(
					page,
					this.selectors.languages
				);
			}
			const [title, orga, brief, programme, duration, animateur] =
				await Promise.all([
					super.extractText(page, this.selectors.name),
					super.extractText(page, this.selectors.orga),
					super
						.extractMany(page, this.selectors.brief)
						.then((brief) =>
							brief.map((el) => el.trim()).join(" ")
						),
					this.extractProgramme(page),
					this.extractDuration(page, this.selectors.duration).then(
						(duration) => this.convertDurationToHHMM(...duration)
					),
					super
						.extractMany(page, this.selectors.animateur)
						.then((animateur) =>
							[...new Set(animateur)].slice(0, 3)
						),
				]);

			return {
				title,
				platform: this.platform,
				url,
				orga,
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

module.exports = Coursera;
