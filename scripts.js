require ([
	"esri/Map", "esri/views/MapView", 
	"esri/Graphic", "esri/geometry/Point", 
	"esri/symbols/SimpleMarkerSymbol",
	"esri/request"
], function(Map, MapView, Graphic, Point, SimpleMarkerSymbol, esriRequest) {

	var point = function(longitude, latitude) {
		return new Graphic({
			geometry: new Point({ longitude: longitude, latitude: latitude }),
			symbol: new SimpleMarkerSymbol({ color: [200,200,200], outline: { color: [0,0,0], width: 2 } })
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
			data[i].latitude = lat;
			data[i].longitude = lon;
		}
		for (var j in data) {
			if (data[j].longitude && data[j].latitude) {
				view.graphics.add(point(data[j].longitude, data[j].latitude));
			}
		}
	}
	
	var req = new XMLHttpRequest();
	req.addEventListener("load", finish)
	req.open("GET", "https://us-east-1.aws.webhooks.mongodb-stitch.com/api/client/v2.0/app/540-1-vvypp/service/get_weather_alerts/incoming_webhook/get-webhook")
	req.send();
	function finish() { render(view, JSON.parse(req.response)) }
	
});
