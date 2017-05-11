angular.module('appService', [])
	.factory('App', function($http, $window, $q, AuthToken) {
		var appFactory = {};

		appFactory.getLocations = function() {
			return $http.get('/api/getLocations');
		};

		appFactory.getLocationData = function(id) {
			return $http.get('/api/getLocationData/' + id);
		};

		appFactory.getDevices = function(id) {
			return $http.get('/api/getDevices/' + id);
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
			return $http.post('/api/addType', { name: name, commands: [command], measurements: [measurement]});
		};

		appFactory.getMeasurements = function() {
			return $http.get('/api/getMeasurements');
		};

		appFactory.getCommands = function() {
			return $http.get('/api/getCommands');
		};

		appFactory.createLocation = function(name) {
			return $http.post('/api/createLocation', { name: name });
		};

		return appFactory;
	});