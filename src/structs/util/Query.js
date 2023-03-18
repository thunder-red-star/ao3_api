/*
class Query:
    def __init__(self):
        self.fields = []

    def add_field(self, text):
        self.fields.append(text)

    @property
    def string(self):
        return '&'.join(self.fields)
 */

class Query {
	constructor() {
		this.fields = [];
	}

	addField(text) {
		this.fields.push(encodeURI(text));
	}

	get string() {
		return this.fields.join(`&`);
	}
}

module.exports = Query;