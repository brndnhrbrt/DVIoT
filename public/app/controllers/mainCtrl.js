angular.module('mainCtrl', [])
	.controller('mainController', function($location, $rootScope, Auth) {
		var vm = this;
		vm.loggedIn = Auth.isLoggedIn();

		$rootScope.$on('$routeChangeStart', function() {
			vm.loggedIn = Auth.isLoggedIn();
			Auth.getUser()
				.then(function(data) {
					if(data.data) {
						vm.user = data.data.user;
					}
				});
		});

		vm.doLogout = function() {
			Auth.logout();
			vm.user = undefined;
			$location.path('/');
		};
	})
	.controller('authController', function($location, Auth, AuthToken) {
		var vm = this;

		vm.doLogin = function() {
			vm.processing = true;
			Auth.login(vm.loginData.username, vm.loginData.password)
				.success(function(data) {
					vm.processing = false;
					if(AuthToken.returnStorageMode()) {
						$location.path('/private');
					} else {
						if(data.success) {
							$location.path('/');
						} else {
							vm.error = data.message;
						}
					}
				});
		};

		vm.doRegister = function() {
			vm.processing = true;
			if(vm.registerData.password != vm.registerData.rePassword) {
				vm.error = 'Passwords must match.';
			} else {
				Auth.registerUser(vm.registerData.username, vm.registerData.password)
					.success(function(data) {
						if(data.success) {
							Auth.login(vm.registerData.username, vm.registerData.password)
								.success(function(data) {
									vm.processing = false;
									if(data.success) {
										$location.path('/');
									} else {
										vm.error = data.message;
									}
								});
						} else {
							vm.error = data.message;
						}
					});
			}
		};
	})
	.controller('devController', function($location, $routeParams, App) {
		var vm = this;
		vm.locationID = $routeParams.id;

		vm.createDevice = function(id) {
			if(vm.devData.name && vm.devData.type) {
				vm.processing = true;
				App.getDevices(id, vm.devData.name, vm.devData.type)
					.success(function(data) {
						vm.processing = false;
						if(data.success) {
							$location.path('/location/' + locationID);
						} else {
							vm.message = data.message;
						}
					});
			} else {
				vm.message = 'Please complete the form.'
			}
		};

		vm.getTypes = function() {
			App.getTypes()
				.success(function(data) {
					if(data.success) {
						console.log(data);
						vm.types = data.types;
					} else {
						vm.message = 'Error: No types found.';
					}
				});
		};

		vm.getTypes();

	})
	.controller('adminController', function($location, $routeParams, App, Auth) {
		var vm = this;
		vm.mesCreateOptions = [''];
		vm.comCreateOptions = [''];
		vm.mesValue = '';
		vm.comValue = '';

		vm.checkAdmin = function() {
			Auth.getUser()
				.then(function(data) {
					if(data.data) {
						vm.user = data.data.user;
						if(vm.user.permissionLevel == 0)
							vm.isAdmin = true;
						else
							$location.path('/');
					}
				});
		};

		vm.createType = function(name, commands, measurements) {
			App.createType(name, commands, measurements)
				.success(function(data) {
					if(data.success) {
						vm.message = data.message;
					} else {
						vm.message = data.message;
					}
				});
		};

		vm.createCommand = function() {
			if(vm.createOptionData.name && vm.createOptionData.value) {
				App.createCommand(vm.createOptionData.name, vm.createOptionData.value, vm.comCreateOptions)
					.success(function(data) {
						if(data.success) {
							vm.message = data.message;
						} else {
							vm.message = data.message;
						}
					});
			} else {
				vm.message = 'Please fill out all forms';
			}
		};

		vm.createMeasurement = function() {
			if(vm.createOptionData.name && vm.createOptionData.value) {
				App.createMeasurement(vm.createOptionData.name, vm.createOptionData.value, vm.mesCreateOptions)
					.success(function(data) {
						if(data.success) {
							vm.message = data.message;
						} else {
							vm.message = data.message;
						}
					});
			} else {
				vm.message = 'Please fill out all forms';
			}
		};

		vm.addOption = function() {
			vm.comCreateOptions.push('');
			vm.mesCreateOptions.push('');
		};

		vm.getMeasurementsAndCommands = function() {
			App.getMeasurements()
				.success(function(data) {
					if(data.success) {
						vm.measurements = data.measurements;
					} else {
						vm.message = data.message;
					}
				});
			App.getCommands()
				.success(function(data) {
					if(data.success) {
						vm.commands = data.commands;
					} else {
						vm.message = data.message;
					}
				});
		};

		vm.getMeasurementsAndCommands();

	})
	.controller('locController', function($location, $routeParams, App) {
		var vm = this;
		vm.locationID = $routeParams.id;

		vm.goToLocation = function(id) {
			$location.path('/location/' + id);
		};

		vm.createLocation = function() {
			if(vm.locData.name) {
				vm.processing = true;
				App.createLocation(vm.locData.name)
					.success(function(data) {
						vm.processing = false;
						$location.path('/locations');
					});
			} else {
				vm.message = 'You must enter a location name!';
			}
		};

		vm.getDevices = function() {
			App.getDevices(vm.locationID)
				.success(function(data) {
					if(data.success) {
						vm.devices = data.devices;
					} else {
						vm.message = data.message;
					}
				});
		}

		vm.getLocations = function() {
			App.getLocations()
				.success(function(data) {
					if(data.success) {
						vm.locations = data.locations;
					} else {
						vm.message = data.message;
					}
				});
		};

		if(!vm.locationID)
			vm.getLocations();
		else
			vm.getDevices();
	});