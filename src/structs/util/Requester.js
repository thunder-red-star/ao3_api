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
	 * @param args {any[]} The arguments to pass to the request
	 */
	async request(...args) {
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

		const requestPromise = undici.request(...args);
		this.requests.unshift(Date.now());
		return requestPromise;
	}
}

module.exports = Requester;