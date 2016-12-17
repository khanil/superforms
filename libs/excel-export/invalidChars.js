const correctChars = {
	'&': '&amp',
	'"': '&quot',
	'\'': '&apos',
	'>': '&gt',
	'<': '&lt'
}


exports.replacer = str => (
	str.replace(/[&"\><]/g, char => correctChars[char] || '')
)