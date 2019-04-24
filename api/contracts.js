exports = function(payload) {
  
  const DEFAULT_LIMIT = 500; // How many records to grab from the DB if not specified.
  const MAX_LIMIT = 50000; // Don't grab more records than this even if the user requests it.
  const SERVICE = "540-1", GOVALERT = "govalert", CONTRACTS = "contracts";
  
  var basedata = null; // This will get set later
  var q = payload.query;
  
  // How many records to *get* -- actual number returned to the caller may differ.
  var limit = (q.limit && q.limit < MAX_LIMIT ? q.limit : DEFAULT_LIMIT);
  
  // Small logging function to help debug.
  var alog = msg => { if (payload.query.logging == 1) { console.log(msg) } };
  
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
  
  // Handle querying, processing, and returning the data.
  const dodata = new Promise(function(resolve, reject) {
    
    // Grab records from the database.
    context.services.get(SERVICE).db(GOVALERT).collection(CONTRACTS).find({}).limit(limit).toArray().then(result => processContracts(result));
    resolve('fine');
    
  });

  // Start 'er up.
  return dodata
  .then(function whenOk(response) { return basedata })
  .catch(function notOk(err) { console.error(err) });

};
