module.exports = (method, url, sentData) => {

	return new Promise(function(resolve, reject) {

		var xhr = new XMLHttpRequest();
		xhr.open(method, url, true);
		xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

		xhr.onload = function() {
			if (this.status === 200) {
				resolve(this.response);
			} else {
				reject(new Error(this.response));
			}
		};

		xhr.onerror = function() {
			reject(new Error("Ошибка сети"));
		};

		sentData ? xhr.send(sentData) : xhr.send();
	});

}