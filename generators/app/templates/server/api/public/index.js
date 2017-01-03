'use strict';

var router = require('express').Router();
var controller = require('./public.controller');

router.get('/', controller.list);

module.exports = router;
