var express = require('express');
var router = express.Router();
var fetch = require('../fetch/index.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Lottery Prediction' });
});

router.get('/getResult', function(req, res, next) {
	res.json(fetch.getResult());
});

router.get('/getHistory', function(req, res, next) {
	res.json(fetch.getHistory());
});

module.exports = router;
