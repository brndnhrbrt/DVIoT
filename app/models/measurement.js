var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Measurement = new Schema({
	name: {
		type: String,
		required: true
	},
	options: [String],
	value: String,
	id: String
});

module.exports = mongoose.model('Measurement', Measurement);