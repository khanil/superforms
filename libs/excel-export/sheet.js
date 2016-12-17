// var sheetFront = `<?xml version="1.0" encoding="utf-8"?><x:worksheet xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main" 
// xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">
// <x:sheetPr/><x:sheetViews><x:sheetView tabSelected="1" workbookViewId="0" /></x:sheetViews>
// <x:sheetFormatPr defaultRowHeight="15" />`;
// var sheetBack =` <x:pageMargins left="0.75" right="0.75" top="0.75" bottom="0.5" header="0.5" footer="0.75" /><x:headerFooter /></x:worksheet>`;

var sheetFront = `<?xml version="1.0" encoding="utf-8"?>
<x:worksheet xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">
<x:sheetPr />
<x:sheetViews>
<x:sheetView tabSelected="1" workbookViewId="0" />
</x:sheetViews>
<x:sheetFormatPr defaultRowHeight="15" />`;

var sheetBack = `<x:pageMargins left="0.75" right="0.75" top="0.75" bottom="0.5" header="0.5" footer="0.75" />
<x:headerFooter />
</x:worksheet>`;

var fs = require('fs');
const invalidChars = require('./invalidChars');

class Sheet {
	constructor(config, xlsx, shareStrings, convertedShareStrings) {
		this.config = config;
		this.xlsx = xlsx;
		this.shareStrings = shareStrings;
		this.convertedShareStrings = convertedShareStrings;
		this.originDate = new Date(Date.UTC(1899,11,30));

		const self = this;
		this.getHandlerByType = {
			number: this.addNumberCell.bind(self),
			string: this.addStringCell.bind(self),
			datetime: this.addDatetimeCell.bind(self),
			date: this.addDatetimeCell.bind(self),
			time: this.addDatetimeCell.bind(self)
		}
	}


	generate() {
		//console.log(this.config)
		var config = this.config;
		const {header, body} = config;
		var xlsx = this.xlsx;

		config.fileName = 'xl/worksheets/' + header.title.replace(/[*?\]\[\/\/]/g, '') + '.xml';

		this.rows = [];
		this.fillTableHeader(header.columns);
		// this.fillTableBody(body);
		// console.log(this.rows);
		xlsx.file(config.fileName, sheetFront + '<x:sheetData>' + this.rows.join('') + '</x:sheetData>' + sheetBack);
		delete this.sheetData;
	}

	
	fillTableHeader(columns) {
		if(!columns) return '';

		let headerData = '';
		this.colNum = 0;
		
		this.fillHeaderRows(columns);
		// complete cells of the each row and add row tags
		for(let i = 0; i < this.rows.length; i++) {
			this.fillEmptyCells(i, this.rows[i].length, this.colNum);
			this.rows[i] = `<row r="${i + 1}">${this.rows[i].join('')}</row>`;
		}
	}

	// recursive filling the table header rows
	fillHeaderRows(columns, rowNum=0) {
		let cellRef, cells = this.rows[rowNum];
		!cells && (cells = this.rows[rowNum] = []);
	
		columns.forEach((section, i) => {
			this.fillEmptyCells(rowNum, cells.length, this.colNum)
			// add the new cell
			cellRef = this.getColumnLetter(this.colNum + 1) + (rowNum + 1);
			cells.push(this.addStringCell(cellRef, section.title));

			section.columns?
				this.fillHeaderRows(section.columns, rowNum + 1) : ++this.colNum;
		})
	}

	// fill empty cells
	fillEmptyCells(rowNum, start, end) {
		let cells = this.rows[rowNum], cellRef;
		for(let j = start; j < end; j++) {
			cellRef = this.getColumnLetter(j + 1) + (rowNum + 1);
			cells[j] = this.addStringCell(cellRef, '');
		}
	}

				// writeCell = typeof processBeforeWrite === 'function'?
				// 	this.processAndWrite.bind(this) : this.writeCells.bind(this);


