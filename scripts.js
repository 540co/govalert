var imageSeries, polygonSeries, chart, storedData = null;

// Display the map with its data.
function show() {
	
	// Let the map be animated
	am4core.useTheme(am4themes_animated);

	// Create map instance
	chart = am4core.create("chartdiv", am4maps.MapChart);

	// Set map definition
	chart.geodata = am4geodata_region_usa_maLow;

	// Set projection
	chart.projection = new am4maps.projections.Mercator();

	chart.svgContainer.htmlElement.style.width = "100%";
	chart.svgContainer.htmlElement.style.height = "500px";

	var states = [
		am4geodata_region_usa_ctLow,
		am4geodata_region_usa_vtLow,
		am4geodata_region_usa_nyLow,
		am4geodata_region_usa_riLow,
		am4geodata_region_usa_njLow,
		am4geodata_region_usa_nhLow,
		am4geodata_region_usa_meLow,
		am4geodata_region_usa_paLow
	];

	var state_fills = [
		"#367B25",
		"#CC0000",
		"#00CC00",
		"#0000CC",
		"#880088",
		"#5C5CFF",
		"#F05C5C",
		"#30358C"
	]

	// Create map polygon series, overlaying several maps to display different states.
	polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
	polygonSeries.useGeodata = true;
	
	// Configure series
	var polygonTemplate = polygonSeries.mapPolygons.template;
	polygonTemplate.strokeOpacity = 0.5;
	polygonTemplate.nonScalingStroke = true;

	for (var i in states) {
		
		// Create a new map piece for each state
		var a = chart.series.push(new am4maps.MapPolygonSeries());
	
		// Set the map data for each state
		a.geodata = states[i];
		
		// Make map load polygon (like country names) data from GeoJSON
		a.useGeodata = true;
		
		// Configure the series for the state
		var aTemplate = a.mapPolygons.template;
		aTemplate.strokeOpacity = 0.5
		aTemplate.nonScalingStroke = true;
	
		aTemplate.fill = state_fills[i]

	}
	
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
	imageSeriesTemplate.strokeWidth = 2;

	// If we don't have cached data, load it and save it.
	if (!storedData) {
	
		imageSeries.dataSource.url = "https://us-east-1.aws.webhooks.mongodb-stitch.com/api/client/v2.0/app/540-1-vvypp/service/get/incoming_webhook/get-webhook?amt=1000";

		// Transform the data as it is loaded.
		imageSeries.dataSource.events.on("parseended", function(ev) {
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

		// Save the data when loading and parsing are complete.
		imageSeries.dataSource.events.on("done", function(ev) {
			console.log("Saving data: ");
			console.log(imageSeries.data);
			localStorage.setItem("mongo-city-data", JSON.stringify(imageSeries.data));
		});

	}

	// If we do have cached data, use it.
	else {
		storedData = JSON.parse(storedData);
		console.log("Pulling stored data: ");
		console.log(storedData);
		imageSeries.data = storedData;
	}


} // End of show()


// When document loads, show loading message, get data, and initialize.
document.getElementById("chartdiv").innerHTML = "<p class='message'>Loading</p>"
storedData = localStorage.getItem("mongo-city-data");
show()

// Respond to search button by finding zips for that city.
document.getElementById("search").addEventListener("click", search);
function search() {
	for (var i in imageSeries.data) {
		if (imageSeries.data[i].name == document.getElementById("city").value.toUpperCase()) {
			imageSeries.data[i]["fill"] = "#AA0000";
			imageSeries.invalidateData();
		}
	}
}

// Respond to clear button by clearing local storage.
document.getElementById("clear").addEventListener("click", clear);
function clear() {
	localStorage.removeItem("mongo-city-data");
}
