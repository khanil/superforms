function sendXHR(method, url, sentData) {

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

function subscribe(length) {
	return sendXHR('GET', `/api/forms/${config.form_id}/updateResponses/${length}`)
		.then(JSON.parse)
		.then(newResponses => {
			console.log('list: ', responsesList);
			console.log('new responses', newResponses);
			responsesList = Array.prototype.concat(newResponses, responsesList);
			// Array.push.apply(responsesList, newResponses);
			console.log('updated list: ', responsesList);
			subscribe(responsesList.length);
		})
		.catch(err => {
			setTimeout(subscribe.bind(null, length), 30000);
		})
}

const config = JSON.parse(document.getElementById('config').textContent);
let responsesList;

(function() {
	sendXHR('GET', `/api/forms/${config.form_id}/responses`)
		.then(JSON.parse)
		.then(responses => {
			console.log(responses.length, responses);
			responsesList = responses;
			return subscribe(responsesList.length);
		})
		
		.catch(err => { console.log('end of promise:', err) })

})()