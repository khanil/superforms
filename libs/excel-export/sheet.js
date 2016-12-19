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
		this.handlersByTypes = {
			number: this.addNumberCell,
			string: this.addStringCell,
			datetime: this.addDatetimeCell,
			date: this.addDatetimeCell,
			time: this.addDatetimeCell
		}
	}


	generate() {
		var config = this.config;
		const {name, header, body} = config;
		var xlsx = this.xlsx;

		config.fileName = 'xl/worksheets/' + name.replace(/[*?\]\[\/\/]/g, '') + '.xml';

		this.xmlRows = [];
		this.fillTableHeader(header.columns);
		this.fillTableBody(body);
		// console.log(this.xmlRows);
		xlsx.file(config.fileName, sheetFront + '<x:sheetData>' + this.xmlRows.join('') + '</x:sheetData>' + sheetBack);
		delete this.sheetData;
	}

	
	fillTableHeader(columns) {
		if(!columns) return '';

		let headerData = '';
		this.colNum = 0;
		
		this.fillHeaderRows(columns);
		// console.log(this.xmlRows);
		// complete cells of the each row and add row tags
		for(let i = 0; i < this.xmlRows.length; i++) {
			this.fillEmptyCells(i, this.xmlRows[i].length, this.colNum);
			this.xmlRows[i] = `<row r="${i + 1}">${this.xmlRows[i].join('')}</row>`;
			// console.log(this.xmlRows[i])
		}
	}

	// recursive filling the table header rows
	fillHeaderRows(columns, rowNum=0) {
		let cellRef, cells = this.xmlRows[rowNum];
		!cells && (cells = this.xmlRows[rowNum] = []);
	
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
		let cells = this.xmlRows[rowNum], cellRef;
		for(let j = start; j < end; j++) {
			cellRef = this.getColumnLetter(j + 1) + (rowNum + 1);
			cells[j] = this.addStringCell(cellRef, '');
		}
	}

				// writeCell = typeof processBeforeWrite === 'function'?
				// 	this.processAndWrite.bind(this) : this.writeCells.bind(this);

			// if(colsOpts[j]) {
			// 	// if column has a type or a processBeforeWrite function
			// 	const {type, processBeforeWrite} = colsOpts[j];
			// 	colsOpts[j].addCell = this.getHandlerByType[type] || this.addStringCell;
			// 	writeCell = typeof processBeforeWrite === 'function'? this.processAndWrite : this.writeCells;
			// } else {
			// 	colsOpts[j] = { addCell: this.addStringCell.bind(this) };
			// 	writeCell = this.writeCells;
			// }

	fillTableBody({ rows, colsOpts=[] }) {
		// console.log(rows, colsOpts)
		if( !(rows && rows.length) ) return '';
		let i, j, writeCell, cellOpts;
		const headLength = this.xmlRows.length, 
			bodyLenght = rows.length,
			tableLength = headLength + bodyLenght;

		for(i = headLength; i < tableLength; i++){
			this.xmlRows[i] = `<row r="${i + 1}">`;
		}
		// fill the table by columns
		for(j = 0, cellOpts = null; j < rows[0].length; j++) {
			writeCell = colsOpts[j] && (typeof colsOpts[j].processBeforeWrite === 'function')?
				this.processAndWrite.bind(this) :
				this.writeCell.bind(this);
			// fill by rows
			for(i = 0; i < rows.length; i++) {
				cellOpts = Object.assign({ i: i + headLength, j }, colsOpts[j]);
				this.xmlRows[i + headLength] += writeCell(rows[i][j], cellOpts);
			}
		}
		
		for(i = headLength; i < tableLength; i++) {
			this.xmlRows[i] += '</row>';
		}
	}


	getWriteHandlerByType(dataType) {
		let writer = this.handlersByTypes[dataType] || this.addStringCell;
		return writer.bind(this);
	}

	// handle the cell data before write
	processAndWrite(cellData, cellOpts) {
		// console.log('preprocess: ' + cellData, cellOpts)
		cellData = processBeforeWrite(cellData, cellOpts);
		return writeCells(cellData, cellOpts)
	}


	writeCell(cellData, cellOpts) {
		// console.log('write: ' + cellData, cellOpts)
		const cellRef = this.getColumnLetter(cellOpts.j + 1) + (cellOpts.i + 1);
		const addCell = this.getWriteHandlerByType(cellOpts.type);
		return addCell(cellRef, cellData, cellOpts.styleIndex);
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
		return this.generateNumberCell(cellRef, value, styleIndex);
	}


	addStringCell(cellRef, value, styleIndex=0) {
		if(value === null) return '';
		if(typeof value !== 'string') {
			value = invalidChars
				.replacer(value)
				.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g,'');
		}
		return this.generateStringCell(cellRef, value, styleIndex);
	}

	// the XML cell with number or date value
	generateNumberCell(cellRef, value, styleIndex) {
		const xmlCell = value === null? 
			'' : 
			`<c r="${cellRef}" s="${styleIndex}"><v>${value}</v></c>`;
		// console.log(xmlCell);
		return xmlCell;
	}

	// the XML cell with string value. The strings locate in shareStrings.xml.
	generateStringCell(cellRef, value, styleIndex) {
		if(value === '') {
			return `<c r="${cellRef}" s="${styleIndex}" />`;
		}
		const index = this.addValueIntoShareStrings(value);
		const xmlCell = `<c r="${cellRef}" s="${styleIndex}" t="s"><v>${index}</v></c>`;
		// console.log(xmlCell);
		return xmlCell;
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