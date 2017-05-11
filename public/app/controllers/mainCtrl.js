angular.module('mainCtrl', [])
	.controller('mainController', function($location, $rootScope, $routeParams, $route, Auth, App) {
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

		vm.getToken = function() {
			App.getToken()
				.success(function(data) {
					if(data.success) {
						vm.token = data.token;
					}
				});
		};

		vm.getLocations = function() {
			App.getAllLocations()
				.success(function(data) {
					if(data.success) {
						vm.locations = data.locations;
					} else {
						vm.message = data.message;
					}
				});
		};

		vm.getUsers = function() {
			App.getUsers()
				.success(function(data) {
					if(data.success) {
						vm.users = data.users;
					}
				});
		};

		vm.userHasLocationWithId = function(user, location) {
			for(i in vm.users) {
				if(vm.users[i].username == user) {
					if(vm.users[i].locationIDs.indexOf(location) > -1)
						return true;
				}
			}
			return false;
		};

		vm.getLocationName = function(id) {
			for(i in vm.locations) {
				if(vm.locations[i].id == id)
					return vm.locations[i].name;
			}
		};

		vm.editUserActive = function(userID) {
			console.log('clicked');
			for(i in vm.users) {
				if(vm.users[i].username == userID) {
					var user = vm.users[i];
					App.toggleActiveUser(userID)
						.success(function(data) {
							if(data.success) {
								vm.message = data.message;
							} else {
								vm.message = data.message;
							}
						});
				}
			}
		};

		vm.addUserToLocation = function(username, locID) {
			App.assignUserToLocation(locID, username)
				.success(function(data) {
					if(data.success) {
						vm.message = data.message;
						vm.getUsers();
						vm.getLocations();
					} else {
						vm.message = data.message;
					}
				});
		};

		vm.removeUserFromLocation = function(username, locID) {
			App.removeUserFromLocation(locID, username)
				.success(function(data) {
					if(data.success) {
						vm.message = data.message;
						vm.getUsers();
						vm.getLocations();
					} else {
						vm.message = data.message;
					}
				});
		};

		vm.getCommand = function() {
			var command = $routeParams.id;
			App.getCommand(command)
				.success(function(data) {
					if(data.success) {
						vm.command = data.command;
					}
				});
		};

		if($location.path() == '/listToken')
			vm.getToken();

		if($location.path() == '/listUsers' || $location.path() == '/manageUsers')
			vm.getUsers();

		if($location.path().split('/')[1] == 'getCommand')
			vm.getCommand();

		if($location.path() == '/manageUsers')
			vm.getLocations();

	})
	.controller('msgController', function($location, App) {
		var vm = this;

		vm.templateMessage = {
			sendTo: undefined,
			value: undefined
		};

		vm.getMessages = function() {
			vm.processing = true;
			App.getMessages()
				.success(function(data) {
					vm.processing = false;
					if(data.success) {
						vm.messages = data.messages;
						for(i in vm.messages) {
							replaceMessage('.msg' + vm.messages[i].id, vm.messages[i].value);
						}
					} else {
						vm.message = data.message;
					}
				});
		};

		function replaceMessage(div, value) {
			setTimeout(function() {
	            $(div).html(value);
	        }, 100);
		}

		vm.sendMessage = function() {
			vm.processing = true;
			App.sendMessage(vm.templateMessage.sendTo, vm.templateMessage.value)
				.success(function(data) {
					vm.processing = false;
					if(data.success) {
						vm.message = data.message;
					} else {
						vm.message = data.message;
					}
				});
		};

		if($location.path() == '/messages')
			vm.getMessages();
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
			if(vm.registerData.username && vm.registerData.password && vm.registerData.rePassword && vm.registerData.permissionLevel) {
				if(vm.registerData.password != vm.registerData.rePassword) {
					vm.error = 'Passwords must match.';
				} else {
					Auth.registerUser(vm.registerData.username, vm.registerData.password, vm.registerData.permissionLevel)
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
			} else {
				vm.error = 'Please fill out the entire form.';
			}
		};
	})
	.controller('devController', function($location, $routeParams, App) {
		var vm = this;
		vm.locationID = $routeParams.id;
		vm.devID = $routeParams.devID;

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

		vm.getDevices = function() {
			App.getDevices()
				.success(function(data) {
					if(data.success) {
						vm.devices = data.devices;
						if($location.path().split('/')[1] == 'editDevice') {
							for(i in vm.devices) {
								if(vm.devices[i].id == vm.devID)
									vm.sendDevice.name = vm.devices[i].name;
							}
						}
					} else {
						vm.devices = {};
					}
				});
		};

		vm.editDevice = function() {
			if(vm.sendDevice.name) {
				vm.processing = true;
				App.editDevice(vm.devID, vm.sendDevice.name)
					.success(function(data) {
						vm.processing = false;
						if(data.success) {
							vm.message = data.message;
						} else {
							vm.message = data.message;
						}
					});
			} else {
				vm.message = 'Please complete the form.';
			}
		};

		vm.createDevice = function() {
			if(vm.sendDevice.name && vm.sendDevice.type && vm.sendDevice.locID) {
				vm.processing = true;
				App.createDevice(vm.sendDevice.locID, vm.sendDevice.name, vm.sendDevice.type)
					.success(function(data) {
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
		if($location.path() == '/listDevices' || $location.path().split('/')[1] == 'editDevice')
			vm.getDevices();

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
					}
				});
			App.getCommands()
				.success(function(data) {
					if(data.success) {
						vm.commands = data.commands;
						for(i in vm.commands) {
							vm.commands[i].color = 'btn-primary';
						}
					}
				});
		};

		vm.getMeasurementsAndCommands();

	})
	.controller('locController', function($location, $routeParams, $compile, $scope, App) {
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

		vm.sendCommand = function(devID, option, locID, comID) {
			App.sendCommand(devID, option, locID, comID)
				.success(function(data) {
					if(data.success) {
						vm.getCommandData(devID, comID);
					} else {
						vm.message = data.message;
					}
				});
		};

		function replaceName(div, name) {
			setTimeout(function() {
	            $(div).html(name);
	        }, 100);
		}

		vm.getDevice = function() {
			App.getDevice(vm.locationID)
				.success(function(data) {
					if(data.success) {
						vm.devices = data.devices;
						for(i in vm.devices) {
							replaceName('.dev' + vm.devices[i].id, vm.devices[i].name);
							if(vm.devices[i].commands) {
								vm.getCommandData(vm.devices[i].id, vm.devices[i].commands);
							} else if(vm.devices[i].measurements) {
								vm.getMeasurementData(vm.devices[i].id, vm.devices[i].measurements);
							}
						}
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

		vm.mesOptionColor = function(deviceID, option) {
			for(i in vm.devices) {
				if(vm.devices[i].id == deviceID) {
					if(option == vm.devices[i].completeMeasurement.value)
						return 'btn-success';
					else
						return 'btn-primary';
				} 
			}
		};

		vm.comOptionColor = function(deviceID, option) {
			for(i in vm.devices) {
				if(vm.devices[i].id == deviceID) {
					if(option == vm.devices[i].completeCommand.state)
						return 'btn-success';
					else
						return 'btn-primary';
				} 
			}
		};

		vm.getMeasurementData = function(deviceID, measurementID) {
			App.getMeasurementData(measurementID)
				.success(function(data) {
					if(data.success) {
						for(i in vm.devices) {
							if(vm.devices[i].id == deviceID)
								vm.devices[i].completeMeasurement = data.measurement;
						}
					} else {
						vm.message = data.message;
					}
				});
		};

		vm.getCommandData = function(deviceID, commandID) {
			App.getCommandData(commandID)
				.success(function(data) {
					if(data.success) {
						for(i in vm.devices) {
							if(vm.devices[i].id == deviceID) {
								for(j in data.command.options) {
									if(data.command.options[j] == data.command.state)
										data.command.options[j].color = 'btn-success';
									else
										data.command.options[j].color = 'btn-primary';
								}
								vm.devices[i].completeCommand = data.command;
							}
						}
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
			vm.getDevice();
		}
	});