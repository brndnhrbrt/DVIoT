var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Message = new Schema({
	from: String,
	to: String,
	value: String,
	id: String
});

module.exports = mongoose.model('Message', Message);