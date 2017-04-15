var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var sh = require('shorthash');
var path = require('path');
var User = require('../models/user');
var Location = require('../models/location');
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
			User.findOne({ username: req.body.username }).select('username password').exec(function(err, user) {
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
					User.findOne({ username: decoded.username }, function(err, user) {
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
				if(req.user.permissionLevel == permissionLevelAdmin || req.user.username == location.createdBy) {
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