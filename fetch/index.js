var request = require('request');
var url = require('url');
var cheerio = require('cheerio');
var fs = require('fs-extra');
var moment = require('moment-timezone');

var getTimerTime = function (time, delay) {
	var date = moment().tz('Asia/Shanghai').format('HH:mm:ss');
	var h, m, s, result = 0, h2, m2, s2, total, total2;
	date.replace(/(\d\d?):(\d\d?):(\d\d?)/, function (all, g1, g2, g3) {
		h = parseInt(g1, 10);
		m = parseInt(g2, 10);
		s = parseInt(g3, 10);
	});
	if (delay) {
		h2 = h;
		m2 = m + 5;
		s2 = s;
	} else {
		time.replace(/(\d\d?):(\d\d?):(\d\d?)/, function (all, g1, g2, g3) {
			h2 = parseInt(g1, 10);
			m2 = parseInt(g2, 10);
			s2 = parseInt(g3, 10);
		});		
	}

	if (h === 24) {
		h = 0;
	}

	if (h2 === 24) {
		h2 = 0;
	}

	total = (h * 60 * 60) + (m * 60) + s;
	total2 = (h2 * 60 * 60) + (m2 * 60) + s2;

	if (total2 >= total) {
		result = total2 - total;
	} else {
		result = 24 * 60 * 60 - total + total2;
	}

	return result * 1000;
};


var log = function (msg) {
	var date = moment().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');

	fs.appendFile(process.cwd() + '/db/log.txt', '[' + date + '] ' + msg + '\n', function () {

	});
};
// getTimerTime('1:00:00');

// console.log(date.get('hour'));

// setTimeout(function () {}, );

//red 1-33 blue 1-16


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
	var total = [];
	var $ = cheerio.load(rawContent);
	var $dataList = $('.historylist tbody>tr');

	setTimeout(function () {
		setTimeout(getData, getTimerTime('23:00:00'));
	}, 5000);
	
	$dataList.each(function () {
		var data = [];
		var issue = $(this).find('>td').eq(0).text();
		// var date = $(this).find('>td').eq(1).text().replace(/\s*\（.\）/g, '');
		
		data.push(issue);
		var num = $(this).find('>td').eq(2).find('td').text().replace(/\s*/g, '');
		num.replace(/(\d\d)/g, function (all, g1) {
			data.push(parseInt(g1, 10) + '');
		});
		total.push(data);
	});

	try {
		delete require.cache[require.resolve(process.cwd() + '/db/history.json')];
		var history = require(process.cwd() + '/db/history.json');
	} catch (e) {
		fs.outputJson(process.cwd() + '/db/history.json', total, function (err) {});
		return;
	}
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
		fs.outputJson(process.cwd() + '/db/history.json', total, function (err) {
			missStat(30);
			missStat(60);
			
		});
	}
};

var missStat = function (issueLen) {
	delete require.cache[require.resolve(process.cwd() + '/db/history.json')];
	var history = require(process.cwd() + '/db/history.json');
	history = history.slice(0);
	issueLen = issueLen ? issueLen : history.length;

	history = history.slice(0, issueLen);

	var redMiss = require(process.cwd() + '/db/red_miss.json');
	var blueMiss = require(process.cwd() + '/db/blue_miss.json');

	blueMiss = Object.assign({}, blueMiss);
	redMiss = Object.assign({}, redMiss);

	// console.log(require.cache);
	// console.log(blueMiss);

	history.forEach(function (item, index) {
		item.shift();
		var blueNum = item.pop();
		blueMiss[blueNum] = ++blueMiss[blueNum];

		item.forEach(function (subItem, subIndex) {
			redMiss[subItem] = ++redMiss[subItem];
		});
	});

	// console.log(blueMiss);
	for (var key in blueMiss) {
		// console.log(key);
		blueMiss[key] = issueLen - blueMiss[key];
	}

	for (var key in redMiss) {
		redMiss[key] = issueLen - redMiss[key];
	}

	// console.log(blueMiss);
	fs.outputJson(process.cwd() + '/db/' + issueLen + '_blue_miss.json', blueMiss, function (err) {

	});

	fs.outputJson(process.cwd() + '/db/' + issueLen + '_red_miss.json', redMiss, function (err) {

	});
};

