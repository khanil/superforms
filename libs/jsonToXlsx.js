var fs = require('fs');
var nodeExcel = require('excel-export');


//prepare json to be in the correct format for excel-export
module.exports = function jsonToXlsx(json) {
	try {
		var result = prepare(json);
		console.log('result: ', result);
		return nodeExcel.execute(result);
	} catch(err) {
		throw err;
	}
};


function prepare(json) {
	var result = { cols: [], rows: [] };
	//cols
	for(var col = 0; col < json.questions.length; col++) {
		if(json.questions[col]._type === 'question') {
			result.cols.push( new Column(json.questions[col]) )
		}
	}
	//rows
	for(var row = 0; row < json.responses.length; row++) {
		result.rows.push(json.responses[row].list)
	}
	return result;
}


function Column(question) {
	this.caption = question.title;

	var self = this;
	var originDate = new Date(Date.UTC(1899,11,30));
	( () => {
		switch(question.type) {
			case 'integer':
			case 'float':
			case 'financial':
				self.type = 'number';
				self.beforeCellWrite = (row, cellData, eOpt) => +cellData;
				break;

			case 'date':
				self.type = 'date';
				self.customWidth = "1";
				self.beforeCellWrite = (row, cellData, eOpt) => {
					if(!cellData){
						eOpt.cellType = 'string';
						return 'N/A';
					}
					return Math.floor(	(new Date(cellData) - originDate) / (24 * 60 * 60 * 1000) );
				}
				break;

			default:
				self.type = 'string';
				self.beforeCellWrite = (row, cellData, eOpt) => {
					return cellData.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g,'');
				}
		}
	})()
}