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
			.when('/private', {
				templateUrl: 'app/views/pages/private.html'
			})
			.when('/:templatePath*', {
				templateUrl: 'app/views/pages/404.html'
			});
		$locationProvider.html5Mode(true);
	});