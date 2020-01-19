// Maths libraries.
import Maths from '/scripts/modules/Maths.js';
// Data libraries.
import JsonLoad from '/scripts/modules/data/JsonLoad.js';
// Graphics libraries.
import Camera from '/scripts/modules/graphics/Camera.js';
import Canvas from '/scripts/modules/graphics/Canvas.js';
import Resize from '/scripts/modules/graphics/Resize.js';

const GAME = {
	name: 'fitting-in',
	
	canvas: null,
	colors: null,
	duration: {
		fadeIn: 0.1e3, // Time fade in takes.
		fadeOut: 0.25e3, // Time fade out takes.
		restart: 2e3, // Time before restart listener added.
		rounds: 20e3, // Maximum time a round takes before ending round.
		score: 4e3 // Time score in between rounds is shown.
	},
	pose: {
		headRadius: 1/12,
		lineWidth: 1/14
	},
	posenet: null,
	posenetOptions: {
		architecture: 0.75,
		imageScaleFactor: 0.5,
		keypointThreshold: 0.5,
		outputStride: 8
	},
	poses: null,
	poseIndex: 0,
	roundsLength: 5,
	scoreTotal: 0,
	text: null,
	textOptions: {
		colorBlack: '#222',
		colorHighlight: '#222',
		colorWhite: '#fff',
		fontSize: 24,
		font: 'Segoe UI, Helvetica, Arial, sans-serif'
	},
	time: null,
	video: null
};

document.addEventListener('DOMContentLoaded', function() {
	GAME.canvas = {
		time: document.querySelector('#app > #time'),
		video: document.querySelector('#app > #video'),
		pose: document.querySelector('#app > #pose'),
		text: document.querySelector('#app > #text'),
		fade: document.querySelector('#app > #fade')
	};
	GAME.canvas._context = {
		time: GAME.canvas.time.getContext('2d'),
		video: GAME.canvas.video.getContext('2d'),
		pose: GAME.canvas.pose.getContext('2d'),
		text: GAME.canvas.text.getContext('2d'),
		fade: GAME.canvas.fade.getContext('2d')
	};
});

const onLoad = async function() {
	const onResizeScreen = function(windowSize) {
		return {
			size: { x: windowSize.x, y: windowSize.y },
			offset: { x: 0, y: 0 }
		}
	},	onResizeSquare = function(windowSize) {
		return {
			size: { x: windowSize.x, y: windowSize.x },
			offset: { x: 0, y: 0 }
		};
	};
	const sizeScreen = {
		x: document.documentElement.clientWidth || document.body.clientWidth,
		y: document.documentElement.clientHeight || document.body.clientHeight
	},	sizeSquare = {
		x: document.documentElement.clientWidth || document.body.clientWidth,
		y: document.documentElement.clientWidth || document.body.clientWidth
	};
	
	//	RESIZE_CANVAS -> square, pose, video
	GAME.canvas._wrapper = {
		time: new Resize(GAME.canvas.time, onResizeScreen, sizeScreen),
		video: new Resize(GAME.canvas.video, onResizeSquare, sizeSquare),
		pose: new Resize(GAME.canvas.pose, onResizeSquare, sizeSquare),
		text: new Resize(GAME.canvas.text, onResizeScreen, sizeScreen),
		fade: new Canvas(GAME.canvas.fade, onResizeScreen, sizeScreen)
	};
	
	//	ADD_ATTRIBUTE -> hidden, fade, pose, text, time, video
	setAttributes([
		GAME.canvas.fade,
		GAME.canvas.pose,
		GAME.canvas.text,
		GAME.canvas.time,
		GAME.canvas.video
	], 'hidden', true);
	
	//	DRAW_CANVAS -> fade, white
	let context = GAME.canvas._context.fade;
	context.fillStyle = '#fff';
	context.fillRect(0, 0, GAME.canvas.fade.width, GAME.canvas.fade.height);
	//	REMOVE_ATTRIBUTE -> hidden, fade
	removeAttributes(GAME.canvas.fade, 'hidden');
	
	//	LOAD -> text
	GAME.text = await JsonLoad(window.location.href + 'data/text.json');
	//ON_LOAD -> text
	
	//	DRAW_CANVAS -> text, title, start
	context = GAME.canvas._context.text;
	context.fillStyle = GAME.textOptions.colorBlack;
	context.font = `bold ${GAME.textOptions.fontSize * 2}px ${GAME.textOptions.font}`;
	context.fillText(GAME.text.title, GAME.canvas.text.height * 0.05, (GAME.canvas.text.height * 0.95) - (GAME.textOptions.fontSize * 1.5), GAME.canvas.text.width * 0.9);
	context.fillStyle = GAME.textOptions.colorHighlight;
	context.font = `${GAME.textOptions.fontSize}px ${GAME.textOptions.font}`;
	context.fillText(GAME.text.start, GAME.canvas.text.height * 0.05, GAME.canvas.text.height * 0.95, GAME.canvas.text.width * 0.9);
	//	REMOVE_ATTRIBUTE -> hidden, text
	removeAttributes(GAME.canvas.text, 'hidden');
	
	//	FADE_OUT -> fade, duration
	fadeOut(onStartStart);
};
window.addEventListener('load', onLoad);

