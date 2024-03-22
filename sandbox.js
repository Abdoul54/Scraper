const langdetect = require("langdetect");
const Scraper = require("./Scraper");
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
			duration:
				'//div[@class="course-about desktop course-info-content"]/div[2]/div/div[1]/div/div/div[1]/div/div[1]',
			pace: '//div[@class="course-about desktop course-info-content"]/div[2]/div/div[1]/div/div/div[1]/div/div[2]',
			animateur:
				'//div[@class="instructor-card px-4 py-3.5 rounded"]/div/h3',
			languages:
				'//div[@class="course-about desktop course-info-content"]/div[4]/div/div[2]/div/div/div[2]/ul/li[1]',
		};
		this.type = "course";
		// this.selectors.certificate = {
		// 	name: '//div[@class="title"]',
		// 	orga: '//div[@class="institution"]',
		// 	brief: '//div[@class="overview-info"]/p',
		// 	programme: '//li[@class="bullet-point mb-2"]',
		// 	duration:
		// 		'//div[@class="program-stat"][3]/div[@class="details"]/div[@class="main"]',
		// 	pace: '//div[@class="program-stat"][3]/div[@class="details"]/div[@class="secondary"]',
		// 	animateur: '//a[@class="name font-weight-bold"]',
		// 	languages: "", //* detect from the brief
		// };
	}
	checkType(url) {
		if (url.includes("certificates")) {
			this.type = "certificate";
		}
		this.switchSelectors();
	}
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

	async extractProgramme(page) {
		let programme = await super
			.extractMany(page, this.selectors.programme)
			.then((programme) => programme.map((prog) => prog.trim()));
		if (programme.length === 0) {
			programme = await super
				.extractMany(page, this.selectors.altProgramme)
				.then((programme) =>
					programme[0].split("\n").map((prog) => prog.trim())
				);
		}
		return programme;
	}
	async extractTextPostsMutation(page, xpath) {
		return await page.evaluate(async (xpath) => {
			const waitForElements = (xpath) => {
				return new Promise((resolve) => {
					const observer = new MutationObserver((mutations) => {
						const elements = document.evaluate(
							xpath,
							document,
							null,
							XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
							null
						);
						const results = [];
						for (let i = 0; i < elements.snapshotLength; i++) {
							results.push(
								elements.snapshotItem(i).textContent.trim()
							);
						}
						if (results.length > 0) {
							observer.disconnect();
							resolve(results);
						}
					});
					observer.observe(document, {
						childList: true,
						subtree: true,
					});
				});
			};

			return await waitForElements(xpath);
		}, xpath);
	}
	async extractTextPostMutation(page, xpath) {
		return await page.evaluate(async (xpath) => {
			const waitForElement = (xpath) => {
				return new Promise((resolve) => {
					const observer = new MutationObserver((mutations) => {
						const element = document.evaluate(
							xpath,
							document,
							null,
							XPathResult.FIRST_ORDERED_NODE_TYPE,
							null
						).singleNodeValue;
						if (element) {
							observer.disconnect();
							resolve(element);
						}
					});
					observer.observe(document, {
						childList: true,
						subtree: true,
					});
				});
			};

			const element = await waitForElement(xpath);
			return element ? element.textContent.trim() : null;
		}, xpath);
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

			console.log({
				title,
				platform: this.platform,
				url,
				orga,
				brief,
				programme,
				duration:
					(pace * duration).length === 1
						? `0${pace * duration}:00`
						: `${pace * duration}:00`,
				animateur,
				languages: languages ? languages : this.detectLanguage(brief),
			});
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
let edx = new EDX();
edx.scrape(
	"https://www.edx.org/learn/python/harvard-university-cs50-s-introduction-to-programming-with-python"
	// "https://www.edx.org/certificates/professional-certificate/ubcx-online-teaching-for-educators-development-and-delivery"
	// "https://www.edx.org/certificates/professional-certificate/armeducationx-embedded-systems-essentials"
	// "https://www.edx.org/learn/embedded-systems/the-university-of-texas-at-austin-embedded-systems-shape-the-world-microcontroller-input-output"
	// "https://www.edx.org/learn/coding/universita-degli-studi-di-napoli-federico-ii-coding-a-scuola-con-software-libero"
);
// #main-content > div.gradient-wrapper.program-body.container-mw-lg.container-fluid > div > div:nth-child(1) > div:nth-child(2) > div.col-lg-8.mb-4 > div.pgn_collapsible.p-2.collapsible-card.is-open > div.pgn-transition-replace-group.position-relative > div > div > div > p:nth-child(6)
