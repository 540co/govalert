// For storing data locally. Principally for development.
const STORAGE_KEY = "540mongo-weather-alerts";

// Features to import from ArcGIS.
const ARCGIS_LIBS = [
	"esri/Map", "esri/views/MapView", "esri/Graphic", "esri/geometry/Point", 
	"esri/symbols/SimpleMarkerSymbol", "esri/request",
	"esri/geometry/Polygon", "esri/symbols/SimpleFillSymbol"
];

require (ARCGIS_LIBS, function(Map, MapView, Graphic, Point, Marker, esriRequest, Polygon, Fill) {

	// Define a point marker (currently unused)
	const PT_FILL = [200, 200, 200], PT_OUTLINE = [0, 0, 0], PT_OUTLINE_WIDTH = 2;
	const PT_SYMBOL = { color: PT_FILL, outline: { color: PT_OUTLINE, width: PT_OUTLINE_WIDTH } }

	// Define a polygon marker
	const POLY_FILL = [190, 74, 82, 0.8], POLY_OUTLINE = [255, 255, 255], POLY_OUTLINE_WIDTH = 2;
	const POLY_SYMBOL = { color: POLY_FILL, outline: { color: POLY_OUTLINE, width: POLY_OUTLINE_WIDTH } }
	
	// Definitions for distance calculations
	const MAX_DIST = 12451; // The farthest any point on earth can be from another
	const EARTH_R = 3959; // Radius of earth.
	
	// Definitions for setting up the map.
	const CONTAINER = "chartdiv"; //What element holds the map
	const MAP_TYPE = {basemap: "topo-vector"}; // What map type to use
	const DEFAULT_LOC = [-77.037, 38.898]; // Location to show on load (near White House)
	const DEFAULT_ZOOM = 11; // How far to zoom in on load

	// Routes to hit for data
	const WEATHER_DATA_URL = "https://us-east-1.aws.webhooks.mongodb-stitch.com/api/client/v2.0/app/540-1-vvypp/service/get_weather_alerts/incoming_webhook/get-webhook";

	// Messages
	const DISTANCE_ALERT = n => `Closest alert is about ${Math.floor(n.distance)} miles away.`;

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
	var showNotification = function(notification) {
		document.getElementById("chartshadow").style.display = "block";
		document.getElementById("chartshadow").children[0].innerHTML = notification;
		var showhide = window.setTimeout(function() {
			document.getElementById("chartshadow").classList.add("completed");
			var donehide = window.setTimeout(function() {
				document.getElementById("chartshadow").style.display = "none";
			}, 2000);
		}, 3000);
	}

	// This function gets run when everything else is ready.
	var render = function(view, data, store, notification) {

		// Store => data is raw, so transform it.
		if (store) {

			// Process each alert. Capture lat, long, alert area, etc.
			for (var i in data) {

				var poly = [];
				for (var c in data[i].polygon) {
					var x = data[i].polygon[c][0]["$numberDouble"];
					var y = data[i].polygon[c][1]["$numberDouble"];
					if (x && y) { poly.push([x, y]) }
				}
				data[i].polygon = poly;
				data[i].latitude = Number(data[i].latitude["$numberDouble"]);
				data[i].longitude = Number(data[i].longitude["$numberDouble"]);
				
			} // End of processing each alert

		} // End of if we need to transform the data

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
	var findNearestProblem = function(data) {

		var nearest = EARTH_R, item = null;

		// Distance between two [lat, long] pairs. Read to risk a headache. 
		function dist(p1, p2) {
			if (!p2.longitude || !p2.latitude) { return EARTH_R }
			var sqrt = Math["sqrt"], s = Math["sin"], c = Math["cos"], atan2 = Math["atan2"];
			var dlat = p2.latitude - p1.latitude, dlon = p2.longitude - p1.longitude;
			var a = (s(dlat/2)) * (s(dlat/2)) + c(p1.latitude) * c(p2.latitude) * (s(dlon/2)) * (s(dlon/2));
			var c = 2 * atan2(sqrt(a), sqrt(1-a));
			return EARTH_R * c;
		}

		// Go through each alert to find the closest. TODO replace DEF with user's.
		for (var i in data) {
			if ((d=dist({longitude: DEFAULT_LOC[0], latitude: DEFAULT_LOC[1]}, data[i])) < nearest) {
				nearest = d;
				item = data[i];
			}
		}

		// Return the nearest point and its distance.
		return { distance: nearest, data: item };

	} // End of findNearestProblem(1)


	/* Get everything running once all data is read (e.g. location is determined). */
	var start = function() {

		// Generate and set up the map base
		var view = new MapView({ 
			container: CONTAINER, 
			map: new Map(MAP_TYPE),
			center: coords, 
			zoom: DEFAULT_ZOOM
		});

		// Check if we have data on the client. TODO: check if it's new-ish.
		var storedData = localStorage.getItem(STORAGE_KEY);

		// If we don't have local data, load it from Stitch.
		if (!storedData) {
			console.log("Fetching data.");
			var req = new XMLHttpRequest();
			req.addEventListener("load", finish)
			req.open("GET", WEATHER_DATA_URL)
			req.send();
			function finish() { render(view, JSON.parse(req.response), true) }
		}

		// If we do have local data, grab it.
		else {
			console.log("Loading cached data.");
			storedData = JSON.parse(storedData);
			var n = findNearestProblem(storedData);
			render(view, storedData, false, DISTANCE_ALERT(n));
		}

	} // End of start()

	// Add geolocation here (again)
	var coords = DEFAULT_LOC;

	start();

}); // End of ArgGIS handler.


// Respond to clear button by clearing local storage.
document.getElementById("clear").addEventListener("click", clear);
function clear() {
    localStorage.removeItem(STORAGE_KEY);
}
