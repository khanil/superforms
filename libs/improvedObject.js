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

module.exports = Object;