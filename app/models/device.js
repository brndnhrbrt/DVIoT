var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Device = new Schema({
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
	type: {
		type: String,
		required: true
	},
	location: String,
	measurements: [String],
	commands: [String]
});

module.exports = mongoose.model('Device', Device);