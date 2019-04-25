// Transform a datum to make it usable on the map. TODO consider having the BE do this.
var transform = function (item) {

	var new_item = {};

	var year_st = item.start_date.substring(0,4);
	var month_st = item.start_date.substring(5,7);
	var day_st = item.start_date.substring(8,10);
	var year_end = item.start_date.substring(0,4);
	var month_end = item.start_date.substring(5,7);
	var day_end = item.start_date.substring(8,10);

	new_item.start = [day_st, month_st, year_st];
	new_item.end = [day_end, month_end, year_end];
	new_item.event = item.event_type;
	new_item.headline = item.headline;
	new_item.instruction = item.instruction;
	new_item.city = item.city;
	new_item.state = item.state;

	return new_item

} // End of transform(1)

function renderList(json) { 
	
	var items = json.map(item => transform(item));
	var list = document.createElement("ul");
	
	list.classList.add("main-list");

	for (var i in items) {
	
		var mainitem = document.createElement("li");
		var sublist = document.createElement("ul");
		
		sublist.classList.add("sub-list");

		var n = items[i], s = n.start, e = n.end;
		
		var litem = document.createElement("li");
		litem.appendChild(document.createTextNode(s[0]+"/"+s[1]+"/"+s[2]+" - "+e[0]+"/"+e[1]+"/"+e[2]));
		sublist.appendChild(litem);
		
		litem = document.createElement("li");
		litem.appendChild(document.createTextNode(n.city + ", " + n.state));
		sublist.appendChild(litem);
		
		litem = document.createElement("li");
		litem.appendChild(document.createTextNode(n.headline));
		sublist.appendChild(litem);

		mainitem.appendChild(sublist);
		list.appendChild(mainitem);

	}

	document.getElementById(LIST).appendChild(list);

} // End of renderList(1)

var req = new XMLHttpRequest();
req.addEventListener("load", finish);
req.open("GET", WEATHER_DATA_URL);
req.send();
function finish() {
	renderList(JSON.parse(req.response));
	document.getElementById(LIST_BUTTON).addEventListener("click", function() {
		document.getElementById(LIST).parentElement.classList.toggle("active");
		document.getElementById(LIST_BUTTON).classList.toggle("active");
	});
}
