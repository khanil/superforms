var fs = require('fs');
var nodeExcel = require('excel-export');


//prepare json to be in the correct format for excel-export
module.exports = function jsonToXlsx(json) {
	try {
		var result = prepare(json);
		return nodeExcel.execute(result);
	} catch(err) {
		throw err;
	}
};


var options = {
	year: 'numeric',
	month: 'numeric',
	day: 'numeric',
	hour: 'numeric',
	minute: 'numeric',
	second: 'numeric'
};


function prepare(json) {
	let {question, responses} = json;
	let result = {
		cols: [],
		rows: responses.map(() => []) 
	};

	let delCount = 0,
		selectedOpts,
		cellData,
		received;


	// fill datetime column
	result.cols.push( new Column({ title: 'Дата получения', type: 'datetime'}))
	for(var row = 0; row < responses.length; row++) {
		received = responses[row].received;
		result.rows[row][0] = received;
	}

	// fill columns with rows
	for(let col = 0; col < questions.length; col++) {
		if(questions[col]._type === 'question') {
			// parse the responses for the multiple select question
			if(questions[col].multiple === 'true') {
				for(let i = 0; i < questions[col].options.length; i++) {
					result.cols.push({
						caption: `${questions[col].title} [${questions[col].options[i]}]`, 
						type: 'string' 
					})

					for(let row = 0; row < responses.length; row++) {
						selectedOpts = responses[row].list[col - delCount]
						cellData = selectedOpts && ~selectedOpts.indexOf(questions[col].options[i]) ?
							questions[col].options[i] : '';

						result.rows[row].push(cellData)
					}
				}

			} else {
				result.cols.push( new Column(questions[col]) )
				// fill rows
				for(var row = 0; row < responses.length; row++) {
					result.rows[row].push(responses[row].list[col - delCount])
				}
			}
			
		} else if(questions[col]._type === 'delimeter') {
			result.cols.push( new Column({
				title: `РАЗДЕЛ ${++delCount}: ${questions[col].title}`,
				type: 'string' 
			}) )
			// fill all rows with delimiter name
			for(var row = 0; row < responses.length; row++) {
				result.rows[row].push('')
			}
		}
	}
	return result;
}



function Column(question) {
	this.caption = question.title;

	var self = this;
	const originDate = new Date(Date.UTC(1899,11,30));
	// console.log(question.type);
	( () => {
		switch(question.type) {
			case 'integer':
				self.type = 'number';
				self.beforeCellWrite = (row, cellData) => +cellData;
				break;

			case 'float':
			case 'financial':
				self.type = 'number';
				self.beforeCellWrite = (row, cellData) => (
					cellData.replace(/,/, '.')
				)	
				break;

			case 'date':
				self.type = 'date';
				self.beforeCellWrite = (row, cellData, eOpt) => {
					if(!cellData){
						eOpt.cellType = 'string';
						return 'N/A';
					}
					const milliseconds = (cellData instanceof Date?
						cellData : new Date(cellData)) - originDate;
					return Math.floor(milliseconds / (24 * 60 * 60 * 1000));
				}
				break;

			case 'datetime':
				self.type = 'date';
				self.beforeCellWrite = (row, cellData, eOpt) => {
					if(!cellData){
						eOpt.cellType = 'string';
						return 'N/A';
					}
					const milliseconds = (cellData instanceof Date?
						cellData : new Date(cellData)) - originDate; 
					return milliseconds / (24 * 60 * 60 * 1000);
				}
				break;

			// case 'select':
			// 	self.type = 'string';
			// 	console.log(question)
			// 	if(question.multiple) {
			// 		self.beforeCellWrite = (row, cellData) => cellData.join('; ')	
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
