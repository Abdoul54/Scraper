const puppeteer = require("puppeteer");
const userAgent =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";
/**
 * The base scraper class
 * @class
 */
class Scraper {
	/**
	 * Create a scraper
	 * @constructor
	 * @param {string} platform - The name of the platform
	 * @memberof Scraper
	 * @method
	 */
	constructor(platform) {
		this.platform = platform;
	}

	/**
	 * Launch a browser and navigate to a URL
	 * @param {string} url - The URL to navigate to
	 * @returns {object} - The browser and page objects
	 * @async
	 * @method
	 * @memberof Scraper
	 */
	async launchBrowser(url, userAgent = false) {
		try {
			const args = [
				"--no-sandbox",
				"--disable-setuid-sandbox",
				"--single-process",
				"--no-zygote",
			];
			if (userAgent) {
				args.push(`--user-agent=${userAgent}`);
			}
			const browser = await puppeteer.launch({
				args,
			});
			const page = await browser.newPage();
			await page.setDefaultNavigationTimeout(60000);
			await page.goto(url);
			return { browser, page };
		} catch (error) {
			console.log("Error launching browser:", error);
		}
	}

	/**
	 * Close the browser
	 * @param {object} browser - The browser object
	 * @async
	 * @method
	 * @memberof Scraper
	 */
	async closeBrowser(browser) {
		await browser.close();
	}

	/**
	 * Extract text from an element
	 * @param {object} page - The page object
	 * @param {string} xpath - The XPath of the element
	 * @returns {string} - The text content of the element
	 * @async
	 * @method
	 * @memberof Scraper
	 * @throws {object} - The error message
	 */
	async extractText(page, xpath) {
		return await page.evaluate((xpath) => {
			const element = document.evaluate(
				xpath,
				document,
				null,
				XPathResult.FIRST_ORDERED_NODE_TYPE,
				null
			).singleNodeValue;
			return element ? element.textContent.trim() : null;
		}, xpath);
	}

	/**
	 * Extract text from multiple elements
	 * @param {object} page - The page object
	 * @param {string} xpath - The XPath of the elements
	 * @returns {string[]} - The text content of the elements
	 * @async
	 * @method
	 * @memberof Scraper
	 * @throws {object} - The error message
	 */
	async extractMany(page, xpath) {
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
				texts.push(element.textContent.trim());
				element = iterator.iterateNext();
			}
			return texts;
		}, xpath);
	}

	/**
	 * Extract an attribute from an element
	 * @param {object} page - The page object
	 * @param {string} xpath - The XPath of the element
	 * @param {string} attributeName - The name of the attribute
	 * @returns {string} - The value of the attribute
	 * @async
	 * @method
	 * @memberof Scraper
	 * @throws {object} - The error message
	 */
	async extractAttribute(page, xpath, attributeName) {
		return await page.evaluate(
			(xpath, attributeName) => {
				const element = document.evaluate(
					xpath,
					document,
					null,
					XPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				).singleNodeValue;
				return element ? element.getAttribute(attributeName) : null;
			},
			xpath,
			attributeName
		);
	}

	/**
	 * Extract text from an element after a mutation
	 * @param {object} page - The page object
	 * @param {string} xpath - The XPath of the element
	 * @returns {string} - The text content of the element
	 * @async
	 * @method
	 * @memberof Scraper
	 * @throws {object} - The error message
	 */
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
	 * Extract an attribute from multiple elements
	 * @param {object} page - The page object
	 * @param {string} xpath - The XPath of the elements
	 * @param {string} attributeName - The name of the attribute
	 * @returns {string[]} - The values of the attribute
	 * @async
	 * @method
	 * @memberof Scraper
	 * @throws {object} - The error message
	 */
	async extractManyWithMutation(page, xpath) {
		return await page.evaluate(async (xpath) => {
			const waitForElements = (xpath) => {
				return new Promise((resolve) => {
					const observer = new MutationObserver((mutations) => {
						const elements = [];
						const iterator = document.evaluate(
							xpath,
							document,
							null,
							XPathResult.ORDERED_NODE_ITERATOR_TYPE,
							null
						);
						let element = iterator.iterateNext();
						while (element) {
							elements.push(element);
							element = iterator.iterateNext();
						}
						if (elements.length > 0) {
							observer.disconnect();
							resolve(
								elements.map((element) =>
									element.textContent.trim()
								)
							);
						}
					});
					observer.observe(document, {
						childList: true,
						subtree: true,
					});
				});
			};

			const texts = await waitForElements(xpath);
			return texts;
		}, xpath);
	}

	/**
	 * Extract an attribute from multiple elements
	 * @param {object} page - The page object
	 * @param {string} xpath - The XPath of the elements
	 * @param {string} attributeName - The name of the attribute
	 * @returns {string[]} - The values of the attribute
	 * @async
	 * @method
	 * @memberof Scraper
	 * @throws {object} - The error message
	 */
	async extractAttributeFromAll(page, xpath, attributeName) {
		return await page.evaluate(
			(xpath, attributeName) => {
				const elements = document.evaluate(
					xpath,
					document,
					null,
					XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
					null
				);
				const attributes = [];
				for (let i = 0; i < elements.snapshotLength; i++) {
					const element = elements.snapshotItem(i);
					const attribute = element.getAttribute(attributeName);
					if (attribute) {
						attributes.push(attribute);
					}
				}
				return attributes;
			},
			xpath,
			attributeName
		);
	}

	/**
	 * Check if a URL exists
	 * @param {string} url - The URL to check
	 * @returns {boolean} - Whether the URL exists
	 * @async
	 * @method
	 * @memberof Scraper
	 */
	async checkURLExists(url) {
		try {
			const parsedURL = new URL(url);
			url = `${parsedURL.origin}${parsedURL.pathname}${parsedURL.search}`;
			const response = await fetch(url, { method: "HEAD" });

			return (
				parsedURL.pathname === new URL(response.url).pathname &&
				response.ok
			);
		} catch (error) {
			console.error("Error checking URL:", error);
			return false;
		}
	}

	/**
	 * Check if an element exists
	 * @param {object} page - The page object
	 * @param {string} xpath - The XPath of the element
	 * @returns {boolean} - Whether the element exists
	 * @async
	 * @method
	 * @memberof Scraper
	 */
	async checkElementExistence(page, xpath) {
		return await page.$(xpath);
	}
}
module.exports = Scraper;
