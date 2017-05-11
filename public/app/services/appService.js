angular.module('appService', [])
	.factory('App', function($http, $window, $q, AuthToken) {
		var appFactory = {};

		appFactory.getLocations = function() {
			return $http.get('/api/getLocations');
		};

		appFactory.getAllLocations = function() {
			return $http.get('/api/getAllLocations');
		}

		appFactory.getLocationData = function(id) {
			return $http.get('/api/getLocationData/' + id);
		};

		appFactory.assignUserToLocation = function(locationID, username) {
			return $http.post('/api/assignLocation', { id: locationID, username: username});
		};

		appFactory.removeUserFromLocation = function(locationID, username) {
			return $http.post('/api/removeUserFromLocation', { id: locationID, username: username });
		};

		appFactory.getDevice = function(id) {
			return $http.get('/api/getDevice/' + id);
		};

		appFactory.getDevices = function() {
			return $http.get('/api/getDevices');
		};

		appFactory.getCommand = function(id) {
			return $http.get('/api/getCommand/' + id);
		};

		appFactory.editDevice = function(id, name) {
			return $http.post('/api/editDevice/' + id, { deviceName: name });
		};

		appFactory.getCommandData = function(id) {
			return $http.get('/api/getCommand/' + id);
		};

		appFactory.toggleActiveUser = function(id) {
			return $http.get('/api/toggleActiveUser/' + id);
		};

		appFactory.getToken = function() {
			return $http.get('/api/getToken');
		};

		appFactory.getUsers = function() {
			return $http.get('/api/getUsers');
		};

		appFactory.getMeasurementData = function(id) {
			return $http.get('/api/getMeasurement/' + id);
		};

		appFactory.createDevice = function(id, name, type) {
			return $http.post('/api/addDevice', { locationID: id, deviceName: name, deviceType: type });
		};

		appFactory.createMeasurement = function(name, value, options) {
			return $http.post('/api/addMeasurement', { name: name, options: options, value: value });
		};

		appFactory.createCommand = function(name, value, options) {
			return $http.post('/api/addCommand', { name: name, options: options, state: value });
		};

		appFactory.getTypes = function() {
			return $http.get('/api/getTypes');
		};

		appFactory.createType = function(name, command, measurement) {
			return $http.post('/api/addType', { name: name, commands: command, measurements: measurement });
		};

		appFactory.getMeasurements = function() {
			return $http.get('/api/getMeasurements');
		};

		appFactory.getCommands = function() {
			return $http.get('/api/getCommands');
		};

		appFactory.sendCommand = function(devID, option, locID, comID) {
			return $http.post('/api/sendCommand', { deviceID: devID, command: option, locationID: locID, commandID: comID });
		};

		appFactory.createLocation = function(name) {
			return $http.post('/api/createLocation', { name: name });
		};

		appFactory.getMessages = function() {
			return $http.get('/api/getMessages');
		};

		appFactory.sendMessage = function(sendTo, value) {
			return $http.post('/api/sendMessage', { sendTo: sendTo, value: value });
		};

		return appFactory;
	});