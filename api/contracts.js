exports = function(payload) {
  
  var start = Date.now();
  
  var statecenter = [];
  statecenter.push({ latitude: 32.806671, longitude: -86.791130, state: "AL" });
  statecenter.push({ latitude: 61.370716, longitude: -152.404419, state: "AK" });
  statecenter.push({ latitude: 33.729759, longitude: -111.431221, state: "AZ" });
  statecenter.push({ latitude: 34.969704, longitude: -92.373123, state: "AR" });
  statecenter.push({ latitude: 36.116203, longitude: -119.681564, state: "CA" });
  statecenter.push({ latitude: 39.059811, longitude: -105.311104, state: "CO" });
  statecenter.push({ latitude: 41.597782, longitude: -72.755371, state: "CT" });
  statecenter.push({ latitude: 39.318523, longitude: -75.507141, state: "DE" });
  statecenter.push({ latitude: 27.766279, longitude: -81.686783, state: "FL" });
  statecenter.push({ latitude: 33.040619, longitude: -83.643074, state: "GA" });
  statecenter.push({ latitude: 21.094318, longitude: -157.498337, state: "HI" });
  statecenter.push({ latitude: 44.240459, longitude: -114.478828, state: "ID" });
  statecenter.push({ latitude: 40.349457, longitude: -88.986137, state: "IL" });
  statecenter.push({ latitude: 39.849426, longitude: -86.258278, state: "IN" });
  statecenter.push({ latitude: 42.011539, longitude: -93.210526, state: "IA" });
  statecenter.push({ latitude: 38.526600, longitude: -96.726486, state: "KS" });
  statecenter.push({ latitude: 37.668140, longitude: -84.670067, state: "KY" });
  statecenter.push({ latitude: 31.169546, longitude: -91.867805, state: "LA" });
  statecenter.push({ latitude: 44.693947, longitude: -69.381927, state: "ME" });
  statecenter.push({ latitude: 39.063946, longitude: -76.802101, state: "MD" });
  statecenter.push({ latitude: 42.230171, longitude: -71.530106, state: "MA" });
  statecenter.push({ latitude: 43.326618, longitude: -84.536095, state: "MI" });
  statecenter.push({ latitude: 45.694454, longitude: -93.900192, state: "MN" });
  statecenter.push({ latitude: 32.741646, longitude: -89.678696, state: "MS" });
  statecenter.push({ latitude: 38.456085, longitude: -92.288368, state: "MO" });
  statecenter.push({ latitude: 46.921925, longitude: -110.454353, state: "MT" });
  statecenter.push({ latitude: 41.125370, longitude: -98.268082, state: "NE" });
  statecenter.push({ latitude: 38.313515, longitude: -117.055374, state: "NV" });
  statecenter.push({ latitude: 43.452492, longitude: -71.563896, state: "NH" });
  statecenter.push({ latitude: 40.298904, longitude: -74.521011, state: "NJ" });
  statecenter.push({ latitude: 34.840515, longitude: -106.248482, state: "NM" });
  statecenter.push({ latitude: 42.165726, longitude: -74.948051, state: "NY" });
  statecenter.push({ latitude: 35.630066, longitude: -79.806419, state: "NC" });
  statecenter.push({ latitude: 47.528912, longitude: -99.784012, state: "ND" });
  statecenter.push({ latitude: 40.388783, longitude: -82.764915, state: "OH" });
  statecenter.push({ latitude: 35.565342, longitude: -96.928917, state: "OK" });
  statecenter.push({ latitude: 44.572021, longitude: -122.070938, state: "OR" });
  statecenter.push({ latitude: 40.590752, longitude: -77.209755, state: "PA" });
  statecenter.push({ latitude: 41.680893, longitude: -71.511780, state: "RI" });
  statecenter.push({ latitude: 33.856892, longitude: -80.945007, state: "SC" });
  statecenter.push({ latitude: 44.299782, longitude: -99.438828, state: "SD" });
  statecenter.push({ latitude: 35.747845, longitude: -86.692345, state: "TN" });
  statecenter.push({ latitude: 31.054487, longitude: -97.563461, state: "TX" });
  statecenter.push({ latitude: 40.150032, longitude: -111.862434, state: "UT" });
  statecenter.push({ latitude: 44.045876, longitude: -72.710686, state: "VT" });
  statecenter.push({ latitude: 37.769337, longitude: -78.169968, state: "VA" });
  statecenter.push({ latitude: 47.400902, longitude: -121.490494, state: "WA" });
  statecenter.push({ latitude: 38.491226, longitude: -80.954453, state: "WV" });
  statecenter.push({ latitude: 44.268543, longitude: -89.616508, state: "WI" });
  statecenter.push({ latitude: 42.755966, longitude: -107.302490, state: "WY" });
  statecenter.push({ latitude: 38.897438, longitude: -77.026817, state: "DC" });
  
  const DEFAULT_LIMIT = 100; // How many records to grab from the DB if not specified.
  const MAX_LIMIT = 50000; // Don't grab more records than this even if the user requests it.
  const SERVICE = "540-1", GOVALERT = "govalert", CONTRACTS = "contracts";
  
  var basedata = null; // This will get set later
  var q = payload.query;
  
  // How many records to *get* -- actual number returned to the caller may differ.
  var limit = (q.limit && q.limit < MAX_LIMIT ? q.limit : DEFAULT_LIMIT);
  
  // Small logging function to help debug.
  var alog = msg => { if (payload.query.logging == 1) { console.log(msg) } };
  
  // Another small logging function for debugging.
  var tlog = msg => console.log(Math.floor((Date.now() - start)) + " ms from start: " + msg);

  // Preserving the ability to get mocked data for testing / dev purposes.
  function getFakeData(zip, county, state, latitude, longitude, ugc) {
    context.functions.execute("getFakeContracts", zip, county, state, latitude, longitude, ugc);
  }
  
  // Find bounds based on maxlat, minlong, minlat, maxlong (in that order below)
  function isBounded(top, left, bottom, right, lat, long) {
    
    alog("Finding [" + long + ", " + lat + "] within [" + top + ", " + left + "], [" + bottom + ", " + right + "].");
    alog("Top >= lat: " + (top >= lat));
    alog("Lat >= bottom: " + (lat >= bottom));
    alog("Left <= right: " + (left <= right) + " Left " + left + " right " + right);
    alog("Left <= long: " + (left <= long));
    alog("Long <= right: " + (long <= right));
    
    if (top >= lat && lat >= bottom && left <= long && long <= right) {
      alog("Found bounded.");
      return true;
    }
    
    return false;
    
  } // End of isBounded(6)
  
  // Filter down the contracts to the ones we want to return.
  function processContracts(contracts) {
    
    var data = contracts.filter(function(datum) { 
      return isBounded(q.maxlat, q.minlong, q.minlat, q.maxlong, Number(datum.primaryPlaceOfPerformanceLat), Number(datum.primaryPlaceOfPerformanceLng)) && 
      datum.primaryPlaceOfPerformanceUgc && datum.primaryPlaceOfPerformanceUgc[0] && datum.primaryPlaceOfPerformanceUgc[0].charAt(2) == 'C';
    });
    
    alog(data);
    basedata = data;
    
  }
  
  // Distance between two [lat, long] pairs. Read to risk a headache. 
  function dist(p1, p2) {
      var lat1 = p1.latitude, lat2 = p2.latitude, lon1 = p1.longitude, lon2 = p2.longitude;
    	if ((lat1 == lat2) && (lon1 == lon2)) {
    		return 0;
    	}
    	else {
    		var radlat1 = Math.PI * lat1/180;
    		var radlat2 = Math.PI * lat2/180;
    		var theta = lon1-lon2;
    		var radtheta = Math.PI * theta/180;
    		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    		if (dist > 1) {
    			dist = 1;
    		}
    		dist = Math.acos(dist);
    		dist = dist * 180/Math.PI;
    		dist = dist * 60 * 1.1515;
    		return dist;
      }
  }
  
  // Handle querying, processing, and returning the data.
  const dodata = new Promise(function(resolve, reject) {
    
    var statesToSearch = [];
    const DISTANCE = 150;
    
    for (var i in statecenter) {
      var s = statecenter[i]; 
      alog("Comparing " + q.minlat + ", " + q.minlong + " to " + s.latitude + " , " + s.longitude);
      var distnw = dist({latitude: q.minlat, longitude: q.minlong}, {latitude: s.latitude, longitude: s.longitude});
      var distne = dist({latitude: q.minlat, longitude: q.maxlong}, {latitude: s.latitude, longitude: s.longitude});
      var distsw = dist({latitude: q.maxlat, longitude: q.minlong}, {latitude: s.latitude, longitude: s.longitude});
      var distse = dist({latitude: q.maxlat, longitude: q.maxlong}, {latitude: s.latitude, longitude: s.longitude});
      alog("Distances are " + distnw + ", " + distne + ", " + distsw + ", " + distse);
      if (distnw < DISTANCE || distne < DISTANCE || distsw < DISTANCE || distse < DISTANCE) {
        alog("Adding " + s.state);
        statesToSearch.push(s.state);
      }
    }
    statesToSearch.push("");
    
    alog("Searching states: ");
    alog(statesToSearch);
    
    // Grab records from the database.
    var search = {primaryPlaceOfPerformanceStateCode: { $in: statesToSearch } };
    if (q.agency) { search["$text"] = {$search: q.agency.toUpperCase() } }
    var cursor = context.services.get(SERVICE).db(GOVALERT).collection(CONTRACTS).find(search).limit(limit)

    cursor.toArray().then(result => processContracts(result)); // toArray() is currently erroring out on result sets any larger than 101 records.
    resolve('fine');
    
  });

  // Start 'er up.
  return dodata
  .then(function whenOk(response) { return basedata })
  .catch(function notOk(err) { console.error(err) });

};
