const Cheerio = require('cheerio');
const url = require("url");

/**
 * Set a variable on an object or class if it isn't null
 * @param {any} object The object to set on
 * @param {string} key The key to set
 * @param {any}  value The value to set the key to
 */
function setIfNotNull (object, key, value) {
	if (value === null || value === undefined) {
		object[key] = value;
	}
}

/**
 * Build a work pseudo-object from a AO3 banner
 * @param {Cheerio} banner The banner to build from
 * @returns {Work} The work pseudo-object
 */
function WorkFromBanner (banner) {
	const User = require('../ao3/User.js');
	const Work = require('../ao3/Work.js');

	let authors = [];
	banner.find('h4 a').each((i, el) => {
		if (el.attribs.rel && el.attribs.rel.includes('author')) {
			authors.push(new User(el.text(), false));
		}
	});

	let urlToWork = banner.find('h4 a')
	let workName = urlToWork.text();

	let work = new Work(urlToWork.attr('href').split('/').pop(), false);

	let fandoms = [];
	banner.find('h5.fandoms a').each((i, el) => {
		fandoms.push(el.text());
	});

	let warnings = [];
	let relationships = [];
	let characters = [];
	let freeforms = [];
	banner.find('ul.tags li').each((i, el) => {
		if (el.attribs.class.includes('warnings')) {
			warnings.push(el.text());
		} else if (el.attribs.class.includes('relationships')) {
			relationships.push(el.text());
		} else if (el.attribs.class.includes('characters')) {
			characters.push(el.text());
		} else if (el.attribs.class.includes('freeforms')) {
			freeforms.push(el.text());
		}
	});

	let rating = banner.find('ul.required-tags li.rating').text();
	let categories = banner.find('ul.required-tags li.category').text().split(', ');

	let summary = banner.find('blockquote.userstuff.summary').text();

	let series = [];
	banner.find('ul.series a').each((i, el) => {
		let seriesid = el.attribs.href.split('/').pop();
		let seriesname = el.text();
		let s = new Series(seriesid, false);
		s.name = seriesname;
		series.push(s);
	});

	let language = banner.find('ul.stats li.language').text();
	let words = banner.find('ul.stats li.words').text().replace(',', '');
	if (words.match(/^\d+$/)) {
		words = parseInt(words);
	}
	let bookmarks = banner.find('ul.stats li.bookmarks').text().replace(',', '');
	if (bookmarks.match(/^\d+$/)) {
		bookmarks = parseInt(bookmarks);
	}
	let chapters = banner.find('ul.stats li.chapters').text().split('/')[0].replace(',', '');
	if (chapters.match(/^\d+$/)) {
		chapters = parseInt(chapters);
	}
	let expectedChapters = banner.find('ul.stats li.chapters').text().split('/')[1].replace(',', '');
	if (expectedChapters.match(/^\d+$/)) {
		expectedChapters = parseInt(expectedChapters);
	}
	let hits = banner.find('ul.stats li.hits').text().replace(',', '');
	if (hits.match(/^\d+$/)) {
		hits = parseInt(hits);
	}
	let kudos = banner.find('ul.stats li.kudos').text().replace(',', '');
	if (kudos.match(/^\d+$/)) {
		kudos = parseInt(kudos);
	}
	let comments = banner.find('ul.stats li.comments').text().replace(',', '');
	if (comments.match(/^\d+$/)) {
		comments = parseInt(comments);
	}
	let restricted = banner.find('img[title="Restricted"]').length > 0;
	let complete = null;
	if (chapters !== null) {
		complete = chapters === expectedChapters;
	}

	let dateUpdated = banner.find('p.datetime').text();
	if (dateUpdated !== null) {
		dateUpdated = new Date(dateUpdated);
	}

	setIfNotNull(work, "authors", authors);
	setIfNotNull(work, "bookmarks", bookmarks);
	setIfNotNull(work, "categories", categories);
	setIfNotNull(work, "nchapters", chapters);
	setIfNotNull(work, "characters", characters);
	setIfNotNull(work, "complete", complete);
	setIfNotNull(work, "updated", dateUpdated);
	setIfNotNull(work, "expected_chapters", expectedChapters);
	setIfNotNull(work, "fandoms", fandoms);
	setIfNotNull(work, "hits", hits);
	setIfNotNull(work, "comments", comments);
	setIfNotNull(work, "kudos", kudos);
	setIfNotNull(work, "language", language);
	setIfNotNull(work, "rating", rating);
	setIfNotNull(work, "relationships", relationships);
	setIfNotNull(work, "restricted", restricted);
	setIfNotNull(work, "series", series);
	setIfNotNull(work, "summary", summary);
	setIfNotNull(work, "tags", freeforms);
	setIfNotNull(work, "title", workName);
	setIfNotNull(work, "warnings", warnings);
	setIfNotNull(work, "words", words);

	return work;
}

module.exports = WorkFromBanner;