const AO3 = require('../src/index.js');

const dotenv = require('dotenv');
dotenv.config();

/*

// Oneshot
console.log(JSON.stringify(AO3, null, 2));
const work = new AO3.Work(32207944);

work.reload().then(() => {
	console.log(work.kudos);
	console.log(work.chaptersCount);
	console.log(work.expectedChaptersCount);
	console.log(work.hits);
	console.log(work.status);
	console.log(work.title);
	console.log(work.tags);
	console.log(work.edited);
	console.log(work.published);
	console.log(work.url);
	console.log(work.ratings);
	console.log(work.warnings);
	console.log(work.categories);
	console.log(work.fandoms);
	console.log(work.relationships);
});

// User
const user = new AO3.User("thunderredstar")
user.reload().then(() => {
	console.log(user.name);
	console.log(user.url);
	console.log(user.avatar);
	console.log(user.nWorks);
});

// Session
const session = new AO3.Session(process.env.AO3_USER, process.env.AO3_PASS);
session.login().then(async () => {
	// Load history
	let nBookmarks = await session.nBookmarks();
	console.log(`You have ${nBookmarks} bookmarks.`);
});
*/

// Multichapter
const work2 = new AO3.Work(41195370);

work2.reload().then(() => {
	console.log(work2.nChapters);
	console.log(work2.expectedChapters);
	console.log(work2.authors);
	console.log(work2.chapters.toString());
	work2.chapters[0].reload().then(() => {
		console.log(work2.chapters[0].title);
		console.log(work2.chapters[0].text);
	});
});

/*
// promises are nasty, rewrite with async/await.
(async () => {
	await work2.reload();
	console.log(work2.nChapters);
	console.log(work2.expectedChapters);
	console.log(work2.chapters.toString());
	await work2.chapters[0].reload();
	// console.log(work2.chapters[0].title);
	console.log(work2)
	console.log(work2.chapters[0].title)
	console.log(work2.chapters[0].text);
})();
 */