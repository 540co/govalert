require ([
	"esri/Map", "esri/views/MapView", 
	"esri/Graphic", "esri/geometry/Point", 
	"esri/symbols/SimpleMarkerSymbol",
	"esri/request",
	"esri/geometry/Polygon",
	"esri/symbols/SimpleFillSymbol"
], function(Map, MapView, Graphic, Point, SimpleMarkerSymbol, esriRequest, Polygon, SimpleFillSymbol) {

	var point = function(longitude, latitude) {
		return new Graphic({
			geometry: new Point({ longitude: longitude, latitude: latitude }),
			symbol: new SimpleMarkerSymbol({ color: [200,200,200], outline: { color: [0,0,0], width: 2 } })
		});
	}

	var polygon = function(coordinates) {
		return new Graphic({
			geometry: new Polygon({ rings: coordinates }),
			symbol: new SimpleFillSymbol({ 
				color: [227,139,79,0.8], 
				outline: { color: [255,255,255], width: 1 }
			})
		});
	}

	var map = new Map({basemap: "topo-vector"});

	var view = new MapView({
		container: "chartdiv",
		map: map,
		center: [-90.430000000000007, 38.509999999999998],
		zoom: 11
	});

	var render = function(view, data) {
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
		for (var j in data) {
			if (data[j].longitude && data[j].latitude) {
				view.graphics.add(point(data[j].longitude, data[j].latitude));
				view.graphics.add(polygon(data[j].polygon));
			}
		}
	}
	
	var req = new XMLHttpRequest();
	req.addEventListener("load", finish)
	req.open("GET", "https://us-east-1.aws.webhooks.mongodb-stitch.com/api/client/v2.0/app/540-1-vvypp/service/get_weather_alerts/incoming_webhook/get-webhook")
	req.send();
	function finish() { render(view, JSON.parse(req.response)) }
	
});
