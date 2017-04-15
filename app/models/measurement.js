var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Measurement = new Schema({
	name: {
		type: String,
		required: true
	},
	value: String,
	devices: [String]
});

module.exports = mongoose.model('Measurement', Measurement);