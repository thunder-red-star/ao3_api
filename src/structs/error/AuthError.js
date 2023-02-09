const BaseAO3Error = require('./BaseAO3Error');

class AuthError extends BaseAO3Error {
	/**
	 * Constructor for the AuthError class.
	 * @param {string} message
	 * @param {number} code
	 */
	constructor(message, code) {
		super(message);
		this.code = code;
	}
}

module.exports = AuthError;