var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var sh = require('shorthash');
var path = require('path');
var User = require('../models/user');
var Location = require('../models/location');
var Device = require('../models/device');
var Type = require('../models/type');
var Command = require('../models/command');
var Measurement = require('../models/measurement');
var Message = require('../models/message');
var config = require('../../config');
var secret = config.secret;
var difficulty = config.difficulty;
var difficultyLevelEasy = 0;
var difficultyLevelHard = 1;
var permissionLevelAdmin = 0;
var permissionLevelUser = 1;

module.exports = function(app, express) {

	var apiRouter = express.Router();

	apiRouter.get('/', function(req, res) {
		if(difficulty == difficultyLevelEasy) {
			return res.sendFile(path.join(__dirname + '/apiInfo.json'));
		} else if(difficulty == difficultyLevelHard) {
			apiRouter.sendResponse(res, true, 'Welcome to the IoTTech API!');
		} else {
			apiRouter.sendResponse(res, false, 'Invalid difficulty setting, please edit the difficulty to valid value. 0 == Easy, 1 == Hard.');
		}
	});

	apiRouter.post('/registerUser', function(req, res) {
		if(req.body.username && req.body.password) {
			var user = new User();
			user.username = req.body.username;
			user.password = req.body.password;
			user.isActive = true;
			if(difficulty == difficultyLevelEasy) {
				if(req.body.permissionLevel == permissionLevelAdmin || req.body.permissionLevel == permissionLevelUser) {
					user.permissionLevel = req.body.permissionLevel;
				} else {
					apiRouter.sendResponse(res, false, 'Please include a valid permission level.');
				}
			} else {
				user.permissionLevel = permissionLevelUser;
			}
			user.save(function(err) {
				if(err) {
					if(err.code == 11000) {
						apiRouter.sendResponse(res, false, 'A user with that username already exists.');
					} else {
						apiRouter.sendResponse(res, false, err);
					}
				} else {
					apiRouter.sendResponse(res, true, 'User created.');
				}
			});
		} else {
			apiRouter.sendResponse(res, false, 'Please include a username and password.');
		}
	});

	apiRouter.post('/authenticate', function(req, res) {
		if(req.body.username && req.body.password) {
			User.findOne({ username: req.body.username, isActive }).select('username password').exec(function(err, user) {
				var pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, user, 'User not found.');
				if(pass) {
					var validPassword = user.comparePassword(req.body.password);
					if(!validPassword) {
						apiRouter.sendResponse(res, false, 'Wrong username or password');
					} else {
						var token = jwt.sign({
							username: user.username
						}, secret, {
							expiresIn: 60*60*24
						});
						return res.json({
							success: true,
							message: 'Token created',
							token: token
						});
					}
				}
			});
		} else {
			apiRouter.sendResponse(res, false, 'Please include a username and password');
		}
	});

	apiRouter.use(function(req, res, next) {
		var token = req.body.token || req.query.token || req.headers['x-access-token'];
		if(token) {
			jwt.verify(token, secret, function(err, decoded) {
				if(err) {
					return res.status(403).send({
						success: false,
						message: 'Failed to authenticate token'
					});
				} else if(decoded) {
					User.findOne({ username: decoded.username, isActive: true }, function(err, user) {
						var pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, user, 'User not found in database.');
						if(pass) {
							req.user = user;
							next();
						}
					});
				} else {
					return res.status(403).send({
						success: false,
						message: 'Token invalid.'
					});
				}
			});
		} else {
			return res.status(403).send({
				success: false,
				message: 'No token provided'
			});
		}
	});

	apiRouter.get('/getUsers', function(req, res) {
		User.find({}, function(err, users) {
			var pass = apiRouter.sendErrorIfErrorOrObjectsNull(res, err, users, 'No users found.');
			if(pass) {
				res.json({
					success: true,
					users: users
				});
			}
		});
	});

	apiRouter.get('/getMessages', function(req, res) {
		Message.find({ to: req.user.username }, function(err, messages) {
			var pass = apiRouter.sendErrorIfErrorOrObjectsNull(res, err, messages, 'No messages found.');
			if(pass) {
				res.json({
					success: true,
					messages: messages
				});
			}
		});
	});

	apiRouter.post('/sendMessage', function(req, res) {
		if(req.body.sendTo && req.body.value) {
			var message = new Message();
			var datetime = new Date();
			message.id = sh.unique(req.user.username+req.body.sendTo+datetime);
			message.from = req.user.username;
			message.to = req.body.sendTo;
			message.value = req.body.value;
			message.save(function(err) {
				apiRouter.sendErrorIfErrorOrSuccessWithMessage(res, err, 'Message sent.');
			});
		} else {
			apiRouter.sendResponse(res, false, 'Please fill out the entire form.');
		}
	});

	apiRouter.get('/getToken', function(req, res) {
		var token = req.body.token || req.query.token || req.headers['x-access-token'];
		res.json({
			success: true,
			token: token
		});
	});

	apiRouter.get('/getLocationData/:id', function(req, res) {
		if(req.params.id) {
			Location.findOne({ id: req.params.id }, function(err, location) {
				var pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, location, 'No location found with that id.');
				if(pass) {
					res.json({
						success: true,
						location: location
					});
				}
			});
		} else {
			apiRouter.sendResponse(res, false, 'Please include a location id.');
		}
	});

	apiRouter.get('/getLocations', function(req, res) {
		if(req.user.permissionLevel == permissionLevelAdmin) {
			Location.find({}, function(err, locations) {
				var pass = apiRouter.sendErrorIfErrorOrObjectsNull(res, err, locations, "You do not have any locations.");
				if(pass) {
					res.json({
						success: true,
						locations: locations
					});
				}
			});
		} else {
			Location.find({ id: req.user.locationIDs }, function(err, locations) {
				var pass = apiRouter.sendErrorIfErrorOrObjectsNull(res, err, locations, "You do not have any locations.");
				if(pass) {
					res.json({
						success: true,
						locations: locations
					});
				}
			});
		}
	});

	apiRouter.get('/getAllLocations', function(req, res) {
		Location.find({}, function(err, locations) {
			var pass = apiRouter.sendErrorIfErrorOrObjectsNull(res, err, locations, "You do not have any locations.");
			if(pass) {
				res.json({
					success: true,
					locations: locations
				});
			}
		});
	});

	apiRouter.post('/createLocation', function(req, res) {
		if(req.body.name) {
			var location = new Location();
			var datetime = new Date();
			location.name = req.body.name;
			location.id = sh.unique(req.user.username+req.body.name+datetime);
			location.createdBy = req.user.username;
			location.users.push(req.user.username);
			location.save(function(err) {
				if(err) {
					if(err.code == 11000) {
						apiRouter.sendResponse(res, false, 'A location with that name already exists.');
					} else {
						apiRouter.sendResponse(res, false, err);
					}
				} else {
					if(!(req.user.locationIDs.indexOf(location.id) > -1)) {
						req.user.locationIDs.push(location.id);
						req.user.save(function(err) {
							var pass = apiRouter.sendErrorIfError(res, err);
							if(pass) {
								apiRouter.sendResponse(res, true, 'Location created.');
							}
						});
					} else {
						apiRouter.sendResponse(res, true, 'Location created.');
					}
				}
			});
		} else {
			apiRouter.sendResponse(res, false, 'Please include a location name.');
		}
	});

	apiRouter.post('/deleteLocation', function(req, res) {
		if(req.body.id) {
			Location.findOne({ id: req.body.id }, function(err, location) {
				var pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, location, 'Location not found.');
				if(pass) {
					if(req.user.permissionLevel == permissionLevelAdmin || req.user.username == location.createdBy) {
						Location.remove({ id: req.body.id }, function(err) {
							pass = apiRouter.sendErrorIfError(res, err);
							if(pass) {
								User.find({ locationIDs: req.body.id }, function(err, users) {
									pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, users, 'No users belonging to that location could be found.');
									if(pass) {
										var success = true;
										var message = 'Removed location with id \'' + req.body.id + '\' from the following users: ';
										for(i in users) {
											var user = users[i];
											var index = user.locationIDs.indexOf(req.body.id);
											user.locationIDs.splice(index, 1);
											user.save(function(err) {
												if(err) {
													success = false;
													message +=  user.username + ' Error: ' + err + ', ';
												} else {
													message += user.username;
												}
												if(i == (users.length - 1)) {
													message += '.';
													apiRouter.sendResponse(res, success, message);
												} else {
													message += ', ';
												}
											});
										}
									}
								});
							}
						});
					} else {
						apiRouter.sendResponse(res, false, 'You do not have permission to delete this location.');
					}
				}
			});
		} else {
			apiRouter.sendResponse(res, false, 'Please include a location id.');
		}
	});

	apiRouter.get('/toggleActiveUser/:username', function(req, res) {
		if(req.params.username) {
			User.findOne({ username: req.params.username }, function(err, user) {
				var pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, user, 'User not found.');
				if(pass) {
					user.isActive = !user.isActive;
					user.save(function(err) {
						apiRouter.sendErrorIfErrorOrSuccessWithMessage(res, err, 'User ' + req.params.username + ' isActive set to ' + user.isActive);
					});
				}
			});
		} else {
			apiRouter.sendResponse(res, false, 'Must pass an username.');
		}
	});

	apiRouter.post('/assignLocation', function(req, res) {
		if(req.body.id && req.body.username) {
			Location.findOne({ id: req.body.id }, function(err, location) {
				var pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, location, 'No location with that id found.');
				if(pass) {
					User.findOne({ username: req.body.username }, function(err, user) {
						pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, user, 'No user with that username found.');
						if(pass) {
							if(!(user.locationIDs.indexOf(req.body.id) > -1)) {
								user.locationIDs.push(req.body.id);
								user.save(function(err) {
									pass = apiRouter.sendErrorIfError(res, err);
									if(pass) {
										if(!(location.users.indexOf(req.body.username) > -1)) {
											location.users.push(req.body.username);
											location.save(function(err) {
												apiRouter.sendErrorIfErrorOrSuccessWithMessage(res, err, 'Location assigned to user.');
											});
										} else {
											apiRouter.sendResponse(res, false, 'Location assigned to user ' + req.body.username + '.');
										}
									}
								});
							} else {
								apiRouter.sendResponse(res, true, 'Location assigned to user ' + req.body.username + '.');
							}
						}
					});
				}
			});
		} else {
			apiRouter.sendResponse(res, false, 'Please include a location id and username.');
		}
	});

	apiRouter.post('/removeUserFromLocation', function(req, res) {
		if(req.body.username && req.body.id) {
			Location.findOne({ id: req.body.id }, function(err, location) {
				if(req.user.permissionLevel == permissionLevelAdmin || req.user.username == location.createdBy || config.difficulty == difficultyLevelEasy) {
					var pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, location, 'Invalid location id.');
					if(pass) {
						User.findOne({ username: req.body.username }, function(err, user) {
							pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, user, 'Invalid username.');
							if(pass) {
								var indexOfUsername = location.users.indexOf(req.body.username);
								if(indexOfUsername > -1) {
									location.users.splice(indexOfUsername, 1);
								}
								var indexOfLocationID = user.locationIDs.indexOf(req.body.id)
								if(indexOfLocationID > -1) {
									user.locationIDs.splice(indexOfLocationID, 1);
								}
								location.save(function(err) {
									pass = apiRouter.sendErrorIfError(res, err);
									if(pass) {
										user.save(function(err) {
											apiRouter.sendErrorIfErrorOrSuccessWithMessage(res, err, 'User has been removed from that Location.');
										});
									}
								});
							}
						});
					}
				} else {
					apiRouter.sendResponse(res, false, 'You do not have permission to perform this operation.');
				}
			});
		} else {
			apiRouter.sendResponse(res, false, 'Please include a username and location id.');
		}
	});

	apiRouter.post('/renameLocation', function(req, res) {
		if(req.body.id && req.body.name) {
			Location.findOne({ id: req.body.id }, function(err, location) {
				var pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, location, 'No location with that id found.');
				if(pass) {
					if(req.user.permissionLevel == permissionLevelAdmin || req.user.username == location.createdBy) {
						location.name = req.body.name;
						location.save(function(err) {
							apiRouter.sendErrorIfErrorOrSuccessWithMessage(res, err, 'Location name updated.');
						});
					} else {
						apiRouter.sendResponse(res, false, 'You do not have permission to perform this operation.');
					}
				}
			});
		} else {
			apiRouter.sendResponse(res, false, 'Please include a location id and name.');
		}
	});

	apiRouter.get('/getDevices', function(res, res) {
		Device.find({}, function(err, devices) {
			var pass = apiRouter.sendErrorIfErrorOrObjectsNull(res, err, devices, 'No devices found.');
			if(pass) {
				res.json({
					success: true,
					devices: devices
				});
			}
		});
	});

	apiRouter.get('/getDevice/:id', function(req, res) {
		var locID = req.params.id;
		if(req.user.locationIDs.indexOf(locID) > -1 || req.user.permissionLevel == permissionLevelAdmin) {
			Device.find({ location: locID }, function(err, devices) {
				var pass = apiRouter.sendErrorIfErrorOrObjectsNull(res, err, devices, 'No devices found at this location.');
				if(pass) {
					res.json({
						success: true,
						devices: devices
					});
				}
			});
		} else {
			apiRouter.sendResponse(res, false, 'You do not have permission to access that Location.');
		}
	});

	apiRouter.post('/editDevice/:id', function(req, res) {
		if(req.body.deviceName && req.params.id) {
			Device.findOne({ id: req.params.id }, function(err, device) {
				var pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, device, 'No device found.');
				if(pass) {
					device.name = req.body.deviceName;
					device.save(function(err) {
						apiRouter.sendErrorIfErrorOrSuccessWithMessage(res, err, 'Device updated.');
					});
				}
			});
		} else {
			apiRouter.sendResponse(res, false, 'Please fill out entire form.');
		}
	});

	apiRouter.post('/addDevice', function(req, res) {
		if(req.body.locationID && req.body.deviceName && req.body.deviceType) {
			Location.findOne({ id: req.body.locationID }, function(err, location) {
				var pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, location, 'Location with that id not found.');
				if(pass) {
					if(req.user.username == location.createdBy || (location.users.indexOf(req.user.username > -1))) {
						var device = new Device();
						var datetime = new Date();
						device.name = req.body.deviceName;
						device.type = req.body.deviceType;
						device.location = req.body.locationID;
						device.id = sh.unique(req.user.username+req.body.deviceName+datetime);
						Type.findOne({ id: req.body.deviceType }, function(err, type) {
							pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, type, 'Invalid device type.');
							if(pass) {
								if(type.commands) {
									Command.findOne({ id: type.commands }, function(err, command) {
										pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, command, 'No command with that id found.');
										if(pass) {
											var newCommand = new Command();
											newCommand.name = command.name;
											newCommand.options = command.options;
											newCommand.state = command.state;
											newCommand.id = sh.unique(req.user.username+command.id+datetime);
											newCommand.save(function(err) {
												pass = apiRouter.sendErrorIfError(res, err);
												if (pass) {
													device.commands = newCommand.id;
													device.save(function(err) {
													pass = apiRouter.sendErrorIfError(res, err);
													if(pass) {
														location.devices.push(device.id);
														location.save(function(err) {
															apiRouter.sendErrorIfErrorOrSuccessWithMessage(res, err, 'Device created.');
														});
													}
												});
												}
											});
										}
									});
								} else if(type.measurements) {
									Measurement.findOne({ id: type.measurements }, function(err, measurement) {
										pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, measurement, 'No measurement with that id found.');
										if(pass) {
											var newMeasurement = new Measurement();
											newMeasurement.name = measurement.name;
											newMeasurement.options = measurement.options;
											newMeasurement.value = measurement.value;
											newMeasurement.id = sh.unique(req.user.username+measurement.id+datetime);
											newMeasurement.save(function(err) {
												pass = apiRouter.sendErrorIfError(res, err);
												if (pass) {
													device.measurements = newMeasurement.id;
													device.save(function(err) {
													pass = apiRouter.sendErrorIfError(res, err);
													if(pass) {
														location.devices.push(device.id);
														location.save(function(err) {
															apiRouter.sendErrorIfErrorOrSuccessWithMessage(res, err, 'Device created.');
														});
													}
												});
												}
											});
										}
									});
								}
							}
						});
						
					} else {
						apiRouter.sendResponse(res, false, 'You do not have permission to perform that operation.');
					}
				}
			});
		} else {
			apiRouter.sendResponse(res, false, 'Please include a location id, device name, and device type.');
		}
	});

	apiRouter.get('/getCommand/:id', function(req, res) {
		if(req.params.id) {
			Command.findOne({ id: req.params.id }, function(err, command) {
				var pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, command, 'No command with that id found.');
				if(pass) {
					res.json({
						success: true,
						command: command
					});
				}
			});
		} else {
			apiRouter.sendResponse(res, false, 'Please include a command id.');
		}
	});

	apiRouter.get('/getMeasurement/:id', function(req, res) {
		if(req.params.id) {
			Measurement.findOne({ id: req.params.id }, function(err, measurement) {
				var pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, measurement, 'No command with that id found.');
				if(pass) {
					res.json({
						success: true,
						measurement: measurement
					});
				}
			});
		} else {
			apiRouter.sendResponse(res, false, 'Please include a measurement id.');
		}
	});

	apiRouter.get('/getCommands', function(req, res) {
		if(req.user.permissionLevel == permissionLevelAdmin) {
			Command.find({}, function(err, commands) {
				var pass = apiRouter.sendErrorIfErrorOrObjectsNull(res, err, commands, 'No commands found.');
				if(pass) {
					res.json({
						success: true,
						commands: commands
					});
				}
			});
		} else {
			apiRouter.sendResponse(req, false, 'You do not have permission to view this.');
		}
	});

	apiRouter.post('/addCommand', function(req, res) {
		if(req.body.name && req.body.options && req.body.state) {
			var command = new Command();
			var datetime = new Date();
			command.name = req.body.name;
			command.options = req.body.options;
			command.state = req.body.state;
			command.id = sh.unique(req.user.username+req.body.name+datetime);
			command.save(function(err) {
				apiRouter.sendErrorIfErrorOrSuccessWithMessage(res, err, 'Command created.');
			});
		} else {
			apiRouter.sendResponse(res, false, 'Please include a command name, options, and current state.')
		}
	});

	apiRouter.get('/getMeasurements', function(req, res) {
		if(req.user.permissionLevel == permissionLevelAdmin) {
			Measurement.find({}, function(err, measurements) {
				var pass = apiRouter.sendErrorIfErrorOrObjectsNull(res, err, measurements, 'No measurements found.');
				if(pass) {
					res.json({
						success: true,
						measurements: measurements
					});
				}
			});
		} else {
			apiRouter.sendResponse(req, false, 'You do not have permission to view this.');
		}
	});

	apiRouter.post('/addMeasurement', function(req, res) {
		if(req.body.name && req.body.value && req.body.options) {
			var measurement = new Measurement();
			var datetime = new Date();
			measurement.name = req.body.name;
			measurement.value = req.body.value;
			measurement.options = req.body.options;
			measurement.id = sh.unique(req.user.username+req.body.name+datetime);
			measurement.save(function(err) {
				apiRouter.sendErrorIfErrorOrSuccessWithMessage(res, err, 'Measurement created.');
			});
		} else {
			apiRouter.sendResponse(res, false, 'Please include a measurement name, options, and current value');
		}
	});

	apiRouter.get('/getTypes', function(req, res) {
		Type.find({}, function(err, types) {
			var pass = apiRouter.sendErrorIfErrorOrObjectsNull(res, err, types, 'Error: No types found.');
			if(pass) {
				res.json({
					success: true,
					types: types
				});
			}
		});
	});

	apiRouter.post('/addType', function(req, res) {
		if(req.body.name && (req.body.commands || req.body.measurements)) {
			var type = new Type();
			var datetime = new Date();
			type.name = req.body.name;
			if(req.body.commands) {
				type.commands = req.body.commands;
				type.measurements = undefined;
			} else {
				type.measurements = req.body.measurements;
				type.commands = undefined;
			}
			type.id = sh.unique(req.user.username+req.body.name+datetime);
			type.save(function(err) {
				apiRouter.sendErrorIfErrorOrSuccessWithMessage(res, err, 'Type created.');
			});
		} else {
			apiRouter.sendResponse(res, false, 'Please include a type name, commands, and measurements');
		}
	});

	apiRouter.post('/sendCommand', function(req, res) {
		if(req.body.deviceID && req.body.command && req.body.locationID && req.body.commandID) {
			Location.findOne({ id: req.body.locationID }, function(err, location) {
				var pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, location, 'Invalid location id.');
				if(pass) {
					var hasPermission = false;
					if((location.devices.indexOf(req.body.deviceID) > -1) && (location.users.indexOf(req.user.username) > -1)) {
						hasPermission = true;
					}
					if(hasPermission || req.user.permissionLevel == permissionLevelAdmin) {
						Command.findOne({ id: req.body.commandID }, function(err, command) {
							pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, command, 'Invalid command id.');
							Device.findOne({ id: req.body.deviceID }, function(err, device) {
								pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, device, 'Invalid device id.');
								if(pass) {
									if(device.commands.indexOf(command.id) > -1) {
										if(command.options.indexOf(req.body.command) > -1) {
											command.state = req.body.command;
											command.save(function(err) {
												apiRouter.sendErrorIfErrorOrSuccessWithMessage(res, err, 'Command updated.');
											});
										} else {
											apiRouter.sendResponse(res, false, 'Invalid command option.');
										}
									} else {
										apiRouter.sendResponse(res, false, 'Invalid command.');
									}
								}
							});
						});
					} else {
						apiRouter.sendResponse(res, false, 'You do not have permission to send that command.');
					}
				}
			});
		} else {
			apiRouter.sendResponse(res, false, 'Please include the device id, the command id, command, and location id.');
		}
	});

	apiRouter.post('/sendMeasurement', function(req, res) {
		if(req.body.deviceID && req.body.measurement && req.body.locationID && req.body.measurementID) {
			Location.findOne({ id: req.body.locationID }, function(err, location) {
				var pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, location, 'Invalid location id.');
				if(pass) {
					var hasPermission = false;
					if((location.devices.indexOf(req.body.deviceID) > -1) && (location.users.indexOf(req.body.username) > -1)) {
						hasPermission = true;
					}
					if(hasPermission || req.user.permissionLevel == permissionLevelAdmin) {
						Measurement.findOne({ id: req.body.measurementID }, function(err, measurement) {
							pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, measurement, 'Invalid measurement id.');
							Device.findOne({ id: req.body.deviceID }, function(err, device) {
								pass = apiRouter.sendErrorIfErrorOrObjectNull(res, err, device, 'Invalid device id.');
								if(pass) {
									if(device.measurements.indexOf(measurement.id) > -1) {
										if(measurement.options.indexOf(req.body.measurement) > -1) {
											measurement.value = req.body.measurement;
											measurement.save(function(err) {
												apiRouter.sendErrorIfErrorOrSuccessWithMessage(res, err, 'Measurement updated.');
											});
										} else {
											apiRouter.sendResponse(res, false, 'Invalid measurement option.');
										}
									} else {
										apiRouter.sendResponse(res, false, 'Invalid measurement.');
									}
								}
							});
						});
					} else {
						apiRouter.sendResponse(res, false, 'You do not have permission to update that measurement.');
					}
				}
			});
		} else {
			apiRouter.sendResponse(res, false, 'Please include the device id, the measurement id, measurement, and location id.');
		}
	});

	apiRouter.get('/me', function(req, res) {
		req.user.password = undefined;
		req.user._id = undefined;
		req.user.__v = undefined;
		return res.json({
			success: true,
			user: req.user
		});
	});

	apiRouter.sendErrorIfError = function(res, err) {
		if(err) {
			apiRouter.sendResponse(res, false, err);
			return false;
		}
		return true;
	}

	apiRouter.sendErrorIfErrorOrSuccessWithMessage = function(res, err, message) {
		if(err) {
			apiRouter.sendResponse(res, false, err);
			return false;
		} else {
			apiRouter.sendResponse(res, true, message);
			return false;
		}
		return true;
	};

	apiRouter.sendErrorIfErrorOrObjectsNull = function(res, err, object, message) {
		if(err) {
			apiRouter.sendResponse(res, false, err);
			return false;
		} else if(object.length == 0) {
			apiRouter.sendResponse(res, false, message);
			return false;
		}
		return true;
	};

	apiRouter.sendErrorIfErrorOrObjectNull = function(res, err, object, message) {
		if(err) {
			apiRouter.sendResponse(res, false, err);
			return false;
		} else if(object == null) {
			apiRouter.sendResponse(res, false, message);
			return false;
		}
		return true;
	};

	apiRouter.sendResponse = function(res, success, message) {
		return res.json({
			success: success,
			message: message
		});
	};

	return apiRouter;
};