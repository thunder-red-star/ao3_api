// Session class for AO3
const cookieJar = require('tough-cookie').CookieJar;
const AuthError = require('../error/AuthError.js');
const BaseAO3Error = require('../error/BaseAO3Error.js');
const HTTPError = require('../error/HTTPError.js');
const User = require('./User.js');
const cheerio = require("cheerio");

class Session {
	/**
	 * Constructor for the Session class.
	 * @param {string} username The username to use.
	 * @param {string} password The password to use.
	 * @param {object} options The options to use.
	 */
	constructor(username, password, options = {}) {
		this.options = options;
		this.cookieJar = new cookieJar();
			this.username = username;
		this.password = password;
		this.authed = false;
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
}