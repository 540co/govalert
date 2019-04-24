// For storing data locally. Principally for development.
const STORAGE_KEY = "540mongo-weather-alerts";

// Features to import from ArcGIS.
const ARCGIS_LIBS = [
	"esri/Map", "esri/views/MapView", "esri/Graphic", "esri/geometry/Point",
	"esri/symbols/SimpleMarkerSymbol", "esri/request",
	"esri/geometry/Polygon", "esri/symbols/SimpleFillSymbol",
	"esri/core/watchUtils", "esri/geometry/support/webMercatorUtils", "esri/symbols/SimpleMarkerSymbol"
];

var mapify = function (Map, MapView, Graphic, Point, Marker, esriRequest, Polygon, Fill, watchUtils, webMercatorUtils, SimpleMarkerSymbol) {

	/* Build a point marker */
	var point = (longitude, latitude) => new Graphic({
		geometry: new Point({ longitude: longitude, latitude: latitude }),
		symbol: new Marker(PT_SYMBOL)
	});

	/* Build a polygon */
	var polygon = coordinates => new Graphic({
		geometry: new Polygon({ rings: coordinates }),
		symbol: new Fill(POLY_SYMBOL)
	});

	// Funct to show and then hide a notification for the user
	var showNotification = notification => {
		var msgfield = document.getElementById(SHADOW);
		msgfield.style.display = "block";
		msgfield.children[0].innerHTML = notification;
		window.setTimeout(function () {
			msgfield.classList.add("completed");
			window.setTimeout(() => msgfield.style.display = "none", MSG_TIME);
		}, MSG_TIME2);
	}

	// Transform a datum to make it usable on the map. TODO consider having the BE do this.
	var transform = function (item) {

		var poly = [];
		for (var c in item.polygon) {
			var x = item.polygon[c][0]["$numberDouble"];
			var y = item.polygon[c][1]["$numberDouble"];
			if (x && y) { poly.push([x, y]) }
		}
		item.polygon = poly;
		item.latitude = Number(item.latitude["$numberDouble"]);
		item.longitude = Number(item.longitude["$numberDouble"]);
		return item

	} // End of transform(1)

	// This function gets run when everything else is ready.
	var render = function (view, data, store, notification) {

		// Store => data is raw, so transform it.
		if (store) { data = data.map(item => transform(item)) }

		// Add the polygon for each alert to the map.
		for (var j in data) {
			if (data[j].longitude && data[j].latitude) {
				view.graphics.add(polygon(data[j].polygon));
			}
		}

		// Notify the user of how far they are from any alert.
		// This will be more useful once geolocation is enabled.
		showNotification(notification);

		// If the data came in raw and was transformed, store it.
		if (store) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }

	} // End of render(3)


	// Funct to find the nearest alert (roughly).
	var findNearestProblem = function (data) {

		var nearest = EARTH_R, item = null;

		// Distance between two [lat, long] pairs. Read to risk a headache. 
		function dist(p1, p2) {
			if (!p2.longitude || !p2.latitude) { return EARTH_R }
			var sqrt = Math["sqrt"], s = Math["sin"], c = Math["cos"], atan2 = Math["atan2"];
			var dlat = p2.latitude - p1.latitude, dlon = p2.longitude - p1.longitude;
			var a = (s(dlat / 2)) * (s(dlat / 2)) + c(p1.latitude) * c(p2.latitude) * (s(dlon / 2)) * (s(dlon / 2));
			var c = 2 * atan2(sqrt(a), sqrt(1 - a));
			return EARTH_R * c;
		}

		// Go through each alert to find the closest. TODO replace DEF with user's.
		for (var i in data) {
			if ((d = dist({ longitude: DEFAULT_LOC[0], latitude: DEFAULT_LOC[1] }, data[i])) < nearest) {
				nearest = d;
				item = data[i];
			}
		}

		// Return the nearest point and its distance.
		return { distance: nearest, data: item };

	} // End of findNearestProblem(1)


	/* Get everything running once all data is read (e.g. location is determined). */
	var start = function () {
		console.log("started");
		// Generate and set up the map base
		var view = new MapView({
			container: CONTAINER,
			map: new Map(MAP_TYPE),
			center: coords,
			zoom: DEFAULT_ZOOM
		});

		// view.watch("scale", function (event) {
		// 	console.log(event);
		// 	console.log("scaling");
		// });

		watchUtils.whenTrue(view, "stationary", function () {
			if (view.extent) {
				var upperRightBound = webMercatorUtils.xyToLngLat(view.extent.xmax, view.extent.ymax);
				var lowerLeftBound = webMercatorUtils.xyToLngLat(view.extent.xmin, view.extent.ymin);
				var queryParams = "?minlong=" + lowerLeftBound[0] + "&minlat=" + lowerLeftBound[1] + "&maxlong=" + upperRightBound[0] + "&maxlat=" + upperRightBound[1];

				var req = new XMLHttpRequest();
				req.addEventListener("load", drawContracts);
				req.open("GET", CONTRACTS_DATA_URL + queryParams);
				req.send();

				// var upperRightBoundPoint = new Point({
				// 	longitude: upperRightBound[0],
				// 	latitude: upperRightBound[1]
				// });

				// var markerSymbol = new SimpleMarkerSymbol({
				// 	color: [226, 119, 40],
				// 	outline: {
				// 		color: [255, 255, 255],
				// 		width: 1
				// 	}
				// });

				// var upperRightBoundPointGraphic = new Graphic({
				// 	geometry: upperRightBoundPoint,
				// 	symbol: markerSymbol
				// });

				// view.graphics.add(upperRightBoundPointGraphic);

				function drawContracts() {

					// view.graphics.removeAll();
					var contractData = JSON.parse(req.response);
					contractData.forEach(contract => {
						var contractPoint = new Point({
							longitude: contract.primaryPlaceOfPerformanceLng,
							latitude: contract.primaryPlaceOfPerformanceLat,
						});

						var markerSymbol = new SimpleMarkerSymbol({
							color: [226, 119, 40],
							outline: {
								color: [255, 255, 255],
								width: 1
							}
						});

						var contractPointGraphic = new Graphic({
							geometry: contractPoint,
							symbol: markerSymbol
						});

						view.graphics.add(contractPointGraphic);
					});
				}
			}
		});

		// Check if we have data on the client. TODO: check if it's new-ish.
		var storedData = localStorage.getItem(STORAGE_KEY);

		// If we don't have local data, load it from Stitch.
		if (!storedData) {
			console.log("Fetching data.");
			var req = new XMLHttpRequest();
			req.addEventListener("load", finish);
			req.open("GET", WEATHER_DATA_URL);
			req.send();
			var n = findNearestProblem(storedData);
			function finish() { render(view, JSON.parse(req.response), true, DISTANCE_ALERT(n)) }
		}

		// If we do have local data, grab it.
		else {
			console.log("Loading cached data.");
			storedData = JSON.parse(storedData);
			var n = findNearestProblem(storedData);
			render(view, storedData, false, DISTANCE_ALERT(n));
		}

	} // End of start()

	var coords = DEFAULT_LOC;
	var geoStart = pos => { coords = [pos.coords.longitude, pos.coords.latitude]; start() }
	var geoFailStart = err => { console.log(GEO_FAIL_ALERT(err)); start() }

	// Attempt to get user location. Launch map either way.
	var run = function () {

		if ("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition(
				position => geoStart(position),
				err => geoFailStart(err),
				GEO_TIMEOUT
			);
		}

		else { start() }

	} // End of run()

	window.addEventListener("load", run)

} // End of ArgGIS handler function.

require(ARCGIS_LIBS, mapify);

// Respond to clear button by clearing local storage.
document.getElementById("clear").addEventListener("click", clear);
function clear() { localStorage.removeItem(STORAGE_KEY) }
