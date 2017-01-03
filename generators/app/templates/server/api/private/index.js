'use strict';

var router = require('express').Router();
var secure = require('../../auth/auth.service').secure;

var controller = require('./private.controller');

router.get('/', secure, controller.list);

module.exports = router;
