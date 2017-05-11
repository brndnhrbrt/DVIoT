angular.module('dviotApp', ['ngAnimate', 'app.routes', 'authService', 'appService', 'mainCtrl'])
	.config(function($httpProvider) {
		$httpProvider.interceptors.push('AuthInterceptor');
	});