const onStartStart = async function() {
	//ON_FADED
	
	//	ADD_LISTENER -> fade, touch
	GAME.canvas.fade.addEventListener('inputend', onStartTouched);
};

const onStartTouched = async function() {
	//ON_TOUCH
	
	//	REMOVE_LISTENER -> fade, touch
	GAME.canvas.fade.removeEventListener('inputend', onStartTouched);
	
	//	FADE_IN -> fade, duration
	fadeIn(onStartEnd);
};

const onStartEnd = async function() {
	//ON_FADED
	
	//	LOAD -> pose data (use loadJSON is array)
	GAME.colors = await JsonLoad(window.location.href + 'data/colors.json');
	GAME.poses = await JsonLoad(window.location.href + 'data/poses.json');
	//	LOAD -> posenet
	GAME.posenet = await posenet.load(GAME.posenetOptions.architecture);
	//	LOAD -> camera
	GAME.video = document.querySelector('#app > #video_raw'),
	await Camera(GAME.video, 'environment');
	
	await onGameStart();
};

const onGameStart = async function() {
	//ON_LOADED
	//:START
	
	//	SET -> poseIndex, 0
	GAME.poseIndex = 0;
	//	SET -> scoreTotal, 0
	GAME.scoreTotal = 0;
	//	SHUFFLE -> poses
	if (GAME.poses.length > 0) {
		const shuffleLength = GAME.poses.length * 2;
		let indexA, indexB, poseA, poseB;
		for (let i = 0; i < shuffleLength; i++) {
			indexA = Math.floor(Math.random() * GAME.poses.length);
			indexB = Math.floor(Math.random() * (GAME.poses.length - 1));
			if (indexB >= indexA) {
				indexB++;
			}
			
			poseA = GAME.poses[indexA];
			poseB = GAME.poses[indexB];
			GAME.poses[indexB] = poseA;
			GAME.poses[indexA] = poseB;
		}
	}
	
	onRoundStart();
};

const onRoundStart = async function() {
	//:ROUND_START
	
	const color = GAME.colors[Math.floor(Math.random() * GAME.colors.length)];
	
	//	CLEAR -> pose
	let canvas = GAME.canvas.pose,
		context = GAME.canvas._context.pose;
	context.clearRect(0, 0, canvas.width, canvas.height);
	//	DRAW -> pose, pose[poseIndex]
	drawPose(canvas, context, GAME.poses[GAME.poseIndex]);
	// Invert alpha channel and recolor outer parameter
	const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
	const imageDataLength = imageData.data.length;
	for (let i = 0; i < imageDataLength; i++) {
		switch(i % 4) {
			case 0: // Red.
				imageData.data[i] = color.r;
				break;
			case 1: // Green.
				imageData.data[i] = color.g;
				break;
			case 2: // Blue.
				imageData.data[i] = color.b;
				break;
			case 3: // Alpha.
				imageData.data[i] = 255 - imageData.data[i];
				break;
		}
	}
	context.putImageData(imageData, 0, 0);
	
	//	CLEAR_CANVAS -> text
	canvas = GAME.canvas.text;
	context = GAME.canvas._context.text;
	context.clearRect(0, 0, canvas.width, canvas.height);
	//	DRAW -> text, snap
	context.fillStyle = GAME.textOptions.colorWhite;
	context.font = `bold ${GAME.textOptions.fontSize}px ${GAME.textOptions.font}`;
	context.fillText(GAME.text.snap, canvas.height * 0.05, canvas.height * 0.95, canvas.width * 0.9);
	
	//	DRAW -> video, camera (on loop)
	drawVideo(GAME.canvas.video, GAME.canvas._context.video, GAME.video);
	
	//	REMOVE_ATTRIBUTE -> hidden, pose, text, time, video
	removeAttributes([
		GAME.canvas.fade,
		GAME.canvas.pose,
		GAME.canvas.text,
		GAME.canvas.time,
		GAME.canvas.video
	], 'hidden');
	
	//	CALL -> time, duration (on loop, until end)
	//		DRAW -> time, duration
	GAME.time = drawTime(GAME.canvas.time, GAME.canvas._context.time, GAME.duration.rounds, color);
	GAME.canvas.time.addEventListener('end', onRoundEnd);
	
	//	ADD_LISTENER -> fade, touch
	GAME.canvas.fade.addEventListener('inputend', onRoundEnd);
	
	//	FADE_OUT -> fade, duration
	fadeOut();
};

