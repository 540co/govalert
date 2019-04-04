// Define a point marker (currently unused)
const PT_FILL = [200, 200, 200], PT_OUTLINE = [0, 0, 0], PT_OUTLINE_WIDTH = 2;
const PT_SYMBOL = { color: PT_FILL, outline: { color: PT_OUTLINE, width: PT_OUTLINE_WIDTH } }

// Define a polygon marker
const POLY_FILL = [190, 74, 82, 0.8], POLY_OUTLINE = [255, 255, 255], POLY_OUTLINE_WIDTH = 2;
const POLY_SYMBOL = { color: POLY_FILL, outline: { color: POLY_OUTLINE, width: POLY_OUTLINE_WIDTH } }

// Definitions for distance calculations
const MAX_DIST = 12451; // The farthest any point on earth can be from another
const EARTH_R = 3959; // Radius of earth.

// Definitions for setting up the map.
const CONTAINER = "chartdiv"; //What element holds the map
const MAP_TYPE = {basemap: "topo-vector"}; // What map type to use
const DEFAULT_LOC = [-77.037, 38.898]; // Location to show on load (near White House)
const DEFAULT_ZOOM = 11; // How far to zoom in on load
const SHADOW = "chartshadow"; // Message container
const MSG_TIME = 2000; // How long to show a message.
const MSG_TIME2 = 3000; // How fast to hide a message.

// Routes to hit for data
const WEATHER_DATA_URL = "https://us-east-1.aws.webhooks.mongodb-stitch.com/api/client/v2.0/app/540-1-vvypp/service/get_weather_alerts/incoming_webhook/get-webhook";

// Messages
const DISTANCE_ALERT = n => `Closest alert is about ${Math.floor(n.distance)} miles away.`;

