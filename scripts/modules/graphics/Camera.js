const Camera = async function(element, facingMode = `user`) {
	const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || (navigator.mediaDevices) ? navigator.mediaDevices.getUserMedia : undefined;
	if (!getUserMedia) {
		throw new Error(`Browser API navigator.mediaDevices.getUserMedia not available`);
	}
	
	try {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: false,
			video: {
				facingMode: facingMode
			},
		});
		element.srcObject = stream;
	} catch(error) {
		throw error;
	}
	
	return new Promise(function(resolve) {
		element.onloadedmetadata = function() {
			resolve(element);
		};
	});
};

export default Camera;