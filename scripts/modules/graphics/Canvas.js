// Imports
import Vector2 from '../Vector2.js';

/**
 * 
 * @param {*} canvasElement 
 * @param {*} resizeHandler 
 */
const Canvas = function(element, resizeHandler, canvasSize) {
	// Touch constructor.
	const Touch = this.Touch = function(identifier, position = new Vector2(0, 0), force = 1) {
		this.identifier = identifier;
		this.position = position;
		this.force = force;
		
		this.move = function(position, force) {
			this.previousPosition = this.position;
			this.position = position;
			this.force = force;
		};
	};
	
	// Helper functions.
	// Event dispatching.
	const dispatch = function(name, detail) {
		element.dispatchEvent(
			new CustomEvent(
				name, {
					detail: detail
				}
			)
		);
	};
	// Perform given function over data array.
	const iterate = function(data, _function) {
		return Object.keys(data).map(function(key) {
			return _function(data[key]);
		});
	};
	
	const touches = [];
	let offset = new Vector2();
	
	if (resizeHandler !== undefined && resizeHandler !== null && typeof resizeHandler === `function`) {
		const onResize = function(windowSize) {
			let result = resizeHandler(windowSize);
			element.width = result.size.x;
			element.height = result.size.y;
			offset = result.offset;
			dispatch(`resize`, {
				size: result.size
			});
		};
		window.addEventListener(`resize`, function(event) {
			onResize({
				x: event.target.innerWidth,
				y: event.target.innerHeight
			});
		});
		onResize(canvasSize);
	}
	
	// Touch functions.
	// Start.
	const touchStart = function(data) {
		if (data.identifier === undefined || data.identifier === null) {
			return undefined;
		}
		const touch = touches[data.identifier] = new Touch(
			data.identifier,
			new Vector2(data.pageX - offset.x, data.pageY - offset.y),
			data.force
		);
		return touch;
	};
	// Move.
	const touchMove = function(data) {
		if (data.identifier === undefined || data.identifier === null || !touches[data.identifier]) {
			return undefined;
		}
		const touch = touches[data.identifier];
		touch.move(
			new Vector2(data.pageX - offset.x, data.pageY - offset.y),
			data.force
		);
		return touch;
	};
	// End.
	const touchEnd = function(data) {
		return touches[data.identifier] = undefined;
	};
	
	// Listeners to the standard canvas events.
	// Start.
	element.addEventListener(`touchstart`, function(event) {
		event.preventDefault();
		dispatch(`inputstart`, {
			touches: iterate(event.changedTouches, touchStart)
		});
	});
	element.addEventListener(`mousedown`, function(event) {
		event.preventDefault();
		dispatch(`inputstart`, {
			touches: [
				touchStart({
					identifier: 0,
					pageX: event.pageX,
					pageY: event.pageY,
					force: 1
				})
			]
		});
	});
	// Move.
	element.addEventListener(`touchmove`, function(event) {
		event.preventDefault();
		dispatch(`inputmove`, {
			touches: iterate(event.changedTouches, touchMove)
		});
	});
	element.addEventListener(`mousemove`, function(event) {
		event.preventDefault();
		const touch = touchMove({
			identifier: 0,
			pageX: event.pageX,
			pageY: event.pageY,
			force: 1
		});
		if (touch !== undefined && touch !== null) {
			dispatch(`inputmove`, {
				touches: [
					touch
				]
			});
		}
	});
	// End.
	element.addEventListener(`touchend`, function(event) {
		event.preventDefault();
		dispatch(`inputend`, {
			touches: iterate(event.changedTouches, touchEnd)
		});
	});
	element.addEventListener(`mouseup`, function(event) {
		event.preventDefault();
		dispatch(`inputend`, {
			touches: [
				touchEnd({
					identifier: 0
				})
			]
		});
	});
};

// Exports.
export default Canvas;