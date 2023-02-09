const User = require('./structs/ao3/User.js');
const Work = require('./structs/ao3/Work.js');
const Session = require('./structs/ao3/Session.js');
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
	static Session = Session;
}

module.exports = AO3;