const onRoundEnd = async function() {
	//ON_SNAP || ON_TIME_END
	
	//	STOP -> time (stop loop, event)
	GAME.time();
	//	REMOVE_LISTENER -> fade, touch
	GAME.canvas.time.removeEventListener('end', onRoundEnd);
	//	REMOVE_LISTENER -> fade, touch
	GAME.canvas.fade.removeEventListener('inputend', onRoundEnd);
	
	//	FADE_IN -> fade, duration
	fadeIn(onProcessStart);
};

const onProcessStart = async function() {
	//ON_FADED
	
	//	SET_ATTRIBUTE -> hidden, video
	setAttributes(GAME.canvas.video, 'hidden', true);
	
	//	STOP -> video (stop loop)
	GAME.video.pause();
	
	//	PROCESS -> posenet, video
	let netPose = await GAME.posenet.estimateSinglePose(GAME.canvas.video, GAME.posenetOptions.imageScaleFactor, false, GAME.posenetOptions.outputStride);
	
	//ON_PROCESSED
	//	CONVERT -> keypoints, pose
	//	SET -> headPos = average(nose, eyes, ears)
	const netPoseLength = netPose.keypoints.length;
	const result = {};
	const headPoints = [];
	for (let i = 0; i < netPoseLength; i++) {
		const keypoint = netPose.keypoints[i];
		
		if (['nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar'].includes(keypoint.part)) {
			if (keypoint.score >= GAME.posenetOptions.keypointThreshold) {
				headPoints.push({
					x: keypoint.position.x / GAME.canvas.video.width,
					y: keypoint.position.y / GAME.canvas.video.height
				});
			}
			continue;
		}
		
		if (keypoint.score >= GAME.posenetOptions.keypointThreshold) {
			result[keypoint.part] = {
				x: keypoint.position.x / GAME.canvas.video.width,
				y: keypoint.position.y / GAME.canvas.video.height
			};
		}
	}
	
	if (headPoints.length > 0) {
		// Calculate the sum of each position.
		const headPosition = headPoints.reduce(function(previous, current) {
			return {
				x: previous.x + current.x,
				y: previous.y + current.y,
			};
		}, { x: 0, y: 0 });
		// Calculate the average position.
		// Add head position to result.
		result.head = {
			x: headPosition.x / headPoints.length,
			y: headPosition.y / headPoints.length
		};
	}
	// Override actual pose with new result.
	netPose = result;
	
	// FILTER_MISSING -> expectedPose, actualPose
	let expectedPose = {};
	const rawPose = GAME.poses[GAME.poseIndex];
	Object.keys(rawPose).forEach(function(keypoint) {
		if (netPose.hasOwnProperty(keypoint)) {
			expectedPose[keypoint] = rawPose[keypoint];
		}
	});
	let actualPose = {};
	Object.keys(netPose).forEach(function(keypoint) {
		if (expectedPose.hasOwnProperty(keypoint)) {
			actualPose[keypoint] = netPose[keypoint];
		}
	});
	const maximumScore = (Object.keys(rawPose).length - (Object.keys(rawPose).length - Object.keys(actualPose).length)) * 10;
	
	//	CREATE_ARRAY -> actualPose
	actualPose = arrayifyPose(actualPose);
	//	CREATE_ARRAY -> expectedPose
	expectedPose = arrayifyPose(expectedPose);
	
	//	COMPUTE_COSINE_DISTANCE -> actualPose, expectedPose -> cosineDistance
	const cosineDistance = computeCosineDistance(actualPose, expectedPose);
	//	SET -> score
	let score = isNaN(cosineDistance) ? 0 : Maths.ratio(Maths.clamp(Math.sqrt(cosineDistance), 0, 1), 1, 0, 0, maximumScore);
	//	SET -> scoreTotal += score
	GAME.scoreTotal += score;
	
	//	CLEAR_CANVAS -> text
	let canvas = GAME.canvas.text,
		context = GAME.canvas._context.text;
	context.clearRect(0, 0, canvas.width, canvas.height);
	//	DRAW -> text, score
	context.fillStyle = GAME.textOptions.colorWhite;
	context.font = `bold ${GAME.textOptions.fontSize * 2}px ${GAME.textOptions.font * 6}`;
	context.fillText(`+${score.toFixed(0)}`, canvas.height * 0.05, (canvas.height * 0.95) - (GAME.textOptions.fontSize * 1.5), canvas.width * 0.9);
	
	//	CLEAR -> pose
	canvas = GAME.canvas.pose;
	context = GAME.canvas._context.pose;
	context.clearRect(0, 0, canvas.width, canvas.height);
	//	DRAW -> pose, pose[poseIndex]
	drawPose(canvas, context, netPose);
	
	//	CALL -> time, duration (on loop, until end)
	//		DRAW -> time, duration (game.time.score)
	GAME.time = drawTime(GAME.canvas.time, GAME.canvas._context.time, GAME.duration.score);
	GAME.canvas.time.addEventListener('end', onScoreShown);
	
	//	FADE_OUT -> fade, duration
	fadeOut();
};

