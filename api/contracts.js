exports = function(payload) {
  
  const DEFAULT_LIMIT = 300; // # of records to grab from the DB if not specified.
  const STEP = 100;
  const MAX_LIMIT = 50000; // Max records even if the user requests more.
  
  // Context of the contracts query.
  const SERVICE = "540-1", GOVALERT = "govalert", CONTRACTS = "contracts";
  
  var start = Date.now(); // For time comparisons, for debugging.
  var basedata = []; // This will get set later
  var q = payload.query; // For simplicity.
  var curStartId = BSON.MinKey();
  
  // Small logging functions to help debug.
  var alog = msg => { if (q.logging == 1) { console.log(msg) } };
  var tlog = msg => console.log(Math.floor((Date.now() - start)) + " ms from start: " + msg);
  
  // Get the rough lat/long center of each state, to use for distance calculations.
  var statecenter = context.functions.execute("getStateCenters");
  
  // How many records to *get* -- actual number returned to the caller may differ.
  var limit = (q.limit && q.limit < MAX_LIMIT ? q.limit : DEFAULT_LIMIT);
  
  // Find bounds based on maxlat, minlong, minlat, maxlong (in that order below)
  function isBounded(top, left, bottom, right, lat, long) {
    
    alog("Finding [" + long + ", " + lat + "] within [" + top + ", " + left + "], [" + bottom + ", " + right + "].");
    
    if (top >= lat && lat >= bottom && left <= long && long <= right) {
      alog("Found bounded.");
      return true;
    }
    
    return false;
    
  } // End of isBounded(6)
  
  // Filter down the contracts to the ones we want to return.
  function processContracts(contracts) {
    
    var data = contracts.filter(d => {
      let ugc = d.primaryPlaceOfPerformanceUgc;
      return isBounded(q.maxlat, q.minlong, q.minlat, q.maxlong, Number(d.primaryPlaceOfPerformanceLat), Number(d.primaryPlaceOfPerformanceLng)) && 
      ugc && ugc[0] && ugc[0].charAt(2) == 'C';
    });
    
    //data = contracts.sort((a, b) => { return Number(a.totalDollarsObligated) - Number(b.totalDollarsObligated) });
    
    if (contracts.length > 0) { curStartId = contracts[contracts.length-1]._id }
    
    alog(data);
    basedata = basedata.concat(data);
    
  } // End of processContracts(1)
  
  // Distance between two [lat, long] pairs. Read to risk a headache. 
  function dist(p1, p2) {
      var lat1 = p1.latitude, lat2 = p2.latitude, lon1 = p1.longitude, lon2 = p2.longitude;
    	if ((lat1 == lat2) && (lon1 == lon2)) { return 0 }
    	else {
    		var radlat1 = Math.PI * lat1/180;
    		var radlat2 = Math.PI * lat2/180;
    		var theta = lon1-lon2;
    		var radtheta = Math.PI * theta/180;
    		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    		if (dist > 1) { dist = 1 }
    		dist = Math.acos(dist);
    		dist = dist * 180/Math.PI;
    		dist = dist * 60 * 1.1515;
    		return dist;
      }
  } // End of dist(2)
  
  // Handle querying, processing, and returning the data.
  const dodata = new Promise(function(resolve, reject) {
    
    var statesToSearch = [];
    const DISTANCE = 400;
    
    for (var i in statecenter) {
      var s = statecenter[i]; 
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
    
    var cursor = null;
    
    for (var curRecs = 0; curRecs < limit; curRecs += 100) {
      search._id = { $gt: curStartId };
      cursor = context.services.get(SERVICE).db(GOVALERT).collection(CONTRACTS).find(search).limit(STEP);
      cursor.toArray().then(result => processContracts(result)); // toArray() is currently erroring out on result sets any larger than 101 records.
    }
    
    resolve('fine');
    
  });

  // Start 'er up.
  return dodata
  .then(function whenOk(response) { return basedata })
  .catch(function notOk(err) { console.error(err) });

};
