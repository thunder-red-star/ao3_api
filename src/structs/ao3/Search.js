const Query = require(`../util/Query`);
const Requester = require(`../util/Requester`);
const HTTPError = require("../error/HTTPError");
const cheerio = require(`cheerio`);
const WorkFromBanner = require("../util/WorkFromBanner");
class Search {
/**
 * AO3 Search constructor.
 * @constructor
 * @param {string} [any_field=""] - Search query that will look for the given term across all searchable fields.
 * @param {string} [title=""] - Search query for the story's title.
 * @param {string} [author=""] - Search query for the story's author.
 * @param {boolean} [single_chapter=false] - Search for stories with only one chapter.
 * @param {number} [word_count=null] - Search query for the story's word count.
 * @param {string} [language=""] - Search query for the story's language.
 * @param {string} [fandoms=""] - Search query for the story's fandom(s).
 * @param {string} [rating=null] - Search query for the story's rating.
 * @param {number} [hits=null] - Search query for the story's hit count.
 * @param {number} [kudos=null] - Search query for the story's kudos count.
 * @param {string} [crossovers=null] - Search query for the story's crossover fandom(s).
 * @param {number} [bookmarks=null] - Search query for the story's bookmark count.
 * @param {number} [comments=null] - Search query for the story's comment count.
 * @param {string} [completion_status=null] - Search query for the story's completion status.
 * @param {number} [page=1] - The page number of the search results to return.
 * @param {string} [sort_column=""] - The column to sort the search results by.
 * @param {string} [sort_direction=""] - The direction to sort the search results in (ascending or descending).
 * @param {string} [revised_at=""] - Search for stories revised on or after the given date.
 * @param {string} [characters=""] - Search query for the story's character(s).
 * @param {string} [relationships=""] - Search query for the story's relationship(s).
 * @param {string} [tags=""] - Search query for the story's tag(s).
 * @param {Object} [session=null] - An object representing the user's session.
 */
	constructor(
		any_field = ``,
		title = ``,
		author = ``,
		single_chapter = false,
		word_count = null,
		language = ``,
		fandoms = ``,
		rating = null,
		hits = null,
		kudos = null,
		crossovers = null,
		bookmarks = null,
		comments = null,
		completion_status = null,
		page = 1,
		sort_column = ``,
		sort_direction = ``,
		revised_at = ``,
		characters = ``,
		relationships = ``,
		tags = ``,
		session = null
	) {
		this.any_field = any_field;
		this.title = title;
		this.author = author;
		this.single_chapter = single_chapter;
		this.word_count = word_count;
		this.language = language;
		this.fandoms = fandoms;
		this.characters = characters;
		this.relationships = relationships;
		this.tags = tags;
		this.rating = rating;
		this.hits = hits;
		this.kudos = kudos;
		this.crossovers = crossovers;
		this.bookmarks = bookmarks;
		this.comments = comments;
		this.completion_status = completion_status;
		this.page = page;
		this.sort_column = sort_column;
		this.sort_direction = sort_direction;
		this.revised_at = revised_at;
		this.session = session;
		this.results = null;
		this.pages = 0;
		this.total_results = 0;
		this.requester = new Requester();
	}

