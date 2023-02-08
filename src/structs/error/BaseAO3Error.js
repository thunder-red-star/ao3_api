class BaseAO3Error extends Error {
	/**
	 * Constructor for the BaseAO3Error class.
	 * @param {string} message
	 */
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = BaseAO3Error;