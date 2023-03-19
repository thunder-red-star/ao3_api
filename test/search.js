const AO3 = require('../src/index.js');

const dotenv = require('dotenv');
dotenv.config();

let search = new AO3.Search(`test`);
search.update().then(() => {
	for (result of search.results) {
		console.log(result.title);
		console.log(result.url);
		console.log(result.summary);
	}
});