// AO3 Work Object
const Requester = require('../util/Requester.js');
const cheerio = require('cheerio');
const BaseAO3Error = require('../error/BaseAO3Error.js');
const HTTPError = require("../error/HTTPError");
const Chapter = require("./Chapter");

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
	constructor(id, options = { load: true }) {
		this.id = id;
		this.options = options;
		this.chapters = [];
		this.requester = new Requester();
		if (this.options.load) {
			this.reload();
		}
		this.data = {};
	}

	/**
	 * Loads number of Kudos the work has.
	 * @returns {number} The number of Kudos.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get kudos() {
		if (this.data.kudos !== undefined) {
			return this.data.kudos;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.kudos = parseInt(this.$('dd.kudos').text().replace(/,/g, ''));
			return parseInt(this.$('dd.kudos').text().replace(/,/g, ''));
		}
	}

	/**
	 * Loads number of chapters the work has.
	 * @returns {number} The number of chapters.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get nChapters() {
		if (this.data.nChapters !== undefined) {
			return this.data.nChapters;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.nChapters = parseInt(this.$('dd.chapters').text().split('/')[0].replace(/,/g, ''));
			return parseInt(this.$('dd.chapters').text().split('/')[0].replace(/,/g, ''));
		}
	}

	/**
	 * Loads number of expected chapters the work has.
	 * @returns {number} The number of expected chapters.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get expectedChapters() {
		if (this.data.expectedChapters !== undefined) {
			return this.data.expectedChapters;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			let chapters = parseInt(this.$('dd.chapters').text().split('/')[1].replace(/,/g, '').replace('?', ''));
			if (isNaN(chapters)) {
				this.data.expectedChapters = null;
				return null;
			} else {
				this.data.expectedChapters = chapters;
				return chapters;
			}
		}
	}

	/**
	 * Loads the status of the work.
	 * @returns {string} The status of the work.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get status() {
		if (this.data.status !== undefined) {
			return this.data.status;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.status = this.chaptersCount === this.expectedChaptersCount ? 'Completed' : 'Work in Progress';
			return this.chaptersCount === this.expectedChaptersCount ? 'Completed' : 'Work in Progress';
		}
	}

	/**
	 * Loads the number of hits the work has.
	 * @returns {number} The number of hits.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get hits() {
		if (this.data.hits !== undefined) {
			return this.data.hits;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.hits = parseInt(this.$('dd.hits').text().replace(/,/g, ''));
			return parseInt(this.$('dd.hits').text().replace(/,/g, ''));
		}
	}

	/**
	 * Loads the number of comments the work has.
	 * @returns {number} The number of comments.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get comments() {
		if (this.data.comments !== undefined) {
			return this.data.comments;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.comments = parseInt(this.$('dd.comments').text().replace(/,/g, ''));
			return parseInt(this.$('dd.comments').text().replace(/,/g, ''));
		}
	}

	/**
	 * Loads the word count of the work.
	 * @returns {number} The word count.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get wordCount() {
		if (this.data.wordCount !== undefined) {
			return this.data.wordCount;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.wordCount = parseInt(this.$('dd.words').text().replace(/,/g, ''));
			return parseInt(this.$('dd.words').text().replace(/,/g, ''));
		}
	}

	/**
	 * Whether the work is restricted or not.
	 * @returns {boolean} Whether the work is restricted or not.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get restricted() {
		if (this.data.restricted !== undefined) {
			return this.data.restricted;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.restricted = this.$('img[title="Restricted"]').length > 0;
			return this.$('img[title="Restricted"]').length > 0;
		}
	}

	/**
	 * Loads the language of the work.
	 * @returns {string} The language of the work.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get language() {
		if (this.data.language !== undefined) {
			return this.data.language;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.language = this.$('dd.language').text().trim();
			return this.$('dd.language').text().trim();
		}
	}

	/**
	 * Loads the number of bookmarks the work has.
	 * @returns {number} The number of bookmarks.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get bookmarks() {
		if (this.data.bookmarks !== undefined) {
			return this.data.bookmarks;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.bookmarks = parseInt(this.$('dd.bookmarks').text().replace(/,/g, ''));
			return parseInt(this.$('dd.bookmarks').text().replace(/,/g, ''));
		}
	}

	/**
	 * Loads the title of the work.
	 * @returns {string} The title of the work.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get title() {
		if (this.data.title !== undefined) {
			return this.data.title;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.title = this.$('div.preface.group h2.heading').text().trim();
			return this.$('div.preface.group h2.heading').text().trim();
		}
	}

	/**
	 * Loads the date the work was published.
	 * @returns {Date} The date the work was published.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get published() {
		if (this.data.published !== undefined) {
			return this.data.published;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			const date = this.$('dd.published').text().split('-');
			this.data.published = new Date(date[0], date[1] - 1, date[2]);
			return new Date(date[0], date[1] - 1, date[2]);
		}
	}

	/**
	 * Loads the date the work was last edited.
	 * @returns {Date} The date the work was last updated.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get edited() {
		if (this.data.edited !== undefined) {
			return this.data.edited;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			const download = this.$('li.download');
			if (download.length > 0 && download.find('ul').length > 0) {
				const timestamp = parseInt(download.find('ul a').attr('href').split('=')[1]);
				this.data.edited = new Date(timestamp * 1000);
				return new Date(timestamp * 1000);
			}
			this.data.edited = this.published;
			return this.published;
		}
	}

	/**
	 * Loads the date the work was last updated.
	 * @returns {Date} The date the work was last updated.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get updated() {
		if (this.data.updated !== undefined) {
			return this.data.updated;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			const date = this.$('dd.status').text().split('-');
			this.data.updated = new Date(date[0], date[1] - 1, date[2]);
			return new Date(date[0], date[1] - 1, date[2]);
		}
	}

	/**
	 * Loads all the tags of the work.
	 * @returns {string[]} The tags of the work.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get tags() {
		if (this.data.tags !== undefined) {
			return this.data.tags;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.tags = this.$('dd.freeform.tags li a').map((i, el) => this.$(el).text()).get();
			return this.$('dd.freeform.tags li a').map((i, el) => this.$(el).text()).get();
		}
	}

	/**
	 * Loads the characters in the work.
	 * @returns {string[]} The characters in the work.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get characters() {
		if (this.data.characters !== undefined) {
			return this.data.characters;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.characters = this.$('dd.character.tags li a').map((i, el) => this.$(el).text()).get();
			return this.$('dd.character.tags li a').map((i, el) => this.$(el).text()).get();
		}
	}

	/**
	 * Loads the relationships in the work.
	 * @returns {string[]} The relationships in the work.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get relationships() {
		if (this.data.relationships !== undefined) {
			return this.data.relationships;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.relationships = this.$('dd.relationship.tags li a').map((i, el) => this.$(el).text()).get();
			return this.$('dd.relationship.tags li a').map((i, el) => this.$(el).text()).get();
		}
	}

	/**
	 * Loads the fandom tags in the work.
	 * @returns {string[]} The fandom tags in the work.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get fandoms() {
		if (this.data.fandoms !== undefined) {
			return this.data.fandoms;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.fandoms = this.$('dd.fandom.tags li a').map((i, el) => this.$(el).text()).get();
			return this.$('dd.fandom.tags li a').map((i, el) => this.$(el).text()).get();
		}
	}

	/**
	 * Loads the categories in the work.
	 * @returns {string[]} The categories in the work.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get categories() {
		if (this.data.categories !== undefined) {
			return this.data.categories;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.categories = this.$('dd.category.tags li a').map((i, el) => this.$(el).text()).get();
			return this.$('dd.category.tags li a').map((i, el) => this.$(el).text()).get();
		}
	}

	/**
	 * Loads the warnings in the work.
	 * @returns {string[]} The warnings in the work.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get warnings() {
		if (this.data.warnings !== undefined) {
			return this.data.warnings;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.warnings = this.$('dd.warning.tags li a').map((i, el) => this.$(el).text()).get();
			return this.$('dd.warning.tags li a').map((i, el) => this.$(el).text()).get();
		}
	}

	/**
	 * Loads the ratings in the work.
	 * @returns {string[]} The ratings in the work.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get ratings() {
		if (this.data.ratings !== undefined) {
			return this.data.ratings;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.ratings = this.$('dd.rating.tags li a').map((i, el) => this.$(el).text()).get();
			return this.$('dd.rating.tags li a').map((i, el) => this.$(el).text()).get();
		}
	}

	/**
	 * Loads the summary of the work.
	 * @returns {string} The summary of the work.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get summary() {
		if (this.data.summary !== undefined) {
			return this.data.summary;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.summary = this.$('div.preface.group blockquote.userstuff').text();
			return this.$('div.preface.group blockquote.userstuff').text();
		}
	}

	/**
	 * Loads the start notes of the work.
	 * @returns {string} The start notes of the work.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get startNotes() {
		if (this.data.startNotes !== undefined) {
			return this.data.startNotes;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.startNotes = this.$('div.notes.module p').map((i, el) => this.$(el).text()).get().join('\n');
			return this.$('div.notes.module p').map((i, el) => this.$(el).text()).get().join('\n');
		}
	}

	/**
	 * Loads the end notes of the work.
	 * @returns {string} The end notes of the work.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get endNotes() {
		if (this.data.endNotes !== undefined) {
			return this.data.endNotes;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.endNotes = this.$('div#work_endnotes p').map((i, el) => this.$(el).text()).get().join('\n');
			return this.$('div#work_endnotes p').map((i, el) => this.$(el).text()).get().join('\n');
		}
	}

	/**
	 * Returns the URL of the work.
	 * @returns {string} The URL of the work.
	 */
	get url() {
		return `https://archiveofourown.org/works/${this.id}`;
	}

	/**
	 * Checks if the work is complete.
	 * @returns {boolean} Whether the work is complete.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get complete() {
		if (this.data.complete !== undefined) {
			return this.data.complete;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			const chapterStatus = this.$('dd.chapters').text().split('/');
			return chapterStatus[0] === chapterStatus[1];
		}
	}

	/**
	 * Loads all the collections the work is in.
	 * @returns {string[]} The collections the work is in.
	 * @throws {BaseAO3Error} If the work hasn't been loaded yet
	 */
	get collections() {
		if (this.data.collections !== undefined) {
			return this.data.collections;
		} else {
			if (!this.loaded) {
				throw new BaseAO3Error('Work not loaded yet');
			}
			this.data.collections = this.$('dd.collections a').map((i, el) => this.$(el).text()).get();
			return this.$('dd.collections a').map((i, el) => this.$(el).text()).get();
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
	async reload(loadChapters = true) {
		this.$ = await this.request(`https://archiveofourown.org/works/${this.id}`);
		if (this.$('h2.heading').text().includes('Error 404')) {
			throw new Error('Work not found');
		}
		this.loaded = true;
		if (loadChapters) {
			await this.loadChapters();
		}
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
	async get(url, options = {}) {
		let response;
		if (options.session) {
			response = await this.requester.request(url, options, options.session);
		} else {
			response = await this.requester.request(url, options);
		}
		if (response.statusCode > 399) {
			throw new HTTPError(`Request failed with status code ${response.statusCode}`, response.statusCode);
		}
		return response;
	}

	/**
	 * Load chapters for this work.
	 * @returns {Promise<void>}
	 */
	async loadChapters(load = true) {
		this.chapters = [];
		let $chapters = await this.request(this.url + "/navigate");
		// Find an ol with classes "chapter index group"
		const chaptersList = $chapters('ol.chapter.index.group');
		if (chaptersList.length === 0) {
			return;
		}
		if (this.nChapters > 1) {
			for (let n = 1; n <= this.nChapters; n++) {
				// Find an LI (no class)
				const chapter = chaptersList.children('li').eq(n - 1);
				const id = parseInt(chapter.find('a').attr('href').split('/').pop());
				const c = new Chapter(id, this, { load: load });
				if (load) {
					await c.reload();
				}
				this.chapters.push(c);
			}
		}
		else {
			const c = new Chapter(null, this, { load: load });
			if (load) {
				await c.reload();
			}
			this.chapters.push(c);
		}
	}

	/**
	 * toString method.
	 * @returns {string}
	 */
	toString() {
		return `[Work ${this.id}]`;
	}
}

module.exports = Work;