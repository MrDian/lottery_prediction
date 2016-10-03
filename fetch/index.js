var request = require('request');
var url = require('url');
var cheerio = require('cheerio');
var fs = require('fs-extra');
var moment = require('moment-timezone');

var date = moment().tz("Asia/Shanghai").format('YYYY-MM-DD hh:mm:ss');

console.log(date);

//red 1-33 blue 1-16
var total = [];

var historyObj = {
	protocol: 'http',
	host: 'baidu.lecai.com',
	pathname: '/lottery/draw/list/50',
	query: {
		type: 'range',
		start: '2015012',
		end: '2016111'
	}
};

var urlObj = {
	protocol: 'http',
	host: 'baidu.lecai.com',
	pathname: '/lottery/draw/list/50',
	query: {
		agentId: '5595'
	}
};

var parseData = function (rawContent) {
	var $ = cheerio.load(rawContent);
	var $dataList = $('.historylist tbody>tr');
	

	$dataList.each(function () {
		var data = [];
		var issue = $(this).find('>td').eq(0).text();
		// var date = $(this).find('>td').eq(1).text().replace(/\s*\（.\）/g, '');
		
		data.push(issue);
		var num = $(this).find('>td').eq(2).find('td').text().replace(/\s*/g, '');
		num.replace(/(\d\d)/g, function (all, g1) {
			data.push(g1);
		});
		total.push(data);
	});

	delete require('../db/history.json');
	var history = require('../db/history.json');
	var latest = history[0];
	var cutIndex = -1;

	for (var i = 0; i < total.length; i++) {
		var item = total[i];
		if (latest[0] === item[0]) {
			cutIndex = i;
			break;
		}
	}

	if (cutIndex >= 0) {
		total = total.splice(0, cutIndex).concat(history);
		fs.outputJson('../db/history.json', total, function (err) {

		});
	}
	// console.log(history);
	// total.forEach(function (item, index) {
	// 	break;
	// });

	// fs.outputJson('../db/history.js', total, function (err) {

	// });
};

// console.log(url.format(urlObj));

// request({
// 	url: url.format(urlObj),
// 	headers: {
// 		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36'
// 	},
// }, function (error, response, body) {
//  	if (!error && response.statusCode === 200) {
//  		parseData(body);
//  	}
// });
