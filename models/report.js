var config = require('../config');
var db = require('./db.js');


exports.add = function (report, formId) {
  return db.query("INSERT INTO reports(json, form_id) values($1, $2) RETURNING id", [report, formId]);
}


exports.calculateField =  function (responsesArray, field) {
	var question = field.questionTitle,
		action = field.action,
 		precision = 4;

	switch(action) {
		case 'RANKING':
			var result = {
				name : field.newTitle,
				head : [question, 'Количество ответов', 'Процент'], 
				body : []
			};
			var ranking = {};
			responsesArray.forEach(responseRow => {
				var answer = responseRow.json[question];
				ranking[ answer ] = (answer in ranking)? ranking[answer] + 1 : 1;
 			})
 			for(var key in ranking) {
 				var percent = rounding(ranking[key] / responsesArray.length, 4);
 				result.body.push( [key, ranking[key], percent]);
 			} 
 			return result;

		case 'SUM':
			return rounding( responsesArray.reduce((sum, responseRow) => {
				return sum + +responseRow.json[question];
			}, 0), precision);

		case 'AVERAGE':
			return rounding( responsesArray.reduce((sum, responseRow) => {
				return sum + +responseRow.json[question];
			}, 0) / responsesArray.length, precision);

		case 'MIN':
			return rounding( responsesArray.reduce((min, responseRow) => {
				return (min > +responseRow.json[question]) ? +responseRow.json[question] : min;
			}, responsesArray[0].json[question]), precision);

		case 'MAX':
			return rounding( responsesArray.reduce((max, responseRow) => {
				return (max < +responseRow.json[question]) ? +responseRow.json[question] : max;
			}, responsesArray[0].json[question]), precision);
		}
}


function rounding(value, precision) {
	var roundingValue = pow(10, precision);
	return ~~( value * roundingValue) / roundingValue;
}


function pow(x, n) {
  var result = x;
  for (var i = 1; i < n; i++) {
    result *= x;
  }
  return result;
}