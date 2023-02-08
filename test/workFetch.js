const AO3 = require('../src/index.js');

console.log(JSON.stringify(AO3, null, 2));
const work = new AO3.Work(32207944);

work.reload().then(() => {
	console.log(work.kudos);
	console.log(work.chaptersCount);
	console.log(work.expectedChaptersCount);
	console.log(work.hits);
});