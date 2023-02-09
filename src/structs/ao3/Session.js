// Session class for AO3
const cookieJar = require('tough-cookie').CookieJar;
const AuthError = require('../error/AuthError.js');
const BaseAO3Error = require('../error/BaseAO3Error.js');
const HTTPError = require('../error/HTTPError.js');
const User = require('./User.js');
const cheerio = require("cheerio");
const Requester = require('../util/Requester.js');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class Session {
	/**
	 * Constructor for the Session class.
	 * @param {string} username The username to use.
	 * @param {string} password The password to use.
	 * @param {object} options The options to use.
	 */
	constructor(username = null, password = null, options = {}) {
		this.options = options;
		this.cookieJar = new cookieJar();
		this.username = username;
		this.password = password;
		this.authed = false;
		this.requester = new Requester(this.cookieJar);
	}

	/**
	 * Gets the user that we are logged in as.
	 * @returns {User} The user that we are logged in as.
	 * @throws {AuthError} If we are not logged in.
	 */
	get user() {
		if (!this.loggedIn) {
			throw new AuthError(`Not logged in.`);
		}
		return User(this.username, {session: this});
	}

	/**
	 * Leaves a comment on a specified work.
	 * @param {Work | Chapter} commentable The work or chapter to comment on.
	 * @param {string} comment The comment to leave.
	 * @param {boolean} oneShot Whether the comment is a one-shot.
	 * @param {string} replyTo The ID of the comment to reply to.
	 */
	async comment(commentable, comment, oneShot = false, replyTo = null) {
		// TODO: Implement this.
	}

	/**
	 * Leaves a kudos on a specified work.
	 * @param {Work} work The work to give kudos to.
	 * @param {boolean} remove Whether to remove the kudos.
	 */
	async kudos(work) {
		// TODO: Implement this.
	}

	/**
	 * Refreshes the authentication token.
	 * @returns {string} The new authentication token.
	 */
	async refresh() {
		/*
		if self.is_authed:
            req = self.session.get(f"https://archiveofourown.org/users/{self.username}")
        else:
            req = self.session.get("https://archiveofourown.org")

        if req.status_code == 429:
            raise utils.HTTPError("We are being rate-limited. Try again in a while or reduce the number of requests")

        soup = BeautifulSoup(req.content, "lxml")
        token = soup.find("input", {"name": "authenticity_token"})
        if token is None:
            raise utils.UnexpectedResponseError("Couldn't refresh token")
        self.authenticity_token = token.attrs["value"]
		 */
		if (this.authed) {
			await this.get(`https://archiveofourown.org/users/${this.username}`);
		} else {
			await this.get(`https://archiveofourown.org`);
		}
		if (this.status === 429) {
			throw new HTTPError(`We are being rate-limited. Try again in a while or reduce the number of requests.`);
		}
		const token = this.soup.find(`input`, {name: `authenticity_token`});
		if (token === null) {
			throw new UnexpectedResponseError(`Couldn't refresh token.`);
		}
		this.authenticityToken = token.attrs[`value`];
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
		if (response.statusCode !== 200) {
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
		if (response.statusCode !== 200) {
			throw new HTTPError(`Request failed with status code ${response.statusCode}`, response.statusCode);
		}
		return response;
	}

	/**
	 * Logs in to the AO3 API.
	 * @returns {Promise<void>}
	 * @throws {AuthError} If the login failed.
	 * @throws {BaseAO3Error} If something else went wrong.
	 * @throws {HTTPError} If we are being rate-limited.
	 */
	async login() {
		let $ = await this.request(`https://archiveofourown.org/users/login`);
		this.authenticityToken = $(`input[name="authenticity_token"]`).attr(`value`);
		if (this.username === null || this.password === null) {
			throw new AuthError(`Cannot login with no username or password.`);
		}
		const payload = {
			"user[login]": this.username,
			"user[password]": this.password,
			"authenticity_token": this.authenticityToken
		};
		const response = await this.post(`https://archiveofourown.org/users/login`, {params: payload, allowRedirects: false});
		if (response.statusCode !== 302) {
			// Bad login.
			throw new AuthError(`Invalid username or password.`);
		}
		this.authed = true;
		this.subscriptionsURL = `https://archiveofourown.org/users/${this.username}/subscriptions?page={1:d}`;
		this.bookmarksURL = `https://archiveofourown.org/users/${this.username}/bookmarks?page={1:d}`;
		this.historyURL = `https://archiveofourown.org/users/${this.username}/readings?page={1:d}`;

		this.bookmarks = null;
		this.subscriptions = null;
		this.history = null;
	}

	/**
	 * Gets the number of pages of subscriptions.
	 * @returns {number} The number of pages of subscriptions.
	 * @throws {AuthError} If not logged in.
	 * @throws {HTTPError} If we are being rate-limited.
	 */
	async getSubscriptionsPages() {
		/*
		 * url = self._subscriptions_url.format(self.username, 1)
        soup = self.request(url)
        pages = soup.find("ol", {"title": "pagination"})
        if pages is None:
            return 1
        n = 1
        for li in pages.findAll("li"):
            text = li.getText()
            if text.isdigit():
                n = int(text)
        return n
	*/
		if (!this.authed) {
			throw new AuthError(`Not logged in.`);
		}
		const url = this.subscriptionsURL.replace(`{1:d}`, `1`);
		const soup = await this.request(url);
		const pages = soup(`ol[title="pagination"]`);
		if (pages.length === 0) {
			return 1;
		}
		let n = 1;
		for (const li of pages.find(`li`)) {
			let text = li.text();
			if (text.match(/^\d+$/)) {
				n = parseInt(text);
			}
		}
		return n;
	}

	/**
	 * Gets subscriptions.
	 * @returns {Promise<Subscription[]>} The subscriptions.
	 * @throws {AuthError} If not logged in.
	 * @throws {HTTPError} If we are being rate-limited.
	 */
	async getSubscriptions() {
		if (!this.authed) {
			throw new AuthError(`Not logged in.`);
		}
		this.subscriptions = [];
		for (let page = 1; page <= await this.getSubscriptionsPages(); page++) {
			pageSubscriptions = await this._loadSubscriptions(page);
			this.subscriptions = this.subscriptions.concat(pageSubscriptions);
		}
		return this.subscriptions;
	}

	/**
	 * Loads subscriptions from a page.
	 * @param page
	 * @returns {Promise<Subscription[]>} The subscriptions.
	 * @throws {AuthError} If not logged in.
	 * @throws {HTTPError} If we are being rate-limited.
	 * @private
	 */
	async _loadSubscriptions(page = 1) {
		if (!this.authed) {
			throw new AuthError(`Not logged in.`);
		}
		const url = this.subscriptionsURL.replace(`{1:d}`, page.toString());
		const soup = await this.request(url);
		const subscriptions = soup(`dl.subscription.index.group`);
		const subs = [];
		for (const sub of subscriptions.find(`dt`)) {
			if (sub.find(`a[href^="/works"]`).length > 0) {
				let workname = sub.find(`a[href^="/works"]`).text();
				let workid = utils.workidFromURL(sub.find(`a[href^="/works"]`).attr(`href`));
				let authors = [];
				for (const a of sub.find(`a[rel*="author"]`)) {
					let author = new User(a.text(), false);
					authors.push(author);
				}
				let newWork = new Work(workid, false);
				newWork.title = workname;
				newWork.authors = authors;
				subs.push(newWork);
			} else if (sub.find(`a[href^="/users"]`).length > 0) {
				let username = sub.find(`a[href^="/users"]`).text();
				let user = new User(username, false);
				subs.push(user);
			} else if (sub.find(`a[href^="/series"]`).length > 0) {
				let seriesname = sub.find(`a[href^="/series"]`).text();
				let seriesid = parseInt(sub.find(`a[href^="/series"]`).attr(`href`).split(`/`)[2]);
				let authors = [];
				for (const a of sub.find(`a[rel*="author"]`)) {
					let author = new User(a.text(), false);
					authors.push(author);
				}
				let newSeries = new Series(seriesid, false);
				newSeries.name = seriesname;
				newSeries.authors = authors;
				subs.push(newSeries);
			}
		}
		return subs;
	}

	/**
	 * Get number of history pages.
	 * @returns {Promise<number>} The number of history pages.
	 * @throws {AuthError} If not logged in.
	 * @throws {HTTPError} If we are being rate-limited.
	 */
	async getHistoryPages() {
		if (!this.authed) {
			throw new AuthError(`Not logged in.`);
		}
		const url = this.historyURL.replace(`{1:d}`, `1`);
		const soup = await this.request(url);
		const pages = soup(`ol[title="pagination"]`);
		if (pages.length === 0) {
			return 1;
		}
		let n = 1;
		for (const li of pages.find(`li`)) {
			if (li.text().match(/^\d+$/)) {
				n = parseInt(li.text());
			}
		}
		return n;
	}

	/**
	 * Get history.
	 * @returns {Promise<Work[]>} The history.
	 * @throws {AuthError} If not logged in.
	 * @throws {HTTPError} If we are being rate-limited.
	 */
	async getHistory() {
		// TODO: Write body
		if (!this.authed) {
			throw new AuthError(`Not logged in.`);
		}
		for (let page = 1; page <= await this.getHistoryPages(); page++) {
			// Use a try/catch to avoid rate limiting
			try {
				this._loadHistory(page);
			}
			catch (e) {
				// console.log(`History being rate limited, sleeping for ${timeout_sleep} seconds`);
				await sleep(timeout_sleep);
				this._loadHistory(page);
			}
			// Check for maximum history page load
			if (max_pages !== null && page >= max_pages) {
				// console.log(`Reached maximum history page load of ${max_pages}`);
				return this._history;
			}

			// Again attempt to avoid rate limiter, sleep for a few
			// seconds between page requests.
			if (hist_sleep !== null && hist_sleep > 0) {
				await sleep(hist_sleep);
			}
		}

		return this._history;
	}

	/**
	 * Load history.
	 * @param {number} page - The page to load.
	 * @private
	 */
	async _loadHistory(page) {
		if (!this.authed) {
			throw new AuthError(`Not logged in.`);
		}
		const url = this.historyURL.replace(`{1:d}`, page.toString());
		const soup = await this.request(url);
		const history = soup(`ol[class="reading work index group"]`);
		for (const item of history.find(`li[role="article"]`)) {
			let workname = null;
			let workid = null;
			for (const a of item.find(`h4`).find(`a`)) {
				if (a.attr(`href`).startsWith(`/works`)) {
					workname = a.text();
					workid = parseInt(a.attr(`href`).split(`/`)[2]);
				}
			}
			let visitedDate = null;
			let visitedNum = 1;
			for (const viewed of item.find(`h4[class="viewed heading"]`)) {
				dataString = viewed.text();
				dateString = dataString.match(/<span>Last visited:<\/span> (\d{2} .+ \d{4})/);
				if (dateString !== null) {
					rawDate = dateString[1];
					dateObj = new Date(rawDate);
					visitedDate = dateObj;
				}
				visitedString = dataString.match(/Visited (\d+) times/);
				if (visitedString !== null) {
					visitedNum = parseInt(visitedString[1]);
				}
			}

			if (workname !== null && workid !== null) {
				const newWork = new Work(workid, false);
				newWork.title = workname;
				const histItem = [newWork, visitedNum, visitedDate];
				if (!this._history.includes(histItem)) {
					this._history.push(histItem);
				}
			}
		}

		return this._history;
	}

	/**
	 * Get number of bookmarks pages.
	 * @returns {Promise<number>} The number of bookmarks pages.
	 * @throws {AuthError} If not logged in.
	 * @throws {HTTPError} If we are being rate-limited.
	 */
	async getBookmarksPages() {
		if (!this.authed) {
			throw new AuthError(`Not logged in.`);
		}
		const url = this.bookmarksURL.replace(`{1:d}`, `1`);
		const soup = await this.request(url);
		const pages = soup(`ol[title="pagination"]`);
		if (pages.length === 0) {
			return 1;
		}
		let n = 1;
		for (const li of pages.find(`li`)) {
			if (li.text().match(/^\d+$/)) {
				n = parseInt(li.text());
			}
		}
		return n;
	}
	
	/**
	 * Get bookmarks.
	 * @returns {Promise<Work[]>} The bookmarks.
	 * @throws {AuthError} If not logged in.
	 * @throws {HTTPError} If we are being rate-limited.
	 */
	async getBookmarks() {
		if (!this.authed) {
			throw new AuthError(`Not logged in.`);
		}
		let bookmarks = [];
		for (let page = 1; page <= await this.getBookmarksPages(); page++) {
			// No threading.
			bookmarks = bookmarks.concat(await this._loadBookmarks(page));
		}
		return bookmarks;
	}

	/**
	 * Load bookmarks.
	 * @param {number} page - The page to load.
	 * @returns {Promise<Work[]>} The bookmarks.
	 * @private
	 */
	async _loadBookmarks(page) {
		if (!this.authed) {
			throw new AuthError(`Not logged in.`);
		}
		const url = this.bookmarksURL.replace(`{1:d}`, page.toString());
		const soup = await this.request(url);
		const bookmarks = soup(`ol[class="bookmarks index group"]`);
		let works = [];
		for (const item of bookmarks.find(`li[role="article"]`)) {
			let workname = null;
			let workid = null;
			for (const a of item.find(`h4`).find(`a`)) {
				if (a.attr(`href`).startsWith(`/works`)) {
					workname = a.text();
					workid = parseInt(a.attr(`href`).split(`/`)[2]);
				}
			}
			let bookmarkDate = null;
			let bookmarkNum = 1;
			for (const bookmarked of item.find(`h4[class="bookmarked heading"]`)) {
				dataString = bookmarked.text();
				dateString = dataString.match(/<span>Bookmarked:<\/span> (\d{2} .+ \d{4})/);
				if (dateString !== null) {
					rawDate = dateString[1];
					dateObj = new Date(rawDate);
					bookmarkDate = dateObj;
				}
				bookmarkString = dataString.match(/Bookmarked (\d+) times/);
				if (bookmarkString !== null) {
					bookmarkNum = parseInt(bookmarkString[1]);
				}
			}

			if (workname !== null && workid !== null) {
				const newWork = new Work(workid, false);
				newWork.title = workname;
				const bookmarkItem = [newWork, bookmarkNum, bookmarkDate];
				if (!this._bookmarks.includes(bookmarkItem)) {
					this._bookmarks.push(bookmarkItem);
				}
			}
		}
		return this._bookmarks;
	}

	/**
	 * Number of bookmarks.
	 * @returns {number} The number of bookmarks.
	 * @throws {AuthError} If not logged in.
	 * @throws {HTTPError} If we are being rate-limited.
	 */
	async nBookmarks() {
		if (!this.authed) {
			throw new AuthError(`Not logged in.`);
		}
		const url = this.bookmarksURL.replace(`{1:d}`, `1`);
		const soup = await this.request(url);
		const div = soup(`div[id="inner"]`);
		const span = div.find(`span[class="current"]`).text().replace(`(`, ``).replace(`)`, ``);
		const n = span.split(` `)[1];
		return parseInt(n);
	}

	/**
	 * Get stats.
	 * @param {number} year The year to get stats for.
	 * @returns {any} The stats.
	 * @throws {AuthError} If not logged in.
	 * @throws {HTTPError} If we are being rate-limited.
	 */
	async getStats(year = new Date().getFullYear()) {
		/*
		 * def get_statistics(self, year=None):
        year = "All+Years" if year is None else str(year)
        url = f"https://archiveofourown.org/users/{self.username}/stats?year={year}"
        soup = self.request(url) 
        stats = {}
        dt = soup.find("dl", {"class": "statistics meta group"})
        if dt is not None:
            for field in dt.findAll("dt"):
                name = field.getText()[:-1].lower().replace(" ", "_")
                if field.next_sibling is not None and field.next_sibling.next_sibling is not None:
                    value = field.next_sibling.next_sibling.getText().replace(",", "")
                    if value.isdigit():
                        stats[name] = int(value)
        
        return stats
	*/
		if (!this.authed) {
			throw new AuthError(`Not logged in.`);
		}
		const url = `https://archiveofourown.org/users/${this.username}/stats`;
		const $ = await this.request(url);
		const stats = {};
		dt = $(`dl[class="statistics meta group"]`);
		if (dt !== null) {
			for (const field of dt.find(`dt`)) {
				let name = field.text().replace(`:`, ``).toLowerCase().replace(` `, `_`);
				if (field.next_sibling !== null && field.next_sibling.next_sibling !== null) {
					let value = field.next_sibling.next_sibling.text().replace(`,`, ``);
					if (value.match(/^\d+$/)) {
						stats[name] = parseInt(value);
					} else {
						stats[name] = value;
					}
				}
			}
		}
		return stats;
	}
}

module.exports = Session;