var getResult = function () {
	log('get result');
	var temp = [];
	delete require.cache[require.resolve(process.cwd() + '/db/history.json')];
	var issue = parseInt(require(process.cwd() + '/db/history.json')[0][0], 10);
	++issue;

	setTimeout(function () {
		setTimeout(getResult, getTimerTime('00:00:00'));
	}, 5000);
	
	try {
		delete require.cache[require.resolve(process.cwd() + '/db/result.json')];
		var result = require(process.cwd() + '/db/result.json');
		if (result[issue + '']) {
			return result[issue + ''];
		}
	} catch (e) {
		var result = {};
	}

	delete require.cache[require.resolve(process.cwd() + '/db/30_red_miss.json')];
	var r30 = require(process.cwd() + '/db/30_red_miss.json');
	delete require.cache[require.resolve(process.cwd() + '/db/30_blue_miss.json')];
	var b30 = require(process.cwd() + '/db/30_blue_miss.json');

	delete require.cache[require.resolve('../db/60_red_miss.json')];
	var r60 = require(process.cwd() + '/db/60_red_miss.json');
	delete require.cache[require.resolve('../db/60_blue_miss.json')];
	var b60 = require(process.cwd() + '/db/60_blue_miss.json');

	delete require.cache[require.resolve('../db/77_red_miss.json')];
	var r77 = require(process.cwd() + '/db/77_red_miss.json');
	delete require.cache[require.resolve('../db/77_blue_miss.json')];
	var b77 = require(process.cwd() + '/db/77_blue_miss.json');

	temp.push(compute(Object.assign({}, r30), Object.assign({}, b30)));
	temp.push(compute(Object.assign({}, r60), Object.assign({}, b60)));
	temp.push(compute(Object.assign({}, r77), Object.assign({}, b77)));
	temp.push(deepCompute(Object.assign({}, r30), Object.assign({}, b30), 777));
	temp.push(deepCompute(Object.assign({}, r60), Object.assign({}, b60), 777));

	result[issue + ''] = temp;

	fs.outputJson(process.cwd() + '/db/result.json', result, function (err) {

	});	

	return result;
};

var compute = function (r, b) {
	var temp = [], max = [];

	for (var key in r) {
		r[key] = Math.random() * r[key];
		temp.push(r[key]);
	}

	temp.sort(function (a, b) {
		if (b > a) {
			return 1;
		}
		if (b < a) {
			return -1;
		}
		if (b === a) {
			return 0;
		}
	});

	temp = temp.slice(0, 6);

	for (var key in b) {
		b[key] = Math.random() * b[key];

		if (!max[0]) {
			max[0] = b[key];
			max[1] = key;
		} else if (b[key] > max[0]) {
			max[0] = b[key];
			max[1] = key;
		}
	}

	temp.push(max[1]);

	temp = temp.map(function (item, index) {
		if (index === 6) {
			return item;
		}

		for (var key in r) {
			if (r[key] === item) {
				delete r[key];
				return key;
			}
		}
		return item;
	});
	return temp;
};

var deepCompute = function (r, b, count) {
	var redMiss = require(process.cwd() + '/db/red_miss.json');
	var blueMiss = require(process.cwd() + '/db/blue_miss.json');
	redMiss = Object.assign({}, redMiss);
	blueMiss = Object.assign({}, blueMiss);
	var result = [], max = [];

	for (var i = 0; i < count; i++) {
		var temp = compute(Object.assign({}, r), Object.assign({}, b));
		temp.forEach(function (item, index) {
			if (index === 6) {
				blueMiss[item] = ++blueMiss[item];
			} else {
				redMiss[item] = ++redMiss[item];
			}
		});
	}

	for (var key in redMiss) {
		result.push(redMiss[key]);
	}

	result.sort(function (a, b) {
		if (b > a) {
			return 1;
		}
		if (b < a) {
			return -1;
		}
		if (b === a) {
			return 0;
		}
	});

	result = result.slice(0, 6);

	for (var key in blueMiss) {
		if (!max[0]) {
			max[0] = blueMiss[key];
			max[1] = key;
		} else if (blueMiss[key] > max[0]) {
			max[0] = blueMiss[key];
			max[1] = key;
		}
	}

	result.push(max[1]);

	result = result.map(function (item, index) {
		if (index === 6) {
			return item;
		}

		for (var key in redMiss) {
			if (redMiss[key] === item) {
				delete redMiss[key];
				return key;
			}
		}
		return item;
	});

	return result;
};

var getData = function () {
	request({
		url: url.format(urlObj),
		headers: {
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36'
		},
	}, function (error, response, body) {
	 	if (!error && response.statusCode === 200) {
	 		log('get data success');
	 		parseData(body);
	 	} else {
	 		log(response.statusCode + ', get data failure');
	 		setTimeout(getData, getTimerTime('', true));
	 	}
	});	
};

// getData(); 
// getResult();
setTimeout(getData, getTimerTime('23:00:00'));
setTimeout(getResult, getTimerTime('00:00:00'));

setTimeout(function () {
	missStat(77);
}, getTimerTime('23::45:00'));

exports.getResult = function () {
	delete require.cache[require.resolve(process.cwd() + '/db/result.json')];
	return require(process.cwd() + '/db/result.json');
};
exports.getHistory = function () {
	delete require.cache[require.resolve(process.cwd() + '/db/history.json')];
	return require(process.cwd() + '/db/history.json');
};