const onScoreShown = async function() {
	//ON_TIME_END
	
	//	REMOVE_LISTENER -> fade, touch
	GAME.canvas.time.removeEventListener('end', onScoreShown);
	
	//	FADE_IN -> fade, duration
	fadeIn(onScoreEnd)
};

const onScoreEnd = async function() {
	//ON_FADED
	
	//	IF < roundsLength
	if (GAME.poseIndex < GAME.roundsLength - 1) {
		//	SET -> poseIndex ++
		GAME.poseIndex++;
		//	GOTO -> ROUND_START
		await onRoundStart();
		return;
	}
	//	ELSE
	
	//	SET_ATTRIBUTE -> hidden, pose, video
	setAttributes([
		GAME.canvas.pose,
		GAME.canvas.time
	], 'hidden', true);
	
	//	CLEAR_CANVAS -> text
	let context = GAME.canvas._context.text;
	context.clearRect(0, 0, GAME.canvas.text.width, GAME.canvas.text.height);
	//	DRAW -> text, scoreTotal
	context.fillStyle = GAME.textOptions.colorBlack;
	context.font = `bold ${GAME.textOptions.fontSize * 2}px ${GAME.textOptions.font * 8}`;
	context.fillText(GAME.scoreTotal.toFixed(0), GAME.canvas.text.height * 0.05, (GAME.canvas.text.height * 0.95) - (GAME.textOptions.fontSize * 1.5), GAME.canvas.text.width * 0.9);
	
	//	FADE_OUT -> fade, duration 
	fadeOut(onScoreTotalStart);
};

const onScoreTotalStart = async function() {
	//ON_FADED
	
	setTimeout(function() {
		//	DRAW -> text, restart
		let context = GAME.canvas._context.text;
		context.fillStyle = GAME.textOptions.colorHighlight;
		context.font = `${GAME.textOptions.fontSize}px ${GAME.textOptions.font}`;
		context.fillText(GAME.text.start, GAME.canvas.text.height * 0.05, GAME.canvas.text.height * 0.95, GAME.canvas.text.width * 0.9);
		
		//	ADD_LISTENER -> fade, touch
		GAME.canvas.fade.addEventListener('inputend', onScoreTotalEnd);
	}, GAME.duration.restart);
};

