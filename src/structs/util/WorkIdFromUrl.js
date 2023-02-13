/**
 * Work ID from URL
 * @param {string} url The URL to get the work ID from.
 * @returns {number} The work ID.
 */
function WorkIdFromUrl(url) {
	let splitUrl = url.split("/");
	let index = splitUrl.indexOf("works");
	if (index !== -1) {
		if (splitUrl.length >= index + 1) {
			let workId = splitUrl[index + 1].split("?")[0];
			if (Number.isInteger(parseInt(workId))) {
				return parseInt(workId);
			}
		}
	}
}

module.exports = WorkIdFromUrl;