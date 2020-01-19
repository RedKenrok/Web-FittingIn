/**
 * 
 * @param {string} path Relative path from base url.
 */
const Jsonload = function(path) {
	if (!path) {
		throw new Error(`No path specified`);
	}
	
	return new Promise(function(resolve, reject) {
		const request = new XMLHttpRequest();
		request.overrideMimeType(`application/json`);
		request.open(`GET`, path, true);
		
		const onError = function() {
			return reject(request.status);
		};
		request.onabort = onError;
		request.onerror = onError;
		request.ontimeout = onError;
		
		request.onreadystatechange = function() {
			if (request.readyState != 4) {
				return;
			}
			
			if (request.status == 200) {
				return resolve(JSON.parse(request.responseText));
			} else {
				return reject(request.status);
			}
		};
		
		request.send(null);
	});
};

export default Jsonload;