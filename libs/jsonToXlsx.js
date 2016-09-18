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
	var result = { cols: [], rows: json.responses.map(() => []) };
	//cols
	console.log(json.responses)
	var delCount = 0;
	for(var col = 0; col < json.questions.length; col++) {
		if(json.questions[col]._type === 'question') {
			result.cols.push( new Column(json.questions[col]) )
			for(var row = 0; row < json.responses.length; row++) {
				result.rows[row][col] = json.responses[row].list[col - delCount]
			}
		} else if(json.questions[col]._type === 'delimeter') {
			result.cols.push( new Column({ title: `РАЗДЕЛ ${++delCount}`, type: 'string' }) )
			for(var row = 0; row < json.responses.length; row++) {
				result.rows[row][col] = json.questions[col].title
			}
		}
		console.log(result)

	}
	//rows
	// for(var row = 0; row < json.responses.length; row++) {
	// 	result.rows.push(json.responses[row].list)
	// }
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
				self.beforeCellWrite = (row, cellData, eOpt) => {
					if(!cellData){
						eOpt.cellType = 'string';
						return 'N/A';
					}
					return Math.floor(	(new Date(cellData) - originDate) / (24 * 60 * 60 * 1000) );
				}
				break;

			// case 'datetime':
			// 	self.type = 'date';
			// 	self.beforeCellWrite = (row, cellData, eOpt) => {
			// 		// if(!cellData){
			// 		// 	eOpt.cellType = 'string';
			// 		// 	return 'N/A';
			// 		// }
			// 		var date = new Date(cellData);
			// 		return 42497.6777546296;
			// 	}
			// 	break;

			// case 'time':
			// 	self.type = 'time';
			// 	self.beforeCellWrite = (row, cellData, eOpt) => {
			// 		if(!cellData){
			// 			eOpt.cellType = 'string';
			// 			return 'N/A';
			// 		}
			// 		var date = new Date(cellData);
			// 		return date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
			// 	}
			// 	break;

			default:
				self.type = 'string';
				self.beforeCellWrite = (row, cellData, eOpt) => {
					return cellData? 
						cellData.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g,''):
						''
				}
		}
	})()
}