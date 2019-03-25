var imageSeries, polygonSeries, chart = null;

function show() {
	var content = JSON.parse(this.responseText);
	var locations = []
	for (var i in content) {
		locations.push({
			"latitude": Number(content[i].loc[1]["$numberDouble"]), 
			"longitude": Number(content[i].loc[0]["$numberDouble"]),
			"name": content[i].city
		})
	}

	var targetSVG = "M9,0C4.029,0,0,4.029,0,9s4.029,9,9,9s9-4.029,9-9S13.971,0,9,0z M9,15.93 c-3.83,0-6.93-3.1-6.93-6.93S5.17,2.07,9,2.07s6.93,3.1,6.93,6.93S12.83,15.93,9,15.93 M12.5,9c0,1.933-1.567,3.5-3.5,3.5S5.5,10.933,5.5,9S7.067,5.5,9,5.5 S12.5,7.067,12.5,9z";


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

	// Exclude Antartica
	//polygonSeries.exclude = ["AQ"];

	//polygonSeries.include = ["US"]

	// Make map load polygon (like country names) data from GeoJSON
	polygonSeries.useGeodata = true;

	// Configure series
	var polygonTemplate = polygonSeries.mapPolygons.template;
	polygonTemplate.strokeOpacity = 0.5;
	polygonTemplate.nonScalingStroke = true;
	
	// create capital markers
	imageSeries = chart.series.push(new am4maps.MapImageSeries());

	// define template
	var imageSeriesTemplate = imageSeries.mapImages.template;
	var circle = imageSeriesTemplate.createChild(am4core.Sprite);
	circle.scale = 0.4;
	circle.fill = new am4core.InterfaceColorSet().getFor("alternativeBackground");
	circle.propertyFields.fill = "fill";
	circle.path = targetSVG;
	// what about scale...

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
	imageSeriesTemplate.tooltipText = "{title}";
	imageSeriesTemplate.fill = am4core.color("#000");
	imageSeriesTemplate.background.fillOpacity = 0;
	imageSeriesTemplate.background.fill = am4core.color("#ffffff");
	imageSeriesTemplate.setStateOnChildren = true;
	imageSeriesTemplate.states.create("hover");

	imageSeries.data = locations;


	//imageSeries.data[5]["fill"] = am4core.color("#5C5CFF")
	//document.getElementById("output").innerHTML = JSON.stringify(locations);
}

var req = new XMLHttpRequest();
req.addEventListener("load", show);
req.open("GET", "https://us-east-1.aws.webhooks.mongodb-stitch.com/api/client/v2.0/app/540-1-vvypp/service/get/incoming_webhook/get-webhook");
req.send();

document.getElementById("search").addEventListener("click", search);

function search() {
	for (var i in imageSeries.data) {
		if (imageSeries.data[i].name == document.getElementById("city").value.toUpperCase()) {
			imageSeries.data[i]["fill"] = am4core.color("#AA0000");
			imageSeries.invalidateData();
		}
	}
	imageSeries.data[5]["fill"] = am4core.color("#AA0000")
}
