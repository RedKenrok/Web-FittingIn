'use strict';

var version = 'v1::';
var offlineFundamentals = [
	'/index.html',
	// Data.
	'/data/colors.json',
	'/data/poses.json',
	'/data/text.json',
	// Scripts.
	'/scripts/libraries/compute-cosine-distance.js',
	'/scripts/modules/data/JsonLoad.js',
	'/scripts/modules/graphics/Camera.js',
	'/scripts/modules/graphics/Canvas.js',
	'/scripts/modules/graphics/Resize.js',
	'/scripts/modules/Maths.js',
	'/scripts/modules/Vector2.js',
	'/scripts/app.js',
	'/scripts/menu.js',
	// Styles.
	'/styles/app.css',
	'/styles/base.css',
	'/styles/menu.css',
	// External scripts.
	'https://unpkg.com/@tensorflow/tfjs@0.14.2/dist/tf.min.js',
	'https://unpkg.com/@tensorflow-models/posenet@0.2.3/dist/posenet.min.js',
	// External styles.
	'https://unpkg.com/tailwindcss@^1.1/dist/base.min.css'
];

self.addEventListener('install', function(event) {
	event.waitUntil(
		caches
			.open(version + 'fundamentals')
			.then(function(cache) {
				return cache.addAll(offlineFundamentals);
			})
	);
});

self.addEventListener('fetch', function(event) {
	if (event.request.method !== 'GET') {
		return;
	}

	event.respondWith(
		caches
			.match(event.request)
			.then(function(cached) {
				var networked = fetch(event.request)
					.then(fetchedFromNetwork, unableToResolve)
					.catch(unableToResolve);
					
				return cached || networked;

				function fetchedFromNetwork(response) {
					var cacheCopy = response.clone();

					caches
						.open(version + 'pages')
						.then(function add(cache) {
							cache.put(event.request, cacheCopy);
						});
					
					return response;
				}
				
				function unableToResolve() {
					return new Response('<h1>Service Unavailable</h1>', {
						status: 503,
						statusText: 'Service Unavailable',
						headers: new Headers({
							'Content-Type': 'text/html'
						})
					});
				}
			})
		);
});

self.addEventListener('activate', function(event) {
	event.waitUntil(
		caches
			.keys()
			.then(function(keys) {
				return Promise.all(
					keys
						.filter(function (key) {
							return !key.startsWith(version);
						})
						.map(function (key) {
							return caches.delete(key);
						})
				);
			})
		);
});
