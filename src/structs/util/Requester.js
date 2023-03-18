const undici = require('undici');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class Requester {
	/**
	 * Requester constructor
	 * @param requestsPerWindow {number} The number of requests per window (-1 for unlimited)
	 * @param window {number} The window in milliseconds
	 */
	constructor(requestsPerWindow = 12, window = 60_000) {
		this.requests = [];
		this.requesting = false;
		this.requestsPerWindow = requestsPerWindow;
		this.window = window;
	}

	/**
	 * Set the requests per window
	 * @param requestsPerWindow {number} The number of requests per window (-1 for unlimited)
	 */
	setRequestsPerWindow(requestsPerWindow) {
		this.requestsPerWindow = requestsPerWindow;
	}

	/**
	 * Set the window
	 * @param window {number} The window in milliseconds
	 */
	setWindow(window) {
		this.window = window;
	}

	/**
	 * Add a request to the queue
	 * @param {string} url The url to request
	 * @param {options} options The options to pass to undici
	 * @param {CookieJar} session The session to use
	 */
	async request(url, options = {}, session) {
		if (this.requestsPerWindow !== -1) {
			if (this.requests.length >= this.requestsPerWindow) {
				const t = Date.now();
				while (this.requests.length) {
					if (t - this.requests[0] >= this.window) {
						this.requests.pop();
					} else {
						break;
					}
				}
				if (this.requests.length >= this.requestsPerWindow) {
					await sleep(this.requests[0] + this.window - t);
					this.requests.pop();
				}
			}
		}

		options["maxRedirections"] = 3;
		const requestPromise = undici.request(url, options);
		this.requests.unshift(Date.now());
		return requestPromise;
	}
}

module.exports = Requester;
