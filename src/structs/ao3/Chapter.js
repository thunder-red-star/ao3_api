const Requester = require('../util/Requester.js');
const cheerio = require('cheerio');
const BaseAO3Error = require('../error/BaseAO3Error.js');
const HTTPError = require("../error/HTTPError");
const Work = require("./Work");
const workIdFromUrl = require("../util/WorkIdFromUrl");

class Chapter {
	/**
	 * Constructor for the Chapter class.
	 * @param {number} id The ID of the chapter.
	 * @param {object} work The work the chapter belongs to.
	 * @param {object} options The options to use.
	 */
	constructor(id, work, options = { load: true }) {
		this.id = id;
		this.work = work;
		this.options = options;
		this.$ = null;
		this.isLoaded = false;
		this.requester = new Requester();
		if (options.load) {
			this.reload();
		}
	}

	/**
	 * Reloads the chapter.
	 * @returns {Chapter} The chapter.
	 * @throws {HTTPError} If the chapter could not be loaded.
	 */
	async reload() {
		/*
		from .works import Work

        for attr in self.__class__.__dict__:
            if isinstance(getattr(self.__class__, attr), cached_property):
                if attr in self.__dict__:
                    delattr(self, attr)

        if self.work is None:
            soup = self.request(f"https://archiveofourown.org/chapters/{self.id}?view_adult=true")
            workid = soup.find("li", {"class": "chapter entire"})
            if workid is None:
                raise utils.InvalidIdError("Cannot find work")
            self._work = Work(utils.workid_from_url(workid.a["href"]))
        else:
            self.work.reload()

        for chapter in self.work.chapters:
            if chapter == self:
                self._soup = chapter._soup
		 */
		const url = `https://archiveofourown.org/chapters/${this.id}?view_adult=true`;
		this.$ = await this.request(url);
		if (this.work === null) {
			const workId = this.$(`li.chapter.entire`).find(`a`).attr(`href`);
			if (workId === undefined) {
				throw new BaseAO3Error(`Cannot find work`);
			}
			this.work = new Work(workIdFromUrl(workId));
		}

		for (const chapter of this.work.chapters) {
			// Load the chapter's soup.
			if (chapter.id === this.id) {
				this.$ = chapter.$;
			}
		}

		this.isLoaded = true;

		return this;
	}


	/**
	 * Authenticity token used to take actions on the chapter.
	 * @returns {string} The authenticity token.
	 */
	get authenticityToken() {
		return this.work.authenticityToken;
	}

	/**
	 * The work.
	 * @returns {Work} The work.
	 */
	get work() {
		return this._work;
	}

	/**
	 * Set the work. Workaround for constructor.
	 * @param {Work} work The work.
	 * @returns {void}
	 */
	set work(work) {
		this._work = work;
	}

	/**
	 * Get the chapter's text
	 * @returns {string} The chapter's text.
	 */
	get text() {
		if (!this.isLoaded) {
			throw new BaseAO3Error(`Chapter is not loaded.`);
		}
		let text = ``;
		if (this.id !== null) {
			const div = this.$(`div[role="article"]`);
			for (let x = 0; x < div.length; x++) {
				const p = div.children('p').eq(x);
				text += `${p.text().replace(`\n`, ``)}\n`;
				if (p.next().is(`string`)) {
					text += p.next().text();
				}
			}
		} else {
			const div = this.$;
			for (let x = 0; x < div.length; x++) {
				const p = div.eq(x);
				text += `${p.text().replace(`\n`, ``)}\n`;
				if (p.next().is(`string`)) {
					text += p.next().text() + `\n`;
				}
			}
		}
		return text;
	}

	/**
	 * Get the chapter's title.
	 * @returns {string} The chapter's title.
	 * @throws {BaseAO3Error} If the chapter is not loaded.
	 */
	get title() {
		if (!this.isLoaded) {
			throw new BaseAO3Error(`Chapter is not loaded.`);
		}
		if (this.id === null) {
			return this.work.title;
		}
		const prefaceGroup = this.$(`div.chapter.preface.group`);
		if (prefaceGroup.length === 0) {
			return `${this.number}`;
		}
		const title = prefaceGroup.find(`h3.title`);
		if (title.length === 0) {
			return `${this.number}`;
		}
		return title.contents().last().text().trim().slice(2);
	}

	/**
	 * Get the chapter's number.
	 * @returns {number} The chapter's number.
	 * @throws {BaseAO3Error} If the chapter is not loaded.
	 */
	get number() {
		if (!this.isLoaded) {
			throw new BaseAO3Error(`Chapter is not loaded.`);
		}
		if (this.id === null) {
			return 1;
		}
		return parseInt(this.$(`div.chapter`).attr(`id`).split(`-`).pop());
	}

	/**
	 * Get the chapter's summary.
	 * @returns {string} The chapter's summary.
	 * @throws {BaseAO3Error} If the chapter is not loaded.
	 */
	get summary() {
		if (!this.isLoaded) {
			throw new BaseAO3Error(`Chapter is not loaded.`);
		}
		const notes = this.$(`div#summary`);
		if (notes.length === 0) {
			return ``;
		}
		let text = ``;
		for (const p of notes.find(`p`)) {
			text += `${p.text()}\n`;
		}
		return text;
	}

	/**
	 * Get the chapter's start notes.
	 * @returns {string} The chapter's start notes.
	 * @throws {BaseAO3Error} If the chapter is not loaded.
	 */
	get startNotes() {
		if (!this.isLoaded) {
			throw new BaseAO3Error(`Chapter is not loaded.`);
		}
		const notes = this.$(`div#notes`);
		if (notes.length === 0) {
			return ``;
		}
		let text = ``;
		for (const p of notes.find(`p`)) {
			text += `${p.text()}\n`;
		}
		return text;
	}

	/**
	 * Get the chapter's end notes.
	 * @returns {string} The chapter's end notes.
	 * @throws {BaseAO3Error} If the chapter is not loaded.
	 */
	get endNotes() {
		if (!this.isLoaded) {
			throw new BaseAO3Error(`Chapter is not loaded.`);
		}
		let notes = this.$(`div#chapter_${this.number}_endnotes`);
		if (notes.length === 0) {
			return ``;
		}
		let text = ``;
		for (const p of notes.find(`p`)) {
			text += `${p.text()}\n`;
		}
		return text;
	}

	/**
	 * Returns the URL to the chapter.
	 * @returns {string} The URL to the chapter.
	 * @throws {BaseAO3Error} If the chapter is not loaded.
	 */
	get url() {
		if (!this.isLoaded) {
			throw new BaseAO3Error(`Chapter is not loaded.`);
		}
		if (this.id === null) {
			return this.work.url;
		}
		return `${this.work.url}/chapters/${this.id}`;
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
			console.log(url);
			throw new HTTPError(`Request failed with status code ${response.statusCode}`, response.statusCode);
		}
		return response;
	}

	/**
	 * Makes a POST request to the AO3 API.
	 * @param url
	 * @param options
	 * @returns {Promise<void>}
	 */
	async post(url, options = {}) {
		let response;
		options.method = `POST`;
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
	 * toString method.
	 * @returns {string}
	 */
	toString() {
		return `[Chapter ${this.id}]`;
	}
}

module.exports = Chapter;