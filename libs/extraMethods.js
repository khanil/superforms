const reduce = Function.bind.call(Function.call, Array.prototype.reduce);
const isEnumerable = Function.bind.call(Function.call, Object.prototype.propertyIsEnumerable);
const concat = Function.bind.call(Function.call, Array.prototype.concat);
const keys = Reflect.ownKeys;

if (!Object.values) {
	Object.values = function values(obj) {
		return reduce(
			keys(obj), 
			(v, k) => concat(v, typeof k === 'string' && isEnumerable(obj, k) ? [obj[k]] : []), 
			[]
		);
	};
}

Object.renameProperty = function (oldName, newName) {
	// Do nothing if the names are the same
	if (oldName == newName) {
		return this;
	}
	// Check for the old property name to avoid a ReferenceError in strict mode.
	if (this.hasOwnProperty(oldName)) {
		this[newName] = this[oldName];
		delete this[oldName];
	}
	return this;
}


Array.prototype.repeat = function(times) {
	let newArray = new Array(times * this.length);
	for(let i = 0; i < times; i++) {
		for(let j = 0; j < this.length; j++) {
			newArray[i * this.length + j] = this[j];
		}
	}
	return newArray;
}

String.prototype.pick = function(min, max) {
	var n, chars = '';
	n = (typeof max === 'undefined') ? 
		min : min + Math.round(Math.random() * (max - min + 1));

	for (var i = 0; i < n; i++) {
		chars += this.charAt(Math.round(Math.random() * this.length));
	}
	return chars;
};

String.prototype.shuffle = function() {
	var array = this.split('');
	var tmp, current, top = array.length;

	if (top) while (--top) {
		current = Math.floor(Math.random() * (top + 1));
		tmp = array[current];
		array[current] = array[top];
		array[top] = tmp;
	}
	return array.join('');
};

module.exports = { Object, Array, String };