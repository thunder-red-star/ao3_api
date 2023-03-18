// AO3 User Object
const Requester = require('../util/Requester.js');
const cheerio = require('cheerio');
const BaseAO3Error = require('../error/BaseAO3Error.js');
const HTTPError = require("../error/HTTPError");
const AuthError = require("../error/AuthError");
const Work = require("./Work");
const workFromBanner = require("../util/WorkFromBanner");
class User {
	/**
	 * Constructor for the User class.
	 * @param {string} username The username of the user.
	 * @param {object} options The options to use.
	 *
	 * Options:
	 * - session: The session to use for requests.
	 * - load: Whether to load the user on instantiation.
	 */
	constructor(username, options = {}) {
		this.username = username;
		this.options = options;
		this.requester = options.requester || new Requester();
		this.worksLoaded = false;
		this.profileLoaded = false;
		this.bookmarksLoaded = false;
		if (options.load) {
			this.load();
		}
		this.data = {};
	}

	/**
	 * Loads the number of works the user has.
	 * @returns {number} The number of works the user has.
	 * @throws {BaseAO3Error} If the user is not loaded.
	 */
	get nWorks() {
		if (this.data.nWorks) {
			return this.data.nWorks;
		} else {
			if (!this.worksLoaded) {
				throw new BaseAO3Error(`User works not loaded.`);
			}
			const count = this.$works('div#inner span.current').text().replace('(', '').replace(')', '').split(' ')[1];
			return parseInt(count);
		}
	}

	/**
	 * Loads the number of pages of works the user has.
	 * @returns {number} The number of pages of works the user has.
	 * @throws {BaseAO3Error} If the user is not loaded.
	 * @private
	 */
	get _worksPages() {
		if (this.data._worksPages) {
			return this.data._worksPages;
		} else {
			if (!this.worksLoaded) {
				throw new BaseAO3Error(`User works not loaded.`);
			}
			const pages = this.$works('ol[title="pagination"]');
			if (pages.length === 0) {
				return 1;
			}
			let n = 1;
			for (const li of pages.find('li')) {
				const text = li.text();
				if (Number.isInteger(parseInt(text))) {
					n = parseInt(text);
				}
			}
			this.data._worksPages = n;
			return n;
		}
	}

	/**
	 * Loads information about the user.
	 * @param {object} options What to load about the user.
	 * @returns {Promise<User>}
	 * @throws {BaseAO3Error}
	 */
	async reload(options = {profile: true, works: true, bookmarks: true}) {
		if (options.works) {
			this.works = await this.getWorks();
			this.worksLoaded = true;
		}
		if (options.profile) {
			this.profile = await this.getProfile();
			this.profileLoaded = true;
		}
		if (options.bookmarks) {
			this.bookmarks = await this.getBookmarks();
			this.bookmarksLoaded = true;
		}
	}

	/**
	 * Gets the works of the user.
	 * @returns {Promise<Work[]>} The works of the user.
	 * @throws {BaseAO3Error} If the user is not loaded.
	 */
	async getWorks() {
		const works = [];
		this.$works = await this.request(`https://archiveofourown.org/users/${this.username}/works`);
		if (this.$works('h2.heading').text().includes('Error 404')) {
			throw new BaseAO3Error(`User not found.`);
		}
	}

	/**
	 * Creates work objects for the works of the user.
	 * @returns {Promise<Work[]>} The works of the user.
	 * @throws {BaseAO3Error} If the user is not loaded.
	 */
	async getWorkObjects() {
		if (this.works === undefined) {
			// Do not provide a threading option, as promises are already asynchronous.
			this.works = [];
			for (let page = 1; page <= this._worksPages; page++) {
				await this._loadWorks(page);
			}
		}
	}

	/**
	 * Loads a page of works.
	 * @param {number} page The page to load.
	 * @returns {Promise<void>}
	 * @private
	 */
	async _loadWorks(page) {
		const $worksPage = await this.request(`https://archiveofourown.org/users/${this.username}/works?page=${page}`);
		const $works = $worksPage('ol.work.index.group');
		for (const work of $works.find('li[role="article"]')) {
			if (work.find('h4').length === 0) {
				continue;
			}
			this.works.push(await workFromBanner(work));
		}
	}

	/**
	 * Gets the profile of the user.
	 * @returns {Promise<Profile>} The profile of the user.
	 * @throws {BaseAO3Error} If the user is not loaded.
	 */
	async getProfile() {
		// Request the profile page.
		this.$profile = await this.request(`https://archiveofourown.org/users/${this.username}/profile`);
		if (this.$profile('h2.heading').text().includes('Error 404')) {
			throw new BaseAO3Error(`User not found.`);
		}
	}

