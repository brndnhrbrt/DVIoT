var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Command = new Schema({
	name: {
		type: String,
		required: true
	},
	options: [String],
	state: String,
	devices: [String]
});

module.exports = mongoose.model('Command', Command);