	fillTableBody({ bodyRows, columnsOptions=[] }) {
		if(!bodyRows) return '';
		let i, j, writeCell, xmlCell;
		const headLength = this.rows.length, 
			bodyLenght = bodyRows.length,
			tableLength = headLength + bodyLenght;

		for(i = headLength; i < tableLength; i++){
			this.rows[i] = `<row r="${i + 1}">`;
		}
		// fill the table by columns
		for(j = 0; j < bodyRows[0].length; j++) {
			if(columnsOptions[j]) {
				const {colType, processBeforeWrite} = columnsOptions[j];
				console.log('preprocessing', colType, this.getHandlerByType[colType]);
				columnsOptions[j].addCell = this.getHandlerByType[colType];
				writeCell = typeof processBeforeWrite === 'function'? this.processAndWrite : this.writeCells;
			} else {
				console.log('without preprocessing')
				columnsOptions[j] = { addCell: this.addStringCell.bind(this) };
				writeCell = this.writeCells;
			}
			writeCell = writeCell.bind(this);
			// fill by rows
			for(i = 0; i < bodyRows.length; i++) {
				xmlCell = writeCell(bodyRows[i][j], i + headLength, j, columnsOptions[j]);
				this.rows[i + headLength] += xmlCell;
			}
		}
		
		for(i = headLength; i < tableLength; i++) {
			this.rows[i] += '</row>';
		}
	}

	// handle the cell data before write
	processAndWrite(cellData, rowNum, colNum, colOptions) {
		let cellOptions = Object.assing({}, colOptions);

		cellData = processBeforeWrite(cellData, rowNum, colNum, cellOptions);
		cellOptions.addCell = this.getHandlerByType[cellOptions.colType];

		return writeCells(cellData, rowNum, colNum, cellOptions)
	}


	writeCells(cellData, rowNum, colNum, cellOptions='string') {
		const cellRef = this.getColumnLetter(colNum + 1) + (rowNum + 1);
		const {addCell, styleIndex} = cellOptions;
		// console.log(cellOptions);
		return addCell(cellRef, cellData, styleIndex);
	}


	addNumberCell(cellRef, value, styleIndex=0){
		value = +value;
		return isNaN(value)? 
			this.generateStringCell(cellRef, 'NaN', 0) :
			this.generateNumberCell(cellRef, value, styleIndex);
	}


	addDatetimeCell(cellRef, value, styleIndex=1) {
		if(value instanceof Date === false) {
			value = Date.parse(value);
			if(isNaN(value)) {
				return this.generateStringCell(cellRef, 'NaN', 0);
			}
		}
		const milliseconds = value - this.originDate;
		value = milliseconds / (24 * 60 * 60 * 1000);

		return generateNumberCell(cellRef, value, styleIndex);
	}


	addStringCell(cellRef, value, styleIndex=0) {
		if(value === null) return '';
		if(typeof value !== 'string') {
			value = invalidChars.replacer(value);
				// .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g,'')
		}
		return this.generateStringCell(cellRef, value, styleIndex);
	}

	// the XML cell with number or date value
	generateNumberCell(cellRef, value, styleIndex) {
		return value === null? 
			'' : 
			`<c r="${cellRef}" s="${styleIndex}" t="s"><v>${value}</v></c>`;
	}

	// the XML cell with string value. The strings locate in shareStrings.xml.
	generateStringCell(cellRef, value, styleIndex) {
		if(value === '') {
			return `<c r="${cellRef}" s="${styleIndex}" />`;
		}
		const index = this.addValueIntoShareStrings(value);
		return `<c r="${cellRef}" s="${styleIndex}" t="s"><v>${index}</v></c>`;
	}


	addValueIntoShareStrings(value) {
		var index = this.shareStrings.get(value, -1);
		if(index < 0) {
			index = this.shareStrings.length;
			this.shareStrings.add(value, index);
			this.convertedShareStrings += `<x:si><x:t>${value}</x:t></x:si>`;
		}
		return index;
	}


	getColumnLetter(col) {
		if(col <= 0) throw "col must be more than 0";
		
		var letters = new Array();
		while (col > 0) {
			var remainder = col % 26;
			col /= 26;
			col = Math.floor(col);
			if(remainder === 0) {
				remainder = 26;
				col--;
			}
			letters.push(64 + remainder)
		}

		return String.fromCharCode.apply(null, letters.reverse())
	}
}
	

module.exports = Sheet;