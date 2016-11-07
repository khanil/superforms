module.exports = {
	sortNumbers: function(key, order, user1, user2) { 
		return order === 'asc'? user1[key] - user2[key] : user2[key] - user1[key] 
	},

	compareStrings: function(...rest) {
		let [s1, s2] = rest.map(str => str.toLowerCase())
		return +(s1 < s2) || +(s1 === s2) - 1
	},

	sortStrings: function(key, order, user1, user2) { 
		var result = this.compareStrings(user1[key], user2[key])
		return order === 'asc'? -result : result
	},

	// sort by surname and initials
	sortFullname: function(key, order, ...rest) {
		let [fname1, fname2] = rest.map(this.getSurnameAndInitials)
		var result = this.compareStrings(fname1, fname2)
		return order === 'asc'? -result : result
	},

	// for values of the russian alphabet
	sortRusStrings: function(key, order, ...rest) { 
		let [rus1, rus2] = rest.map(user => this.rusNames[user[key]] || user[key])
		var result = this.compareStrings(rus1, rus2)
		return order === 'asc'? -result : result		
	},
}