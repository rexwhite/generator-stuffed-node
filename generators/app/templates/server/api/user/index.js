'use strict';

var router = require('express').Router();
var secure = require('../../auth/auth.service').secure;

var controller = require('./user.controller');

router.get('/me', controller.me);

module.exports = router;
