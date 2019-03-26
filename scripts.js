var imageSeries, polygonSeries, chart, storedData = null;

function show() {
	
	// Let the map be animated
	am4core.useTheme(am4themes_animated);

	// Create map instance
	chart = am4core.create("chartdiv", am4maps.MapChart);

	// Set map definition
	chart.geodata = am4geodata_region_usa_maLow;

	// Set projection
	chart.projection = new am4maps.projections.Mercator();
	

	// Create map polygon series
	polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());


	var ctSeries = chart.series.push(new am4maps.MapPolygonSeries());
	var vtSeries = chart.series.push(new am4maps.MapPolygonSeries());
	var nySeries = chart.series.push(new am4maps.MapPolygonSeries());
	var riSeries = chart.series.push(new am4maps.MapPolygonSeries());
	var njSeries = chart.series.push(new am4maps.MapPolygonSeries());
	var nhSeries = chart.series.push(new am4maps.MapPolygonSeries());
	var meSeries = chart.series.push(new am4maps.MapPolygonSeries());

	ctSeries.geodata = am4geodata_region_usa_ctLow;
	vtSeries.geodata = am4geodata_region_usa_vtLow;
	nySeries.geodata = am4geodata_region_usa_nyLow;
	riSeries.geodata = am4geodata_region_usa_riLow;
	njSeries.geodata = am4geodata_region_usa_njLow;
	nhSeries.geodata = am4geodata_region_usa_nhLow;
	meSeries.geodata = am4geodata_region_usa_meLow;

	// Make map load polygon (like country names) data from GeoJSON
	polygonSeries.useGeodata = true;

	// Configure series
	var polygonTemplate = polygonSeries.mapPolygons.template;
	polygonTemplate.strokeOpacity = 0.5;
	polygonTemplate.nonScalingStroke = true;
	
	// The image series is where we store the markers for the locations
	imageSeries = chart.series.push(new am4maps.MapImageSeries());

	// The template for the image series describes the prototypical marker to use
	var imageSeriesTemplate = imageSeries.mapImages.template;

	// Then create a custom object off of the template to visualize the marker
	var circle = imageSeriesTemplate.createChild(am4core.Sprite);
	
	// Color sets are named colors defined for particular purposes. Alternative BG is #000
	circle.fill = new am4core.InterfaceColorSet().getFor("alternativeBackground");
	circle.propertyFields.fill = "fill";
	var targetSVG = "M2 4 Q 5 0, 8 4Q 5 8, 2 4Z"
	circle.path = targetSVG;

	// set propertyfields
	imageSeriesTemplate.propertyFields.latitude = "latitude";
	imageSeriesTemplate.propertyFields.longitude = "longitude";

	imageSeriesTemplate.horizontalCenter = "middle";
	imageSeriesTemplate.verticalCenter = "middle";
	imageSeriesTemplate.align = "center";
	imageSeriesTemplate.valign = "middle";
	imageSeriesTemplate.width = 8;
	imageSeriesTemplate.height = 8;
	imageSeriesTemplate.nonScaling = true;
	imageSeriesTemplate.tooltipText = "{zip}";
	imageSeriesTemplate.fill = am4core.color("#000");
	imageSeriesTemplate.fillOpacity = 0.5;
	imageSeriesTemplate.background.fillOpacity = 0;
	imageSeriesTemplate.background.fill = am4core.color("#ffffff");
	imageSeriesTemplate.setStateOnChildren = true;
	imageSeriesTemplate.states.create("hover");


	if (!storedData) {
	
		imageSeries.dataSource.url = "https://us-east-1.aws.webhooks.mongodb-stitch.com/api/client/v2.0/app/540-1-vvypp/service/get/incoming_webhook/get-webhook?amt=1000";

		imageSeries.dataSource.events.on("parseended", function(ev) {
			//parsed data is assigned to data source's `data` property
			var data = ev.target.data;
			for (var i in data) { 
				data[i] = {
					"latitude": Number(data[i].loc[1]["$numberDouble"]), 
					"longitude": Number(data[i].loc[0]["$numberDouble"]),
					"name": data[i].city,
					"zip": data[i]._id
				}
			}
		});

		imageSeries.dataSource.events.on("done", function(ev) {
			console.log("Saving data: ");
			console.log(imageSeries.data);
			localStorage.setItem("mongo-city-data", JSON.stringify(imageSeries.data));
		});

	}
	else {
		console.log("Pulling stored data: ");
		storedData = JSON.parse(storedData);
		console.log("("+storedData.length + " items)")
		console.log(storedData);
		imageSeries.data = storedData;
	}


	//imageSeries.data = locations;

//imageSeries.data[5]["fill"] = am4core.color("#5C5CFF")
	//document.getElementById("output").innerHTML = JSON.stringify(locations);
}

document.getElementById("chartdiv").innerHTML = "<p class='message'>Loading</p>"
/*var req = new XMLHttpRequest();
req.addEventListener("load", show);
req.open("GET", "https://us-east-1.aws.webhooks.mongodb-stitch.com/api/client/v2.0/app/540-1-vvypp/service/get/incoming_webhook/get-webhook?amt=1000");
req.send();
*/
storedData = localStorage.getItem("mongo-city-data");
show()
document.getElementById("search").addEventListener("click", search);

function search() {
	for (var i in imageSeries.data) {
		if (imageSeries.data[i].name == document.getElementById("city").value.toUpperCase()) {
			imageSeries.data[i]["fill"] = "#AA0000";//am4core.color("#AA0000");
			imageSeries.invalidateData();
		}
	}
}

document.getElementById("clear").addEventListener("click", clear);
function clear() {
	localStorage.removeItem("mongo-city-data");
}
