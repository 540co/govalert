exports = function(payload) {
  
  // Preserving the ability to get mocked data for testing / dev purposes.
  function getFakeData(zip, county, state, latitude, longitude, ugc) {
    
    // A few records to use
    var unfiltereddata = [
      {"_id":"5cb419cd20d3833856eedbbf","awardIdPiid":"123J1419C0579","parentAwardAgencyName":"","federalActionObligation":"589824.00","totalDollarsObligated":"589824.00","baseAndExercisedOptionsValue":"589824.00","currentTotalValueOfAward":"589824.00","actionDate":"2018-12-19","periodOfPerformanceStartDate":"2018-12-19 00:00:00","periodOfPerformanceCurrentEndDate":"2019-02-28 00:00:00","awardingAgencyCode":"012","awardingAgencyName":"DEPARTMENT OF AGRICULTURE (USDA)","awardingOfficeCode":"123J14","awardingOfficeName":"USDA  AMS  3J14","primaryPlaceOfPerformanceZip":"51334","primaryPlaceOfPerformanceCountyName":"EMMET","primaryPlaceOfPerformanceStateCode":"IA","primaryPlaceOfPerformanceLat":"43.404109","primaryPlaceOfPerformanceLng":" -94.805056","primaryPlaceOfPerformanceUgc":["IAC063"],"awardType":"DEFINITIVE CONTRACT","lastModifiedDate":"2018-12-26 14:16:13","recipient":{"name":"SONSTEGARD FOODS COMPANY","duns":"154549059","cageCode":"3Q8V8"}},
      {"_id":"5cb4194220d3833856ece7be","awardIdPiid":"12RADZ19P0201","parentAwardAgencyName":"","federalActionObligation":"612.50","totalDollarsObligated":"612.50","baseAndExercisedOptionsValue":"612.50","currentTotalValueOfAward":"612.50","actionDate":"2019-03-11","periodOfPerformanceStartDate":"2019-03-11 00:00:00","periodOfPerformanceCurrentEndDate":"2019-04-11 00:00:00","awardingAgencyCode":"012","awardingAgencyName":"DEPARTMENT OF AGRICULTURE (USDA)","awardingOfficeCode":"12RADZ","awardingOfficeName":"USDA/RD/REGIONAL ACQ DIVISION","primaryPlaceOfPerformanceZip":"61356","primaryPlaceOfPerformanceCountyName":"BUREAU","primaryPlaceOfPerformanceStateCode":"IL","primaryPlaceOfPerformanceLat":"41.396035","primaryPlaceOfPerformanceLng":" -89.413241","primaryPlaceOfPerformanceUgc":["ILC011"],"awardType":"PURCHASE ORDER","lastModifiedDate":"2019-03-11 10:13:50","recipient":{"name":"'B. F. SHAW PRINTING COMPANY, THE'","duns":"089641989","cageCode":"3QFA8"}},
      {"_id":"5cb4194220d3833856ece7ca","awardIdPiid":"80NM0018F0616","parentAwardAgencyName":"NATIONAL AERONAUTICS AND SPACE ADMINISTRATION","federalActionObligation":"500000.00","totalDollarsObligated":"247082102.82","baseAndExercisedOptionsValue":"0.00","currentTotalValueOfAward":"670513066.78","actionDate":"2019-03-11","periodOfPerformanceStartDate":"2019-03-11 00:00:00","periodOfPerformanceCurrentEndDate":"2020-09-27 00:00:00","awardingAgencyCode":"080","awardingAgencyName":"NATIONAL AERONAUTICS AND SPACE ADMINISTRATION (NASA)","awardingOfficeCode":"80NM00","awardingOfficeName":"NASA MANAGEMENT OFFICE -- JPL","primaryPlaceOfPerformanceZip":"91109","primaryPlaceOfPerformanceCountyName":"LOS ANGELES","primaryPlaceOfPerformanceStateCode":"CA","primaryPlaceOfPerformanceLat":null,"primaryPlaceOfPerformanceLng":null,"primaryPlaceOfPerformanceUgc":["CAC037"],"awardType":"DELIVERY ORDER","lastModifiedDate":"2019-03-11 13:49:35","recipient":{"name":"CALIFORNIA INSTITUTE OF TECHNOLOGY","duns":"009584210","cageCode":"80707"}}
    ];
    
    // The fields by which one may filter
    var fields = [[zip, "Zip"], [county, "CountyName"], [state, "StateCode"], [latitude, "Lat"], [longitude, "Lng"], [ugc, "Ugc"]];
    
    // Perform fake filtering simulating what the query would do in mongo.
    // Include any record that matches all the query parameters.
    return unfiltereddata.filter(function(datum) {
      for (var f in fields) { if (fields[f][0]) { if (datum["primaryPlaceOfPerformance" + fields[f][1]] == fields[f][0]) { return true } } }
    });
    
  } // End of getFakeData()
  
  // Grab contract data from mongo
  function getData(zip, county, state, latitude, longitude, ugc, mock) {
    if (mock) { return getFakeData(zip, county, state, latitude, longitude, ugc) }
    var filters = {};
    if (ugc) { filters.primaryPlaceOfPerformanceUgc = ugc }
    return context.services.get("540-1").db("govalert").collection("contracts").find(filters).toArray();
  }
  
  // You shouldn't need the function below.
  
  // maxlat, minlong, minlat, maxlong
  function isBounded(top, left, bottom, right, lat, long) {
    console.log("Finding [" + long + ", " + lat + "] within [" + top + ", " + left + "], [" + bottom + ", " + right + "].")
    console.log("Top >= lat: " + (top >= lat));
    console.log("Lat >= bottom: " + (lat >= bottom));
    console.log("Left <= right: " + (left <= right) + " Left " + left + " right " + right);
    console.log("Left <= long: " + (left <= long));
    console.log("Long <= right: " + (long <= right));
    if (top >= lat && lat >= bottom) {
      if (left <= long && long <= right) {
        console.log("Found bounded.")
        return true;
      }
      /*else if (left > right && (left <= long || long <= right)) {
            //console.log("Found bounded.")
        return true;
      }*/
    }
    return false;
  }
  
  function getBoundedData(minlat, minlong, maxlat, maxlong) {
    /*var filters = { 
      primaryPlaceOfPerformancePoint: {
        $geoWithin: { 
          $geometry: { 
            type: "Polygon", 
            coordinates: [[ 
              [minlong, minlat], 
              [maxlong, minlat], 
              [maxlong, maxlat], 
              [minlong, maxlat], 
              [minlong, minlat] 
            ]] 
          } 
        }
      }
    };*/
    var filters = {};
 
    context.services.get("540-1").db("govalert").collection("contracts").find({}).limit(100).toArray().then(result => {
      var data = result.filter(function(datum) { return isBounded(maxlat, minlong, minlat, maxlong, Number(datum.primaryPlaceOfPerformanceLat), Number(datum.primaryPlaceOfPerformanceLng)) });
      /*data = data.filter(function(datum) {
        return datum.primaryPlaceOfPerformanceUgc && datum.primaryPlaceOfPerformanceUgc[0] && datum.primaryPlaceOfPerformanceUgc[0].charAt(2) == 'C';
      });*/
      //console.log(data[0].primaryPlaceOfPerformanceCountyName)
      basedata = data;
    });

  }
  
  var basedata = null;
  var q = payload.query; 
  
  if (q.minlat && q.minlong && q.maxlat && q.maxlong) {
    //getBoundedData(q.minlat, q.minlong, q.maxlat, q.maxlong);
    
  }
  else {
    // If mock param is set, return fake data. Otherwise, return true data.
    basedata = getData(q.zip, q.county, q.state, q.latitude, q.longitude, q.ugc, q.mock);
    return filter(function(datum) {
      return datum.primaryPlaceOfPerformanceUgc && datum.primaryPlaceOfPerformanceUgc[0] && datum.primaryPlaceOfPerformanceUgc[0].charAt(2) == 'C';
    });
  }
  
  const dodata = new Promise(function(resolve, reject) {
  
    context.services.get("540-1").db("govalert").collection("contracts").find({}).limit(100).toArray().then(result => {
      var data = result.filter(function(datum) { return isBounded(q.maxlat, q.minlong, q.minlat, q.maxlong, Number(datum.primaryPlaceOfPerformanceLat), Number(datum.primaryPlaceOfPerformanceLng)) });
      console.log(data);
      basedata = data;
    });
  
    resolve('fine')
});

  return dodata.then(function whenOk(response) {
    console.log("At this point: " + basedata[0].primaryPlaceOfPerformanceLng)
    return basedata;
  })
  .catch(function notOk(err) {
    console.error(err)
  });
  
  // Build and return the data
 // return context.functions.execute("buildResponse", basedata, q.zip, q.county, q.state, q.latitude, q.longitude, q.ugc);

};