const onScoreTotalEnd = async function() {
	//ON_TOUCH
	
	//	REMOVE_LISTENER -> fade, touch
	GAME.canvas.fade.removeEventListener('inputend', onScoreTotalEnd);
	
	//	FADE_IN -> fade, duration 
	fadeIn(onRestartStart)
};

const onRestartStart = async function() {
	//ON_FADED
	
	//	GOTO -> START
	await onGameStart();
};

// Helper functions.

const setAttributes = function(elements, attribute, value = null) {
	if (Array.isArray(elements)) {
		elements.forEach(function(element) {
			element.setAttribute(attribute, value);
		});
		return;
	}
	
	elements.setAttribute(attribute, value);
};

const removeAttributes = function(elements, attribute) {
	if (Array.isArray(elements)) {
		elements.forEach(function(element) {
			element.removeAttribute(attribute);
		});
		return;
	}
	
	elements.removeAttribute(attribute);
};

// Event dispatching.
const dispatch = function(element, name) {
	element.dispatchEvent(
		new CustomEvent(name)
	);
};

const fade = function(canvas, context, alphaFrom, alphaTo, duration, callback) {
	const time = (new Date).getTime();
	
	const animate = function() {
		const timeNew = (new Date).getTime();
		
		const timePassed = timeNew - time;
		const alpha = Maths.ratio(timePassed, 0, duration, alphaFrom, alphaTo);
		
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.globalAlpha = Maths.clamp(alpha, 0, 1);
		context.fillStyle = '#fff';
		context.fillRect(0, 0, canvas.width, canvas.height);
		
		if (timePassed <= duration) {
			requestAnimationFrame(animate);
			return;
		}
		
		if (callback) {
			requestAnimationFrame(callback);
		}
	};
	
	animate();
};

const fadeIn = function(callback) {
	fade(GAME.canvas.fade, GAME.canvas._context.fade, 0, 1, GAME.duration.fadeIn, callback);
};

const fadeOut = function(callback) {
	fade(GAME.canvas.fade, GAME.canvas._context.fade, 1, 0, GAME.duration.fadeOut, callback);
};

