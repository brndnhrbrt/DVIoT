angular.module('authService', [])
	.factory('Auth', function($http, $window, $q, AuthToken) {
		var authFactory = {};

		authFactory.login = function(username, password) {
			$window.localStorage.removeItem('token');
			return $http.post('/api/authenticate', {
				username: username,
				password: password
			}).success(function(data) {
				AuthToken.setToken(data.token);
				return data;
			});
		};

		authFactory.logout = function() {
			AuthToken.setToken();
		};

		authFactory.registerUser = function(username, password) {
			return $http.post('/api/registerUser', {
				username: username,
				password: password
			});
		};

		authFactory.isLoggedIn = function() {
			if(AuthToken.getToken())
				return true;
			else
				return false;
		};

		authFactory.getUser = function() {
			if(AuthToken.getToken()) {
				return $http.get('/api/me', {
					cache: true
				});
			} else {
				return $q.reject({
					message: 'Token not found'
				});
			}
		};

		return authFactory;
	})
	.factory('AuthToken', function($window) {
		var authTokenFactory = {};
		authTokenFactory.storageDisabled = false;

		authTokenFactory.getToken = function() {
			return $window.localStorage.getItem('token');
		};

		authTokenFactory.setToken = function(token) {
			if(token) {
				try {
					$window.localStorage.setItem('token', token);
				} catch(error) {
					authTokenFactory.storageDisabled = true;
				}
			} else {
				$window.localStorage.removeItem('token');
			}
		};

		authTokenFactory.returnStorageMode = function() {
			var testKey = 'test';
			var storage = window.localStorage;
			try {
				storage.setItem(testKey, 'test');
				storage.removeItem(testKey);
			} catch(error) {
				authTokenFactory.storageDisabled = true;
				return true;
			}
			return false;
		};

		return authTokenFactory;
	})
	.factory('AuthInterceptor', function($q, $location, AuthToken) {
		var interceptorFactory = {};

		interceptorFactory.request = function(config) {
			var token = AuthToken.getToken();
			if(token)
				config.headers['x-access-token'] = token;
			return config;
		};

		interceptorFactory.responseError = function(response) {
			if(response.status = 403) {
				AuthToken.setToken();
				$location.path('/login');
			}
			return $q.reject(response);
		};

		return interceptorFactory;
	});