// AO3 Work Object
const Requester = require('../util/Requester.js');
const cheerio = require('cheerio');
const BaseAO3Error = require('../error/BaseAO3Error.js');
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
	 * Loads number of Kudos the work has.
	 * @returns {number} The number of Kudos.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get kudos() {
		if (!this.loaded) {
			throw new BaseAO3Error('Work not loaded yet');
		}
		return parseInt(this.$('dd.kudos').text().replace(/,/g, ''));
	}

	/**
	 * Loads number of chapters the work has.
	 * @returns {number} The number of chapters.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get chaptersCount() {
		if (!this.loaded) {
			throw new BaseAO3Error('Work not loaded yet');
		}
		return parseInt(this.$('dd.chapters').text().split('/')[0].replace(/,/g, ''));
	}

	/**
	 * Loads number of expected chapters the work has.
	 * @returns {number} The number of expected chapters.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get expectedChaptersCount() {
		if (!this.loaded) {
			throw new BaseAO3Error('Work not loaded yet');
		}
		return parseInt(this.$('dd.chapters').text().split('/')[1].replace(/,/g, ''));
	}

	/**
	 * Loads the status of the work.
	 * @returns {string} The status of the work.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get status() {
		if (!this.loaded) {
			throw new BaseAO3Error('Work not loaded yet');
		}
		return this.chaptersCount === this.expectedChaptersCount ? 'Completed' : 'Work in Progress';
	}

	/**
	 * Loads the number of hits the work has.
	 * @returns {number} The number of hits.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get hits() {
		/*
		hits = self._soup.find("dd", {"class": "hits"})
		 */
		if (!this.loaded) {
			throw new BaseAO3Error('Work not loaded yet');
		}
		return parseInt(this.$('dd.hits').text().replace(/,/g, ''));
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
	async reload(loadChapters = true) {
		this.$ = await this.request(`https://archiveofourown.org/works/${this.id}`);
		if (this.$('h2.heading').text().includes('Error 404')) {
			throw new Error('Work not found');
		}
		if (loadChapters) {
			await this.loadChapters();
		}
		this.loaded = true;
	}

	/**
	 * Makes a request to the AO3 API and puts the response into a Cheerio object.
	 * @param url
	 * @param options
	 * @returns {Promise<CheerioAPI>}
	 */
	async request(url, options = {}) {
		const response = await this.get(url, options);
		const body = await response.body.text();
		if (body.length > 650000) {
			console.warn(`The page is really long! It may take a while to parse.`);
		}
		return cheerio.load(body);
	}

	/**
	 * Makes a request to the AO3 API, keeping in mind rate limits.
	 * @param url
	 * @param options
	 * @returns {Promise<void>}
	 */
	async get (url, options = {}) {
		let response;
		if (options.session) {
			response = await this.requester.request(url, options, options.session);
		} else {
			response = await this.requester.request(url, options);
		}
		if (response.statusCode !== 200) {
			throw new HTTPError(`Request failed with status code ${response.statusCode}`, response.statusCode);
		}
		return response;
	}

	/**
	 * Load chapters for this work.
	 * @returns {Promise<void>}
	 */
	async loadChapters() {
		// TODO: Implement this
	}
}

module.exports = Work;