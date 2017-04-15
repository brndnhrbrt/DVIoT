var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Location = new Schema({
	name: {
		type: String,
		required: true
	},
	id: {
		type: String,
		required: true,
		index: {
			unique: true
		}
	},
	devices: [String],
	users: [String],
	createdBy: String
});

module.exports = mongoose.model('Location', Location);