var request = require('request');
var url = require('url');
var cheerio = require('cheerio');

//red 1-33 blue 1-16

// var start = '2015012';

var data = [];

var urlObj = {
	protocol: 'http',
	host: 'baidu.lecai.com',
	pathname: '/lottery/draw/list/50',
	search: 'type=range&start=2015012&end=2016111'
};

var parseData = function (rawContent) {
	var $ = cheerio.load(rawContent);
	var $dataList = $('.historylist tbody>tr');
	$dataList.each(function () {
		var issue = $(this).find('>td').eq(0).text();
		var date = $(this).find('>td').eq(1).text().replace(/\s*\（.\）/g, '');
		var num = $(this).find('>td').eq(2).find('td').text().replace(/\s*/g, '');
		data.push(num + '');
	});
};

console.log(url.format(urlObj));

request({
	url: url.format(urlObj),
	headers: {
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36'
	},
}, function (error, response, body) {
 	if (!error && response.statusCode === 200) {
 		parseData(body);
 	}
});