const drawPose = function(canvas, context, pose, color = '#fff') {
	// Create opaque rectangle.
	context.fillStyle = context.strokeStyle = color;
	
	let path;
	
	if (pose.head) {
		// Head.
		path = new Path2D();
		path.arc(pose.head.x * canvas.width, pose.head.y * canvas.height,  GAME.pose.headRadius * canvas.width, 0, 2 * Math.PI);
		
		context.fill(path);
	}
	
	context.lineCap = context.lineJoin = 'round';
	context.lineWidth = GAME.pose.lineWidth * canvas.width;
	
	// Torso.
	if (pose.leftShoulder && pose.rightShoulder && pose.leftHip && pose.rightHip) {
		path = new Path2D();
		path.moveTo(pose.leftShoulder.x * canvas.width, pose.leftShoulder.y * canvas.height);
		path.lineTo(pose.rightShoulder.x * canvas.width, pose.rightShoulder.y * canvas.height);
		path.lineTo(pose.rightHip.x * canvas.width, pose.rightHip.y * canvas.height);
		path.lineTo(pose.leftHip.x * canvas.width, pose.leftHip.y * canvas.height);
		path.lineTo(pose.leftShoulder.x * canvas.width, pose.leftShoulder.y * canvas.height);
		
		context.fill(path);
		context.stroke(path);
	}
	
	// Left arm.
	if (pose.leftShoulder && pose.leftElbow) {
		path = new Path2D();
		path.moveTo(pose.leftShoulder.x * canvas.width, pose.leftShoulder.y * canvas.height);
		path.lineTo(pose.leftElbow.x * canvas.width, pose.leftElbow.y * canvas.height);
		
		context.stroke(path);
	}
	if (pose.leftElbow && pose.leftWrist) {
		path = new Path2D();
		path.moveTo(pose.leftElbow.x * canvas.width, pose.leftElbow.y * canvas.height);
		path.lineTo(pose.leftWrist.x * canvas.width, pose.leftWrist.y * canvas.height);
		
		context.stroke(path);
	}
	
	// Right arm.
	if (pose.rightShoulder && pose.rightElbow) {
		path = new Path2D();
		path.moveTo(pose.rightShoulder.x * canvas.width, pose.rightShoulder.y * canvas.height);
		path.lineTo(pose.rightElbow.x * canvas.width, pose.rightElbow.y * canvas.height);
				
		context.stroke(path);
	}
	if (pose.rightElbow && pose.rightWrist) {
		path = new Path2D();
		path.moveTo(pose.rightElbow.x * canvas.width, pose.rightElbow.y * canvas.height);
		path.lineTo(pose.rightWrist.x * canvas.width, pose.rightWrist.y * canvas.height);
		
		context.stroke(path);
	}
	
	// Left Leg.
	if (pose.leftHip && pose.leftKnee) {
		path = new Path2D();
		path.moveTo(pose.leftHip.x * canvas.width, pose.leftHip.y * canvas.height);
		path.lineTo(pose.leftKnee.x * canvas.width, pose.leftKnee.y * canvas.height);
		
		context.stroke(path);
	}
	if (pose.leftKnee && pose.leftAnkle) {
		path = new Path2D();
		path.moveTo(pose.leftKnee.x * canvas.width, pose.leftKnee.y * canvas.height);
		path.lineTo(pose.leftAnkle.x * canvas.width, pose.leftAnkle.y * canvas.height);
		
		context.stroke(path);
	}
	
	// Right Leg.
	if (pose.rightHip && pose.rightKnee) {
		path = new Path2D();
		path.moveTo(pose.rightHip.x * canvas.width, pose.rightHip.y * canvas.height);
		path.lineTo(pose.rightKnee.x * canvas.width, pose.rightKnee.y * canvas.height);
		
		context.stroke(path);
	}
	if (pose.rightKnee && pose.rightAnkle) {
		path = new Path2D();
		path.moveTo(pose.rightKnee.x * canvas.width, pose.rightKnee.y * canvas.height);
		path.lineTo(pose.rightAnkle.x * canvas.width, pose.rightAnkle.y * canvas.height);
		
		context.stroke(path);
	}
};

const drawVideo = function(canvas, context, video) {
	video.play();
	
	let x = 0,
		y = 0,
		width = video.videoWidth,
		height = video.videoHeight;
	if (video.videoWidth < video.videoHeight) {
		const factor = (video.videoHeight - video.videoWidth) / 2;
		y = factor
		height -= factor;
	} else {
		const factor = (video.videoWidth - video.videoHeight) / 2;
		x = factor
		width -= factor;
	}
	
	const animate = () => {
		// Stop when video is paused.
		if (video.paused || video.ended) {
			return;
		}
		
		// Draw video frame to canvas.
		context.drawImage(video, x, y, width, height, 0, 0, canvas.width, canvas.height);
		
		// Loop
		requestAnimationFrame(animate);
	};
	
	animate();
};

const drawTime = function(canvas, context, duration, color) {
	context.clearRect(0, 0, canvas.width, canvas.height);
	
	const time = (new Date).getTime();
	if (!color) {
		color = GAME.colors[Math.floor(Math.random() * GAME.colors.length)];
	}
	let stop = false;
	
	const animate = function() {
		if (stop) {
			return;
		}
		
		const timeNew = (new Date).getTime();
		
		const timePassed = timeNew - time;
		const width = Maths.ratio(timePassed, 0, duration, 0, canvas.width);
		
		context.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
		context.fillRect(0, 0, width, canvas.height);
		
		if (timePassed < duration) {
			return requestAnimationFrame(animate);
		}
		
		dispatch(canvas, 'end');
	};
	
	animate();
	
	// Return cancel event.
	return function() {
		stop = true;
	};
};

const arrayifyPose = function(pose) {
	const result = [];
	[
		'head',
		'leftShoulder',
		'rightShoulder',
		'leftElbow',
		'rightElbow',
		'leftWrist',
		'rightWrist',
		'leftHip',
		'rightHip',
		'leftKnee',
		'rightKnee',
		'leftAnkle',
		'rightAnkle'
	].forEach(function(keypoint) {
		if (!pose[keypoint]) {
			return;
		}
		result.push(pose[keypoint].x);
		result.push(pose[keypoint].y);
	});
	
	return result;
};