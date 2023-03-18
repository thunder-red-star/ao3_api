const User = require('./structs/ao3/User.js');
const Work = require('./structs/ao3/Work.js');
const Session = require('./structs/ao3/Session.js');
const Search = require('./structs/ao3/Search.js');
const Chapter = require('./structs/ao3/Chapter.js');

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
	static Search = Search;
	static Chapter = Chapter;
}

module.exports = AO3;
