angular.module('app.routes', ['ngRoute'])
	.config(function($routeProvider, $locationProvider) {
		$routeProvider
			.when('/', {
				templateUrl: 'app/views/pages/home.html',
				controller: 'mainController',
				controllerAs: 'main'
			})
			.when('/login', {
				templateUrl: 'app/views/pages/login.html',
				controller: 'authController',
				controllerAs: 'login'
			})
			.when('/register', {
				templateUrl: '/app/views/pages/register.html',
				controller: 'authController',
				controllerAs: 'register'
			})
			.when('/locations', {
				templateUrl: '/app/views/pages/locations.html',
				controller: 'locController',
				controllerAs: 'loc'
			})
			.when('/addType', {
				templateUrl: '/app/views/pages/addType.html',
				controller: 'adminController',
				controllerAs: 'ty'
			})
			.when('/addMeasurement', {
				templateUrl: '/app/views/pages/createMeasurement.html',
				controller: 'adminController',
				controllerAs: 'mes'
			})
			.when('/listDevices', {
				templateUrl: '/app/views/pages/devices.html',
				controller: 'devController',
				controllerAs: 'dev'
			})
			.when('/editDevice/:devID', {
				templateUrl: '/app/views/pages/editDevice.html',
				controller: 'devController',
				controllerAs: 'dev'
			})
			.when('/getCommand/:id', {
				templateUrl: '/app/views/pages/getCommand.html',
				controller: 'mainController',
				controllerAs: 'com'
			})
			.when('/listToken', {
				templateUrl: '/app/views/pages/token.html',
				controller: 'mainController',
				controllerAs: 'tok'
			})
			.when('/addCommand', {
				templateUrl: '/app/views/pages/createCommand.html',
				controller: 'adminController',
				controllerAs: 'com'
			})
			.when('/location/:id', {
				templateUrl: '/app/views/pages/location.html',
				controller: 'locController',
				controllerAs: 'loc'
			})
			.when('/createLocation', {
				templateUrl: '/app/views/pages/createLocation.html',
				controller: 'locController',
				controllerAs: 'loc'
			})
			.when('/createDevice/:id', {
				templateUrl: '/app/views/pages/createDevice.html',
				controller: 'devController',
				controllerAs: 'dev'
			})
			.when('/manageUsers', {
				templateUrl: '/app/views/pages/manageUsers.html',
				controller: 'mainController',
				controllerAs: 'usr'
			})
			.when('/listUsers', {
				templateUrl: '/app/views/pages/users.html',
				controller: 'mainController',
				controllerAs: 'usr'
			})
			.when('/messages', {
				templateUrl: '/app/views/pages/messages.html',
				controller: 'msgController',
				controllerAs: 'msg'
			})
			.when('/sendMessage', {
				templateUrl: '/app/views/pages/sendMessage.html',
				controller: 'msgController',
				controllerAs: 'msg'
			})
			.when('/private', {
				templateUrl: 'app/views/pages/private.html'
			})
			.when('/:templatePath*', {
				templateUrl: 'app/views/pages/404.html'
			});
		$locationProvider.html5Mode(true);
	});