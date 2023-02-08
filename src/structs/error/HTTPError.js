const BaseAO3Error = require('./BaseAO3Error');

class HTTPError extends BaseAO3Error {
	/**
	 * Constructor for the HTTPError class.
	 * @param {string} message
	 * @param {number} code
	 */
	constructor(message, code) {
		super(message);
		this.code = code;
	}
}

module.exports = HTTPError;