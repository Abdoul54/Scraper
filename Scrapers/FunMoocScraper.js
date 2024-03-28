const Scraper = require("./Scraper");

/**
 * Fun-Mooc scraper
 * @extends Scraper
 * @class
 */
class FunMooc extends Scraper {
	/**
	 * Create a Fun-Mooc scraper
	 * @constructor
	 * @param {string} platform - The name of the platform
	 * @param {object} selectors - The selectors to use for scraping
	 * @memberof FunMooc
	 * @method
	 */
	constructor() {
		super("Fun-Mooc");
		this.selectors = {
			name: "//h1[@class='subheader__title']",
			orga: "//a/meta[@property='name']",
			brief: "//*[@id='site-content']/div[2]/div[1]/div/div[1]/div[1]/div/div/p",
			programme:
				'//div[@class="nested-item nested-item--accordion nested-item--0"]/ul/li/div',
			altProgramme:
				'//section[@class="course-detail__row course-detail__plan"]',
			duration: "//div[@class='subheader__content']/div[2]/ul/li[2]/span",
			animateur: "//section/div/div/div/div/a/h3",
			languages:
				"//div[@class='subheader__content']/div[2]/ul/div/li/span",
		};
	}

	/**
	 * Extract the languages from the data
	 * @param {string} data - The data to extract the languages from
	 * @returns {array} - The extracted languages
	 * @memberof FunMooc
	 * @method
	 */
	extractLanguages(data) {
		let languages = [];
		data = data
			.toLowerCase()
			.replace(",", "")
			.split(":")[1]
			.trim()
			.split(" ")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1));
		if (data.includes("Français") || data.includes("French")) {
			languages.push("french");
		}
		if (data.includes("Anglais") || data.includes("English")) {
			languages.push("english");
		}
		if (data.includes("Arabe") || data.includes("Arabic")) {
			languages.push("arabic");
		}
		return languages;
	}

	/**
	 * Scrape the content of the programme element
	 * @param {object} page - The Puppeteer page
	 * @returns {array} - The scraped content
	 * @memberof FunMooc
	 * @method
	 * @async
	 */
	async scrapeElementContent(page) {
		const elementHandle = await page.$$(
			"xpath/" + this.selectors.programme
		);
		let data = [];

		for (let i = 1; i <= elementHandle.length; i++) {
			const dynamicXPath = `// div[@class="nested-item nested-item--accordion nested-item--0"]/ul/li[${i}]/div`;

			const elementContent = await super.extractText(page, dynamicXPath);

			data.push(elementContent);
		}
		return data;
	}

	/**
	 * Clean the strings
	 * @param {array} strings - The strings to clean
	 * @returns {array} - The cleaned strings
	 * @memberof FunMooc
	 * @method
	 */
	cleanStrings(strings) {
		const cleanedStrings = strings.map((str) => {
			// Remove leading and trailing whitespace
			str = str.trim();
			// Replace consecutive whitespace characters with a single space
			str = str.replace(/\s+/g, " ");
			// Remove leading and trailing newline characters
			str = str.replace(/^\n+|\n+$/g, "");
			// Replace consecutive newline characters with a single newline
			str = str.replace(/\n+/g, "\n");
			// Replace consecutive tab characters with a single tab
			str = str.replace(/\t+/g, "\t");
			// Replace consecutive space characters with a single space
			str = str.replace(/ +/g, " ");
			return str;
		});
		return cleanedStrings;
	}

	/**
	 * Extract a limited number of elements
	 * @param {object} page - The Puppeteer page
	 * @param {string} xpath - The XPath of the elements
	 * @param {number} limit - The limit of elements to extract
	 * @returns {array} - The extracted elements
	 * @memberof FunMooc
	 * @method
	 * @async
	 */
	async extractLimited(page, xpath, limit) {
		return await page.evaluate(
			(xpath, limit) => {
				const iterator = document.evaluate(
					xpath,
					document,
					null,
					XPathResult.ORDERED_NODE_ITERATOR_TYPE,
					null
				);
				let element = iterator.iterateNext();
				const texts = [];
				let count = 0;
				while (element && (limit === undefined || count < limit)) {
					texts.push(element.textContent.trim());
					element = iterator.iterateNext();
					count++;
				}
				return texts;
			},
			xpath,
			limit
		);
	}

	/**
	 * Convert the duration from hours to HH:MM format
	 * @param {string} duration - The duration to convert
	 * @returns {string} - The converted duration
	 * @memberof FunMooc
	 * @method
	 */
	convertHoursToHHMM(duration) {
		// Extract the number of hours from the string
		const hours = parseInt(duration.match(/\d+/g)[0]);

		// Calculate the number of minutes
		const totalMinutes = hours * 60;

		// Calculate formatted hours and minutes
		const formattedHours = Math.floor(totalMinutes / 60)
			.toString()
			.padStart(2, "0");
		const formattedMinutes = (totalMinutes % 60)
			.toString()
			.padStart(2, "0");

		return formattedHours + ":" + formattedMinutes;
	}
	/**
	 * Scrape the course data
	 * @param {string} url - The URL of the Fun-Mooc course
	 * @returns {object} - The scraped course data
	 * @throws {object} - The error message
	 * @async
	 * @method
	 * @memberof FunMooc
	 */
	async scrape(url) {
		try {
			if (!(await super.checkURLExists(url))) {
				console.error("URL '" + url + "' does not exist");
				return;
			}
			var { browser, page } = await super.launchBrowser(url);

			const [
				title,
				orga,
				brief,
				animateur,
				duration,
				programme,
				languages,
			] = await Promise.all([
				super.extractText(page, this.selectors.name),
				super.extractAttributeFromAll(
					page,
					this.selectors.orga,
					"content"
				),
				super
					.extractMany(page, this.selectors.brief)
					.then((brief) => brief.join("")),
				this.extractLimited(page, this.selectors.animateur, 3).then(
					(animateur) => animateur
				),
				super
					.extractText(page, this.selectors.duration)
					.then((duration) => duration.split(": ")[1])
					.then((duration) => this.convertHoursToHHMM(duration)),
				this.scrapeElementContent(page).then((programme) =>
					programme.length !== 0
						? this.cleanStrings(programme)
						: super
								.extractMany(
									page,
									this.selectors.altProgramme + "/ul/li"
								)
								.then((programme) =>
									programme.length !== 0
										? this.cleanStrings(programme)
										: super.extractMany(
												page,
												this.selectors.altProgramme +
													"/div"
										  )
								)
				),
				super
					.extractText(page, this.selectors.languages)
					.then((data) => this.extractLanguages(data)),
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
				await browser.close();
			}
		}
	}
}
module.exports = FunMooc;
