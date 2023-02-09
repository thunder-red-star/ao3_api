const AO3 = require('../src/index.js');

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

// Load the user
const user = new AO3.User("thunderredstar")
user.reload().then(() => {
	console.log(user.name);
	console.log(user.url);
	console.log(user.avatar);
	console.log(user.nWorks);
});