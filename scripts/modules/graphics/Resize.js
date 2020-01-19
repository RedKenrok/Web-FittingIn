const Resize = function(element, resizeHandler, size) {
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
	
	if (resizeHandler !== undefined && resizeHandler !== null && typeof resizeHandler === `function`) {
		const onResize = function(windowSize) {
			let result = resizeHandler(windowSize);
			element.width = result.size.x;
			element.height = result.size.y;
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
		onResize(size);
	}
};

export default Resize;