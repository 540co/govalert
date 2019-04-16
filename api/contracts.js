exports = function(payload) {
  
  /*
  Data in:
  - Award ID
  - Dollars obligated
  - Primary place of performance, possibly in multiple formats
  - Awarding agency code
  - Awarding agency name
  
  Data out:
  - Award ID (?)
  - Dollars obligated
  - Primary place of performance, in location format requested or a default
  */
  
  // Preserving the mocked data for testing / dev purposes.
  function getFakeData() {
    
    var unfiltereddata = [
      { "awardIdPiid": "INR14PD00063", "totalDollarsObligated": 53655.69, "awardingAgencyName": "DEPARTMENT OF THE INTERIOR (DOI)", "awardingAgencyCode": "014", "primaryPlaceOfPerformanceZipCode": "89005", "primaryPlaceOfPerformanceUGCCode": "NVC003", "primaryPlaceOfPerformanceState": "NV" },
      { "awardIdPiid": "VA25716P0008", "totalDollarsObligated": 37440.00, "awardingAgencyName": "DEPARTMENT OF VETERANS AFFAIRS (VA)", "awardingAgencyCode": "036", "primaryPlaceOfPerformanceZipCode": "75216", "primaryPlaceOfPerformanceUGCCode": "TXC113", "primaryPlaceOfPerformanceState": "TX" },
      { "awardIdPiid": "SPE3SU19F045F", "totalDollarsObligated": 475.63 , "awardingAgencyName": "DEPARTMENT OF DEFENSE (DOD)", "awardingAgencyCode": "097", "primaryPlaceOfPerformanceZipCode": "30354", "primaryPlaceOfPerformanceUGCCode": "GAC121", "primaryPlaceOfPerformanceState": "GA" }
    ];
    
    // Perform fake filtering simulating what the query would do in mongo.
    var filtereddata = [];
    
    // Include any record that matches all the query parameters.
    for (var i in unfiltereddata) {
      if (agency) { if (unfiltereddata[i].awardingAgencyName != agency) { continue }}
      if (state) { if (unfiltereddata[i].primaryPlaceOfPerformanceState != state) { continue } }
      filtereddata.push(unfiltereddata[i]);
    }
    
    return filtereddata;
    
  } // End of getFakeData()
  
  // Grab contract data from mongo
  function getData(ugc) {
    var filters = {};
    if (ugc) { filters.primaryPlaceOfPerformanceUgc = ugc }
    return context.services.get("540-1").db("govalert").collection("contracts").find({primaryPlaceOfPerformanceUgc: ugc}).toArray();
  }
  
  // Optional parameters for by state, by city, agency, etc.
  var agency = payload.query.agency;
  var state = payload.query.state;
  var ugc = payload.query.ugc;
  
  // If mock param is set, return fake data. Otherwise, return true data.
  var mock = payload.query.mock;
  
  // Mock incoming data -- transformed for output, even as mocked data, to simplify things later.
  var basedata = (mock ? getFakeData() : getData(ugc));
  
  
  // At this point we have the data one way or another.
  // Currently mocked, but eventually from mongodb.
  // The transformation into what gets sent back should be agnostic of source.
  for (var j in basedata) { 
    
    // Filter out any record without a UGC code or where the UGC code's 3rd letter is not 'C'
    basedata = basedata.filter(function(datum) {
      return datum.primaryPlaceOfPerformanceUgc && datum.primaryPlaceOfPerformanceUgc[0] && datum.primaryPlaceOfPerformanceUgc[0].charAt(2) == 'C';
    });
    
    //context.services.get("540-1").db("govalert").collection("locations").findOne({Zipcode: filtereddata[j].primaryPlaceOfPerformanceZipCode})
    //.then(result => filtereddata[j].location = [result.Long, result.Lat])
    
  }
  
  // Build and return the data
  return context.functions.execute("buildResponse", basedata, state, agency);

};
