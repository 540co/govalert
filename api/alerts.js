// The engineer in me says "cache this." The pragmatist in me says "caching doesn't win prizes."
exports = function(payload) {

    const http = context.services.get("weather");
    
    // Check that a particular data point is ok to include
    var itemok = item => item.geometry && item.geometry.coordinates && item.geometry.coordinates[0].length > 0;
    
    // Given a set of weather alerts, process and return the modified set.
    function process(content) {
      
      return content.features.filter(item => itemok(item)).map(function(item) {
        
        var props = item.properties;
        
        return {
          latitude: item.geometry.coordinates[0][0][1], // Replace with: calculate center of geo and get rough radius via all coords
          longitude: item.geometry.coordinates[0][0][0],
          polygon: item.geometry.coordinates[0],
          start_date: props.effective,
          end_date: props.ends,
          event_type: props.event,
          headline: props.headline,
          description: props.description,
          instruction: props.instruction,
          city: props.areaDesc.split(',')[0].toUpperCase(),
          geocode: props.geocode.UGC
        }
        
      }) // End of filtering and mapping
      
    } // End of process(1)
    
    // Load all active alerts
    return http.get({url: "https://api.weather.gov/alerts/active" }).then(result => process(EJSON.parse(result.body.text())));

};
