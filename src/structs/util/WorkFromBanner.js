const Cheerio = require('cheerio');
const url = require("url");
const Series = require("../ao3/Series");

/**
 * Set a variable on an object or class if it isn't null
 * @param {any} object The object to set on
 * @param {string} key The key to set
 * @param {any}  value The value to set the key to
 */
function setIfNotNull (object, key, value) {
	if (!(value === null || value === undefined)) {
		if (value === "") {
			object[key] = null;
		} else {
			object[key] = value;
		}
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
	let workName;
	let urlToWork;
	banner.find('h4 a').each((i, el) => {
		if (el.attribs.rel && el.attribs.rel.includes('author')) {
			authors.push(new User(el.children[0].data, false));
		} else if (el.attribs.href && el.attribs.href.includes('/works')) {
			// This is the work's name
			workName = el.children[0].data;
			urlToWork = el.attribs.href;
		}
	});

	let work = new Work(urlToWork.split('/').pop(), false);
	let fullWorkURL = "https://archiveofourown.org" + urlToWork;

	let fandoms = [];
	banner.find('h5.fandoms a').each((i, el) => {
		fandoms.push(el.children[0].data);
	});

	let warnings = [];
	let relationships = [];
	let characters = [];
	let freeforms = [];
	banner.find('ul.tags li').each((i, el) => {
		if (el.attribs.class.includes('warnings')) {
			warnings.push(el.children[0].data);
		} else if (el.attribs.class.includes('relationships')) {
			relationships.push(el.children[0].data);
		} else if (el.attribs.class.includes('characters')) {
			characters.push(el.children[0].data);
		} else if (el.attribs.class.includes('freeforms')) {
			freeforms.push(el.children[0].data);
		}
	});

	let rating = banner.find('ul.required-tags li.rating').text();
	let categories = banner.find('ul.required-tags li.category').text().split(', ');

	let summary = banner.find('blockquote.userstuff.summary').text().trim();

	let series = [];
	banner.find('ul.series a').each((i, el) => {
		let seriesid = el.attribs.href.split('/').pop();
		let seriesname = el.children[0].data;
		let s = new Series(seriesid, false);
		s.name = seriesname;
		series.push(s);
	});

	/*
	stats = work.find(attrs={"class": "stats"})
    if stats is not None:
        language = stats.find("dd", {"class": "language"})
        if language is not None:
            language = language.text
        words = stats.find("dd", {"class": "words"})
        if words is not None:
            words = words.text.replace(",", "")
            if words.isdigit(): words = int(words)
            else: words = None
        bookmarks = stats.find("dd", {"class": "bookmarks"})
        if bookmarks is not None:
            bookmarks = bookmarks.text.replace(",", "")
            if bookmarks.isdigit(): bookmarks = int(bookmarks)
            else: bookmarks = None
        chapters = stats.find("dd", {"class": "chapters"})
        if chapters is not None:
            chapters = chapters.text.split('/')[0].replace(",", "")
            if chapters.isdigit(): chapters = int(chapters)
            else: chapters = None
        expected_chapters = stats.find("dd", {"class": "chapters"})
        if expected_chapters is not None:
            expected_chapters = expected_chapters.text.split('/')[-1].replace(",", "")
            if expected_chapters.isdigit(): expected_chapters = int(expected_chapters)
            else: expected_chapters = None
        hits = stats.find("dd", {"class": "hits"})
        if hits is not None:
            hits = hits.text.replace(",", "")
            if hits.isdigit(): hits = int(hits)
            else: hits = None
        kudos = stats.find("dd", {"class": "kudos"})
        if kudos is not None:
            kudos = kudos.text.replace(",", "")
            if kudos.isdigit(): kudos = int(kudos)
            else: kudos = None
        comments = stats.find("dd", {"class": "comments"})
        if comments is not None:
            comments = comments.text.replace(",", "")
            if comments.isdigit(): comments = int(comments)
            else: comments = None
        restricted = work.find("img", {"title": "Restricted"}) is not None
        if chapters is None:
            complete = None
        else:
            complete = chapters == expected_chapters
    else:
        language = words = bookmarks = chapters = expected_chapters = hits = restricted = complete = None

    date = work.find("p", {"class": "datetime"})
    if date is None:
        date_updated = None
    else:
        date_updated = datetime.datetime.strptime(date.getText(), "%d %b %Y")
	 */

	let stats = banner.find('dl.stats');
	let language = stats.find('dd.language').text();
	let words = stats.find('dd.words').text();
	if (words !== null) {
		words = words.replace(',', '');
		if (isNaN(parseInt(words))) {
			words = null;
		} else {
			words = parseInt(words);
		}
	}
	let bookmarks = stats.find('dd.bookmarks').text();
	if (bookmarks !== null) {
		bookmarks = bookmarks.replace(',', '');
		if (isNaN(parseInt(bookmarks))) {
			bookmarks = null;
		} else {
			bookmarks = parseInt(bookmarks);
		}
	}
	let chapters = stats.find('dd.chapters').text();
	if (chapters !== null) {
		chapters = chapters.split('/')[0].replace(',', '');
		if (isNaN(parseInt(chapters))) {
			chapters = null;
		} else {
			chapters = parseInt(chapters);
		}
	}
	let expectedChapters = stats.find('dd.chapters').text();
	if (expectedChapters !== null) {
		expectedChapters = expectedChapters.split('/')[1].replace(',', '');
		if (isNaN(parseInt(expectedChapters))) {
			expectedChapters = null;
		} else {
			expectedChapters = parseInt(expectedChapters);
		}
	}
	let hits = stats.find('dd.hits').text();
	if (hits !== null) {
		hits = hits.replace(',', '');
		if (isNaN(parseInt(hits))) {
			hits = null;
		} else {
			hits = parseInt(hits);
		}
	}
	let kudos = stats.find('dd.kudos').text();
	if (kudos !== null) {
		kudos = kudos.replace(',', '');
		if (isNaN(parseInt(kudos))) {
			kudos = null;
		} else {
			kudos = parseInt(kudos);
		}
	}
	let comments = stats.find('dd.comments').text();
	if (comments !== null) {
		comments = comments.replace(',', '');
		if (isNaN(parseInt(comments))) {
			comments = null;
		} else {
			comments = parseInt(comments);
		}
	}
	let restricted = banner.find('img[title="Restricted"]').length > 0;
	let complete = null;
	if (chapters !== null && expectedChapters !== null) {
		complete = chapters === expectedChapters;
	}
	let dateUpdated = banner.find('p.datetime').text();
	if (dateUpdated !== null) {
		dateUpdated = new Date(dateUpdated);
	}

	let data = {}
	setIfNotNull(data, "authors", authors);
	setIfNotNull(data, "bookmarks", bookmarks);
	setIfNotNull(data, "categories", categories);
	setIfNotNull(data, "nchapters", chapters);
	setIfNotNull(data, "characters", characters);
	setIfNotNull(data, "complete", complete);
	setIfNotNull(data, "updated", dateUpdated);
	setIfNotNull(data, "expected_chapters", expectedChapters);
	setIfNotNull(data, "fandoms", fandoms);
	setIfNotNull(data, "hits", hits);
	setIfNotNull(data, "comments", comments);
	setIfNotNull(data, "kudos", kudos);
	setIfNotNull(data, "language", language);
	setIfNotNull(data, "rating", rating);
	setIfNotNull(data, "relationships", relationships);
	setIfNotNull(data, "restricted", restricted);
	setIfNotNull(data, "series", series);
	setIfNotNull(data, "summary", summary);
	setIfNotNull(data, "tags", freeforms);
	setIfNotNull(data, "title", workName);
	setIfNotNull(data, "warnings", warnings);
	setIfNotNull(data, "words", words);
	setIfNotNull(data, "url", url);
	work.data = data;
	return work;
}

module.exports = WorkFromBanner;