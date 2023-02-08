// AO3 Work Object
const Requester = require('../util/Requester.js');
const cheerio = require('cheerio');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class Work {
	/**
	 * Constructor for the Work object
	 * @param {number} id The work ID
	 * @param {object} options The options to use.
	 *
	 * Options:
	 * - session: The session to use for requests.
	 * - load: Whether to load the work on instantiation. Defaults to true.
	 * - loadChapters: Whether to load the chapters on instantiation. Defaults to true.
	 */
	constructor(id, options = {}) {
		this.id = id;
		this.options = options;
		this.chapters = [];
		this.requester = new Requester();
		if (this.options.load) {
			this.load();
		}
	}

	/**
	 * Loads information about this work.
	 * @param {boolean} loadChapters Whether to load the chapters. Defaults to true.
	 * @returns {Promise<void>} A promise that resolves when the work is loaded.
	 * @throws {HTTPError} If the request fails.
	 * @throws {BaseAO3Error} If the response is not valid JSON.
	 * @throws {Error} If the response is not a work.
	 * @private
	 */
	async load(loadChapters = true) {

	}

	async request(url, options = {}) {
		// Perform GET request using self.get
		const response = await this.get(url, options);
		// Use Undici mixins to parse response
		const body = await response.body.text();
		// Warning if content is really long (say, >650000 characters)
		if (body.length > 650000) {
			console.warn(`The page is really long! It may take a while to parse.`);
		}
		// Use Cheerio to parse response
		const $ = cheerio.load(body);
		// Return parsed response
		return $;
	}

	async get (url, options = {}) {
		// Use requester to make request
		if (options.session) {
			const response = await this.requester.request(url, options, options.session);
		} else {
			const response = await this.requester.request(url, options);
		}
		// Check response status
		if (response.statusCode !== 200) {
			throw new HTTPError(`Request failed with status code ${response.statusCode}`, response.statusCode);
		}
	}
}

module.exports = Work;