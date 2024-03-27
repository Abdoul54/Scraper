const Scraper = require("./Scraper");

class MyMooc extends Scraper {
	/**
	 * Create a MyMooc scraper
	 * @constructor
	 * @memberof MyMooc
	 * @method
	 */
	constructor() {
		super("MyMooc");
		this.selectors = {
			name: '//h1[@class="mymoocapp-1vak8w3 ejjtsdg6"]',
			brief: '//div[@class="read-more-wrapper"]', //* Tricky
			programme: '//div[@id="ResourceDetails"]/div[1]//div/ul/li',
			animateur:
				'//div[@data-testid="styled#rich-editorial##body"]/p/strong/text()',
			duration: '//div[@data-testid="Card#Pill#Minutes"]/span',
			languages:
				'//div[@class="noSpacingTop mymoocapp-rpnrxd ejjtsdg5"]/div[2]/div[2]',
		};
	}

	/**
	 * Extract the programme content
	 * @param {object} page - The page object
	 * @returns {object} - The programme content
	 * @throws {object} - The error message
	 * @memberof MyMooc
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
	 * @memberof MyMooc
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
	 * Scrape the MyMooc course data
	 * @param {string} url - The URL of the MyMooc course
	 * @returns {object} - The scraped course data
	 * @memberof MyMooc
	 * @method
	 * @async
	 * @throws {object} - The error message
	 */
	async scrape(url) {
		try {
			var { browser, page } = await super.launchBrowser(url, true);

			const title = await super.extractText(page, this.selectors.name);
			const brief = await super.extractText(page, this.selectors.brief);
			const animateur = await super.extractMany(
				page,
				this.selectors.animateur
			);
			console.log({ animateur });
			// const [title, brief, animateur, programme, duration] =
			// 	await Promise.all([
			// 		super.extractText(page, this.selectors.name),
			// 		super.extractText(page, this.selectors.brief),
			// 		super.extractMany(page, this.selectors.animateur),
			// 		this.extractProgramme(page),
			// 		super
			// 			.extractText(page, this.selectors.duration)
			// 			.then((time) => this.convertToHHMM(time)),
			// 	]);
			// const languages = ["english"];
			// return {
			// 	title,
			// 	platform: this.platform,
			// 	url,
			// 	orga: "MyMooc",
			// 	brief,
			// 	programme,
			// 	duration,
			// 	animateur,
			// 	languages,
			// };
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

let myMooc = new MyMooc();
myMooc.scrape("https://www.my-mooc.com/en/mooc/sciwrite/");
