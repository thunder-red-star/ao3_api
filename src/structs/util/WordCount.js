/**
 * Get the number of words in an AO3 text work.
 * @param {string} text The text to get the word count from.
 * @returns {number} The number of words.
 */
function WordCount(text) {
	return text.split(` `).filter(word => word !== ``).length;
}

module.exports = WordCount;