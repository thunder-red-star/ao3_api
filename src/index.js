const User = require('./structs/ao3/User.js');
const Work = require('./structs/ao3/Work.js');

class AO3 {

	/**
	 * Constructor for the AO3 API class.
	 * @param {object} options The options to use.
	 */
	constructor(options = {}) {
		this.options = options;
	}

	static Work = Work;
	static User = User;
}

module.exports = AO3;