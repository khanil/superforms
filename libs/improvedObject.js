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
	// console.log('start')
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

module.exports = Object;