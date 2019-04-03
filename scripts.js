require ([
	"esri/Map", "esri/views/MapView", 
	"esri/Graphic", "esri/geometry/Point", 
	"esri/symbols/SimpleMarkerSymbol",
	"esri/request",
	"esri/geometry/Polygon",
	"esri/symbols/SimpleFillSymbol"
], function(Map, MapView, Graphic, Point, SimpleMarkerSymbol, esriRequest, Polygon, SimpleFillSymbol) {

	/* Constants for calibration */
	const PT_FILL = [200, 200, 200], PT_OUTLINE = [0, 0, 0], PT_OUTLINE_WIDTH = 2;
	const POLY_FILL = [227, 139, 79, 0.8], POLY_OUTLINE = [255, 255, 255], POLY_OUTLINE_WIDTH = 1;
	const PT_SYMBOL = { color: PT_FILL, outline: { color: PT_OUTLINE, width: PT_OUTLINE_WIDTH } }
	const POLY_SYMBOL = { color: POLY_FILL, outline: { color: POLY_OUTLINE, width: POLY_OUTLINE_WIDTH } }
	const DEFAULT_LOC = [-77.037, 38.898]; // Near the White House

	/* Funct to build a point indicator */
	var point = function(longitude, latitude) {
		return new Graphic({
			geometry: new Point({ longitude: longitude, latitude: latitude }),
			symbol: new SimpleMarkerSymbol(PT_SYMBOL)
		});
	}

	/* Funct to build a polygon */
	var polygon = function(coordinates) {
		return new Graphic({
			geometry: new Polygon({ rings: coordinates }),
			symbol: new SimpleFillSymbol(POLY_SYMBOL)
		});
	}

	var map = new Map({basemap: "topo-vector"});

	var view = new MapView({
		container: "chartdiv",
		map: map,
		center: [-90.430000000000007, 38.509999999999998],
		zoom: 8
	});

	var render = function(view, data, store) {
		if (store) {
			for (var i in data) { 
				//data[i] = {
				//	"latitude": Number(data[i].latitude["$numberDouble"]), 
				//	"longitude": Number(data[i].longitude["$numberDouble"]),
				//	"name": data[i].city,
				//	"event": data[i].event_type
				//}
				var lat = Number(data[i].latitude["$numberDouble"]);
				var lon = Number(data[i].longitude["$numberDouble"]);
				var poly = [];
				for (var c in data[i].polygon) {
					var x = data[i].polygon[c][0]["$numberDouble"];
					var y = data[i].polygon[c][1]["$numberDouble"];
					if (x && y) { poly.push([x, y]) }
				}
				data[i].latitude = lat;
				data[i].longitude = lon;
				data[i].polygon = poly;
			}
		}
		for (var j in data) {
			if (data[j].longitude && data[j].latitude) {
				//view.graphics.add(point(data[j].longitude, data[j].latitude));
				view.graphics.add(polygon(data[j].polygon));
			}
		}
		if (store) { localStorage.setItem("540mongo-weather-alerts", JSON.stringify(data)) }
	} // End of render(3)

	/* Get everything running once location is determined. */
	var start = function() {

		// Generate map base
		var view = new MapView({
			container: "chartdiv",
			map: new Map({basemap: "topo-vector"}),
			center: coords,
			zoom: 11
		});

		// Check if we have data on the client. TODO: check if it's new-ish.
		var storedData = localStorage.getItem("540mongo-weather-alerts");

		if (!storedData) {
			console.log("Fetching data.");
			var req = new XMLHttpRequest();
			req.addEventListener("load", finish)
			req.open("GET", "https://us-east-1.aws.webhooks.mongodb-stitch.com/api/client/v2.0/app/540-1-vvypp/service/get_weather_alerts/incoming_webhook/get-webhook")
			req.send();
			function finish() { render(view, JSON.parse(req.response), true) }
		}
		else {
			console.log("Loading cached data.");
			storedData = JSON.parse(storedData);
			render(view, storedData, false);
		}

	} // End of start()

	// Add geolocation in here (again)
	var coords = DEFAULT_LOC;
	start();

});
