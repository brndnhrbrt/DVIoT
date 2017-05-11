angular.module('mainCtrl', [])
	.controller('mainController', function($location, $rootScope, $route, Auth) {
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
			$location.path('/login');
			$route.reload();
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
							$location.path('/locations');
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
										$location.path('/locations');
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

		vm.sendDevice = {
			locID: vm.locationID,
			name: undefined,
			type: undefined
		};

		vm.selectType = function(type) {
			vm.sendDevice.type = type.id;
			for(i in vm.types) {
				if(vm.types[i].id == type.id)
					vm.types[i].color = 'btn-success';
				else
					vm.types[i].color = 'btn-primary';
			}
		};

		vm.createDevice = function() {
			if(vm.sendDevice.name && vm.sendDevice.type && vm.sendDevice.locID) {
				vm.processing = true;
				App.createDevice(vm.sendDevice.locID, vm.sendDevice.name, vm.sendDevice.type)
					.success(function(data) {
						console.log('ok');
						vm.processing = false;
						if(data.success) {
							$location.path('/location/' + vm.locationID);
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
						vm.types = data.types;
						for(i in vm.types) {
							vm.types[i].color = 'btn-primary';
						}
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
		vm.mesMode = false;
		vm.comMode = false;

		vm.sendType = {
			name: undefined,
			command: undefined,
			measurement: undefined
		};

		vm.selectCom = function(command) {
			vm.sendType.command = command.id;
			vm.sendType.measurement = undefined;
			for(i in vm.commands) {
				if(vm.commands[i].id == command.id)
					vm.commands[i].color = 'btn-success';
				else
					vm.commands[i].color = 'btn-primary';
			}
			for(i in vm.measurements) {
				vm.measurements[i].color = 'btn-primary';
			}
		};

		vm.selectMes = function(measurement) {
			vm.sendType.measurement = measurement.id;
			vm.sendType.command = undefined;
			for(i in vm.measurements) {
				if(vm.measurements[i].id == measurement.id)
					vm.measurements[i].color = 'btn-success';
				else
					vm.measurements[i].color = 'btn-primary';
			}
			for(i in vm.commands) {
				vm.commands[i].color = 'btn-primary';
			}
		};

		vm.toggleMode = function(com, mes) {
			vm.comMode = com;
			vm.mesMode = mes;
		};

		vm.checkAdmin = function() {
			Auth.getUser()
				.then(function(data) {
					if(data.data) {
						vm.user = data.data.user;
						if(vm.user.permissionLevel == 0)
							vm.isAdmin = true;
						else
							$location.path('/404');
					}
				});
		};
	
		vm.createType = function() {
			if(vm.sendType.name && (vm.sendType.command || vm.sendType.measurement)) {
				App.createType(vm.sendType.name, vm.sendType.command, vm.sendType.measurement)
					.success(function(data) {
						if(data.success) {
							vm.message = data.message;
						} else {
							vm.message = data.message;
						}
					});	
			} else {
				vm.message = 'Please fill out the whole form.';
			}
			
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
						for(i in vm.measurements) {
							vm.measurements[i].color = 'btn-primary';
						}
					} else {
						vm.message = data.message;
					}
				});
			App.getCommands()
				.success(function(data) {
					if(data.success) {
						vm.commands = data.commands;
						for(i in vm.commands) {
							vm.commands[i].color = 'btn-primary';
						}
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

		vm.getLocData = function() {
			App.getLocationData(vm.locationID)
				.success(function(data) {
					if(data.success) {
						vm.location = data.location;
					} else {
						vm.message = data.message;
					}
				});
		};

		if(!vm.locationID)
			vm.getLocations();
		else {
			vm.getLocData();
			vm.getDevices();
		}
	});