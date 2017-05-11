var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Type = new Schema({
	name: {
		type: String,
		required: true
	},
	id: {
		type: String,
		required: true
	},
	commands: String,
	measurements: String
});

module.exports = mongoose.model('Type', Type);