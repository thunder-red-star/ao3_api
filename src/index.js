const Work = require('./structs/ao3/Work.js');

class AO3 {
	/**
	 * Constructor for the AO3 API class.
	 * @param {object} options The options to use.
	 */
	constructor(options = {}) {
		this.options = options;
	}

	/**
	 * Attach work object to the API.
	 */
	get Work() {
		return Work;
	}
}

module.exports = AO3;