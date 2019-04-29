# GovAlert
_\<some description should go here\>_

## Key Technologies:
- **Mongo Atlas** to store stable data, such as contracting office locations.
- **Mongo Stitch** to act as a back-end, tie the data together, and provide both hosting and an API for the client.
- **ArcGIS** to generate an interactive map overlayed with meaningful, interpreted data.
- **Mongo Compass** to aid in development -- while not strictly part of the solution, compass aids in understanding the data as it is ingested and processed.

### Atlas
Mongo's cloud store provides the core of this data-driven application. The `contracts` collection holds a recent ingested copy of government contract data. This data has been parsed and interpreted from `GovSpend` records and stored for ease of access -- the size and verbosity of the original data set prohibits live pulls, which would in any case be extraneous for data that changes only ocassionally. When necessary, the ingestion script may be re-run to refresh the data in the system.

### Stitch
A key goal of this application is to stand up lightweight APIs to act as passthroughs for the data, providing translation and context along the way, and reducing the load on the front-end client. Mongo Stitch fit that niche and made it simple to stand up endpoints to access our data and reference external APIs, such as the **National Weather Service API**, which provide up-to-date weaher alerts at any given moment. Leveraging these APIs made it simple to contextualize the potential impact of weather fronts on government contracts as they occur.

### ArcGIS
[ArcGIS](https://developers.arcgis.com/) provides a complete mapping platform, easy to use and with plenty of power. Of all mapping options available, it best fit the need to perform custom data visualization and provide the user with a familiar style of map, without feature bloat.

ArcGIS provides an API to control the map and its related data via javascript -- we opted for vanilla JS to limit overhead. You can learn about how to use ArcGIS in javascript via [their handy tutorials](https://developers.arcgis.com/labs/?product=JavaScript&topic=any).

#### ArcGIS libraries used by this project:
- `esri/Map`: A map object.
- `esri/views/MapView`: The view on which graphics are drawn.
- `esri/Graphic`: Conceptual graphics object.
- `esri/geometry/Point`: Definition of a geometric point.
- `esri/symbols/SimpleMarkerSymbol`: Visual marker indicator.
- `esri/request`: Allows ArcGIS to make its own external calls for resources.
- `esri/geometry/Polygon`: Definition of a geometric polygon. 
- `esri/symbols/SimpleFillSymbol`: Represents a fillable graphics object.
- `esri/core/watchUtils`: Respond in real-time to map events.
- `esri/geometry/support/webMercatorUtils`: Support Mercator computations.
- `esri/widgets/search`: Feature for location search on the map.

Any ArcGIS library can simply be listed in the require, and it will be automatically pulled in by the main ArcGIS script.

## APIs

All our constructed APIs operate off the same base URL as generated via stitch: `"https://us-east-1.aws.webhooks.mongodb-stitch.com/api/client/v2.0/app/540-1-vvypp/service`.

### /contracts
_Search for government contracts within a boundary of latitude and longitude._

The `/contracts` webhook exposes a means to find contracts based on location, and by goverment agency. In the context of this application, the call will receive the bounds of the map as it is currently being viewed by the user, and use this data to return a set of data to fit that view, reducing the load of data passed to the client.

To make a query against some location, call the `/contracts` endpoint with the following query parameters: `minlat`, `minlong`, `maxlat`, `maxlong`. 

You can also include the `agency` parameter to filter by fuzzy text search against the related goverment agency to which the contract relates. 

The `limit` parameter allows a manual limit to be set on how many records will maximally be returned by the query -- this is the limit on the records returned by the `database`, and may be further pared down by data processing before being returned to the client. If no limit is set, the default is used. The record limit is capped to avoid problematically long wait times, so if an extremely high number is provided, the call may return fewer records than expected.

Lastly, setting the `logging` parameter to `1` will cause the stitch service to log certain key pieces of information to the stitch console, which may help in debugging.

Example:
A call to `<base-url>/contracts/incoming_webhook/contracts?minlong=-92.25024146963212&minlat=37.081096253901&maxlong=-74.03490943838696&maxlat=42.1549069163147` would return something like the following:
```
...
"data":[
  {
    "_id: {"$oid":"5cb419cd20d3833856eedbbf"},
    ...
    "primaryPlaceOfPerformanceUgc":["IAC063"],
    "awardType":"DEFINITIVE CONTRACT",
    "lastModifiedDate":"2018-12-26 14:16:13",
    ...
  },
  ...
]
...
```

### /alerts
_Get the most recent weather alerts from the National Weather Service, scoped down to relevant information._

Querying the `/alerts` endpoint presents a simplified asset collection parsed from the records returned by the NWS's own APIs (e.g. `https://api.weather.gov/alerts/active`). The NWS returns a large amount of quality data, more than is necessary for this application to consume.

You can read more about the NWS APIs [in their documentation](https://forecast-v3.weather.gov/documentation?redirect=legacy).

The `/alerts` API pares down that data to indicating the impacted location(s), the dates over which the alerts are active, and some fundamental information describing the weather event. 

To make a query on this endpoint, no additional parameter is necessary. Simply run a call like the following:
`<base-url>/weather/incoming_webhook/alerts.

Such a call would return a dataset looking something like this:
```
[
  {
    "latitude": {
      "$numberDouble": "37.7"
    },
    "longitude": {
      "$numberDouble": "-77.8"
    },
    ...
    "start_date": "2019-04-16T08:32:00-04:00",
    "end_date": "2019-04-16T20:51:00-04:00",
    "event_type": "Flood Warning",
    ...
    "geocode": [
      "VAC087",
      "VAC760",
      "VAC041"
    ]
  },
  ...
]
  ```