	/**
	 * Gets the number of bookmarks the user has.
	 * @returns {number} The number of bookmarks the user has.
	 * @throws {BaseAO3Error} If the user is not loaded.
	 */
	get nBookmarks() {
		if (this.data.nBookmarks) {
			return this.data.nBookmarks;
		} else {
			if (!this.bookmarksLoaded) {
				throw new BaseAO3Error(`User bookmarks not loaded.`);
			}
			const count = this.$bookmarks('div#inner span.current').text().replace('(', '').replace(')', '').split(' ')[1];
			this.data.nBookmarks = parseInt(count);
			return parseInt(count);
		}
	}

	/**
	 * Loads the number of pages of bookmarks the user has.
	 * @returns {number} The number of pages of bookmarks the user has.
	 * @throws {BaseAO3Error} If the user is not loaded.
	 */
	get _bookmarksPages() {
		if (!this.bookmarksLoaded) {
			throw new BaseAO3Error(`User bookmarks not loaded.`);
		}
		const pages = this.$bookmarks('ol[title="pagination"]');
		if (pages.length === 0) {
			return 1;
		}
		let n = 1;
		for (const li of pages.find('li')) {
			const text = li.text();
			if (text.match(/^\d+$/)) {
				n = parseInt(text);
			}
		}
		return n;
	}

	/**
	 * Gets the bookmarks of the user.
	 * @returns {Promise<Bookmark[]>} The bookmarks of the user.
	 * @throws {BaseAO3Error} If the user is not loaded.
	 */
	async getBookmarks() {
		const bookmarks = [];
		this.$bookmarks = await this.request(`https://archiveofourown.org/users/${this.username}/bookmarks`);
		if (this.$bookmarks('h2.heading').text().includes('Error 404')) {
			throw new BaseAO3Error(`User not found.`);
		}
	}

	/**
	 * Creates bookmark objects for the bookmarks of the user.
	 * @returns {Promise<Bookmark[]>} The bookmarks of the user.
	 * @throws {BaseAO3Error} If the user is not loaded.
	 */
	async getBookmarkObjects() {
		if (this.bookmarks === undefined) {
			// Do not provide a threading option, as promises are already asynchronous.
			this.bookmarks = [];
			for (let page = 1; page <= this._bookmarksPages; page++) {
				await this._loadBookmarks(page);
			}
		}
	}

	/**
	 * Loads a page of bookmarks.
	 * @param {number} page The page to load.
	 * @returns {Promise<void>}
	 */
	async _loadBookmarks(page) {
		const $bookmarksPage = await this.request(`https://archiveofourown.org/users/${this.username}/bookmarks?page=${page}`);
		const $bookmarks = $bookmarksPage('ol.bookmark.index.group');
		for (const bookmark of $bookmarks.find('li[role="article"]')) {
			if (bookmark.find('h4').length === 0) {
				continue;
			}
			this.bookmarks.push(await workFromBanner(bookmark));
		}
	}

	/**
	 * Gets the biography of the user.
	 * @returns {string} The biography of the user.
	 * @throws {BaseAO3Error} If the user is not loaded.
	 */
	get bio() {
		if (this.data.bio) {
			return this.data.bio;
		} else {
			if (!this.profileLoaded) {
				throw new BaseAO3Error(`User profile not loaded.`);
			}
			const div = this.$profile('div.bio.module');
			if (div.length === 0) {
				return '';
			}
			const blockquote = div.find('blockquote.userstuff');
			this.data.bio = blockquote.text() || '';
			return blockquote.text() || '';
		}
	}

	/**
	 * Gets the URL of the user.
	 * @returns {string}
	 */
	get url() {
		return `https://archiveofourown.org/users/${this.username}`;
	}

	/**
	 * Gets the ID of the user. Requires a logged-in session.
	 * @returns {string}
	 * @throws {BaseAO3Error} If the user is not loaded.
	 * @throws {AuthError} If the user is not logged in.
	 */
	async getID() {
		if (this.user.id) {
			return this.user.id;
		} else {
			if (!this.profileLoaded) {
				throw new BaseAO3Error(`User profile not loaded.`);
			}
			if (!this.session || !this.session.authed) {
				throw new AuthError(`You can only get a user ID using an authenticated session.`);
			}
			const header = this.$profile('div.primary.header.module');
			const input = header.find('input[name="subscription[subscribable_id]"]');
			if (input.length === 0) {
				throw new BaseAO3Error(`Couldn't fetch user ID.`);
			}
			this.user.id = parseInt(input.attr('value'));
			return parseInt(input.attr('value'));
		}
	}

	/**
	 * Gets the name of the user.
	 * @returns {string}
	 */
	get name() {
		return this.username;
	}

	/**
	 * Gets the URL of the user's avatar.
	 * @returns {string}
	 * @throws {BaseAO3Error} If the user is not loaded.
	 */
	get avatar() {
		if (this.data.avatar) {
			return this.data.avatar;
		} else {
			if (!this.profileLoaded) {
				throw new BaseAO3Error(`User profile not loaded.`);
			}
			const icon = this.$profile('p.icon');
			const src = icon.find('img').attr('src');
			this.data.avatar = src || null;
			return src || null;
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
}

module.exports = User;
