const Maths = {};

// Returns the absolute of the value.
const abs = Maths.abs = function(value) {
	if (value >= 0) {
		return value;
	}
	return -value;
};

// Scales the ratio from ranging between the value min and value max to the target min and target max.
const ratio = Maths.ratio = function(value, valueMin, valueMax, targetMin, targetMax) {
	return (value - valueMin) * (targetMax - targetMin) / (valueMax - valueMin) + targetMin;
};

// Returns the value within the limits.
const clamp = Maths.clamp = function(value, min, max) {
	if (min >= value) {
		return min;
	}
	if (value >= max) {
		return max;
	}
	return value;
};

// Rounds the number off to the precision given.
const toFixed = Maths.toFixed = function(value, precision) {
	let power = Math.pow(10, precision || 0);
	return Math.round(value * power) / power;
};

// Angles and degree

// Returns the angle between 0 and 360.
const normalizeAngle = Maths.normalizeAngle = function(angle) {
	return (360 + (angle % 360)) % 360;
};

// Returns whether the angle is inclusive in between the values given.
const isBetweenAngle = Maths.isBetweenAngle = function(angle, min, max) {
	angle = Maths.normalizeAngle(angle);
	min = Maths.normalizeAngle(min);
	max = Maths.normalizeAngle(max);
	
	if (min < max) {
		return min <= angle && angle <= max;
	}
	return min <= angle || angle <= max;
};

// Clamps the value to the nearest min and max, if it is not in between.
const clampAngle = Maths.clampAngle = function(value, min, max) {
	value = Maths.normalizeAngle(value);
	min = Maths.normalizeAngle(min);
	max = Maths.normalizeAngle(max);
	
	if (Maths.distanceAngle(value, min) < 0) {
		return min;
	}
	if (Maths.distanceAngle(value, max) > 0) {
		return max;
	}
	return value;
};

// Calculates the distance from the given angle on a circle in degrees.
const distanceAngle = Maths.distanceAngle = function(value, from) {
	value = Maths.normalizeAngle(value);
	from = Maths.normalizeAngle(from);
	
	let to = value - from;
	// If 'to' is smaller than half a circle return without change.
	if (Maths.abs(to) < 180) {
		return to;
	}
	// Otherwise calculate the other way around of the circle.
	if (to >= 0) {
		return -(360 - Maths.abs(to));
	}
	return 360 - Maths.abs(to);
};

// Exports.
export default Maths;
export {
	abs,
	ratio,
	clamp,
	toFixed,
	
	normalizeAngle,
	isBetweenAngle,
	clampAngle,
	distanceAngle
};