	/**
	 * Search function for Archive of Our Own (AO3) works.
	 *
	 * @function
	 * @param {string|null} any_field - Any text to be searched.
	 * @param {string|null} title - Title of the work.
	 * @param {string|null} author - Creator of the work.
	 * @param {boolean|null} single_chapter - Whether the work has a single chapter.
	 * @param {string|null} word_count - Word count of the work.
	 * @param {string|null} language - Language of the work.
	 * @param {string|null} fandoms - Names of the fandoms the work belongs to.
	 * @param {string|null} rating - Rating of the work.
	 * @param {string|null} hits - Number of hits on the work.
	 * @param {string|null} kudos - Number of kudos on the work.
	 * @param {boolean|null} crossovers - Whether the work is a crossover.
	 * @param {string|null} bookmarks - Number of bookmarks on the work.
	 * @param {string|null} comments - Number of comments on the work.
	 * @param {boolean|null} completion_status - Whether the work is complete or not.
	 * @param {number|null} page - Page number of the search results.
	 * @param {string|null} sort_column - Column to sort the search results by.
	 * @param {string|null} sort_direction - Direction to sort the search results in.
	 * @param {string|null} revised_at - Date the work was last revised.
	 * @param {object|null} session - Optional requests.Session object.
	 * @param {string|null} characters - Names of characters in the work.
	 * @param {string|null} relationships - Names of relationships in the work.
	 * @param {string|null} tags - Freeform tags associated with the work.
	 * @returns {Promise} A promise that resolves with a Soup object or a Cheerio object.
	 */
	search(any_field, title, author, single_chapter, word_count, language, fandoms, rating, hits, kudos, crossovers, bookmarks, comments, completion_status, page, sort_column, sort_direction, revised_at, session, characters, relationships, tags) {
		return new Promise((resolve, reject) => {
			const query = new Query();
			query.addField(`work_search[query]=${any_field || ''}`);
			if (page !== 1) {
				query.addField(`page=${page}`);
			}
			if (title) {
				query.addField(`work_search[title]=${title}`);
			}
			if (author) {
				query.addField(`work_search[creators]=${author}`);
			}
			if (single_chapter) {
				query.addField('work_search[single_chapter]=1');
			}
			if (word_count) {
				query.addField(`work_search[word_count]=${word_count}`);
			}
			if (language) {
				query.addField(`work_search[language_id]=${language}`);
			}
			if (fandoms) {
				query.addField(`work_search[fandom_names]=${fandoms}`);
			}
			if (characters) {
				query.addField(`work_search[character_names]=${characters}`);
			}
			if (relationships) {
				query.addField(`work_search[relationship_names]=${relationships}`);
			}
			if (tags) {
				query.addField(`work_search[freeform_names]=${tags}`);
			}
			if (rating) {
				query.addField(`work_search[rating_ids]=${rating}`);
			}
			if (hits) {
				query.addField(`work_search[hits]=${hits}`);
			}
			if (kudos) {
				query.addField(`work_search[kudos_count]=${kudos}`);
			}
			if (crossovers !== null) {
				query.addField(`work_search[crossover]=${crossovers ? 'T' : 'F'}`);
			}
			if (bookmarks) {
				query.addField(`work_search[bookmarks_count]=${bookmarks}`);
			}
			if (comments) {
				query.addField(`work_search[comments_count]=${comments}`);
			}
			if (completion_status !== null) {
				query.addField(`work_search[complete]=${completion_status ? 'T' : 'F'}`);
			}
			if (sort_column) {
				query.addField(`work_search[sort_column]=${sort_column}`);
			}
			if (sort_direction) {
				query.addField(`work_search[sort_direction]=${sort_direction}`);
			}
			if (revised_at) {
				query.addField(`work_search[revised_at]=${revised_at}`);
			}

			const url = `https://archiveofourown.org/works/search?${query.string}`;
			console.log(url);
			if (session) {
				session.request(url).then(($) => {
					resolve($);
				}).catch((err) => {
					reject(err);
				});
			} else {
				this.request(url).then(($) => {
					resolve($);
				}).catch((err) => {
					reject(err);
				});
			}
		});
	}

	/**
	 * Updates the current search results by performing a new search based on the current search parameters.
	 *
	 * @returns {Promise<void>} A Promise that resolves with no value when the search has completed successfully.
	 * @throws {HTTPError} If the server returns a 429 status code (rate limit exceeded).
	 */
	update() {
		return new Promise((resolve, reject) => {
			this.search(
				this.any_field, this.title, this.author, this.single_chapter, this.word_count, this.language, this.fandoms,
				this.rating, this.hits, this.kudos, this.crossovers, this.bookmarks, this.comments, this.completion_status,
				this.page, this.sort_column, this.sort_direction, this.revised_at, this.session, this.characters,
				this.relationships, this.tags
			).then(($) => {
				const results = $('ol.work.index.group');
				if (results === null && $('p').text() === 'No results found. You may want to edit your search to make it less specific.') {
					this.results = [];
					this.total_results = 0;
					this.pages = 0;
					resolve();
					return;
				}

				const works = [];
				/*
				 for work in results.find_all("li", {"role": "article"}):
            if work.h4 is None:
                continue

            new = get_work_from_banner(work)
            new._session = self.session
            works.append(new)
				 */
				results.find('li[role="article"]').each((i, work) => {
					const workdiv = $(work);
					if (workdiv.find('h4').length === 0) {
						return;
					}
					const new_work = WorkFromBanner(workdiv);
					new_work._session = this.session;
					works.push(new_work);
				});

				this.results = works;
				const maindiv = $('div.works-search.region#main');
				this.total_results = parseInt(maindiv.find('h3.heading').text().trim().split(' ')[0], 10);
				this.pages = Math.ceil(this.total_results / 20);
				resolve();
			}).catch(reject);
		});
	}

	/**
	 * Reload (alias for update).
	 * @returns {Promise<void>} A Promise that resolves with no value when the search has completed successfully.
	 * @throws {HTTPError} If the server returns a 429 status code (rate limit exceeded).
	 */
	reload() {
		return this.update();
	}

	/**
	 * Makes a request to the AO3 API and puts the response into a Cheerio object.
	 * @param url
	 * @param options
	 * @returns {Promise<CheerioAPI>}
	 */
	async request(url, options = {}) {
		const response = await this.get(url, options);
		const body = await response.body.text();
		if (body.length > 650000) {
			console.warn(`The page is really long! It may take a while to parse.`);
		}
		return cheerio.load(body);
	}

	/**
	 * Makes a request to the AO3 API, keeping in mind rate limits.
	 * @param url
	 * @param options
	 * @returns {Promise<void>}
	 */
	async get(url, options = {}) {
		let response;
		if (options.session) {
			response = await this.requester.request(url, options, options.session);
		} else {
			response = await this.requester.request(url, options);
		}
		if (response.statusCode > 399) {
			throw new HTTPError(`Request failed with status code ${response.statusCode}`, response.statusCode);
		}
		return response;
	}
}

module.exports = Search;