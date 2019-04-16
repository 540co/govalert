# GovAlert
_\<some description should go here\>_

## Key Technologies:
- **Mongo Atlas** to store stable data, such as contracting office locations, which must be updated only occasionally.
- **Mongo Stitch** to tie the various data components together, do data processing, and act as a backend for the client(s) to call via webhooks.
- **ArcGIS** to display a map and overlay our interpreted data atop it.

### Atlas
Mongo's cloud store provides the core of this data-driven application. The `contracts` collection holds a most recent ingested copy of government contract data. This data has been parsed and interpreted from `GovSpend` records and stored for ease of access (there are a lot of records!).

### Stitch
A key goal of this application was to stand up lightweight APIs to act as passthroughs for our data, providing some translation and context along the way, and making the job on the front-end client a bit easier. Mongo Stitch fit that niche and made it simple to stand up endpoints to access our data and reference external APIs as well, such as the **National Weather Service APIs**, which provide us up-to-date weaher alerts at any given moment. Leveraging these APIs made it simple to contextualize potential impact of weather fronts as they occur.

### ArcGIS
[ArcGIS](https://developers.arcgis.com/) provides a complete mapping platform, easy to use and with plenty of power. Of all mapping options available, it best fit our needs and the timescale by which we were constrained.

It's easy to control an ArcGIS map and its related data via javascript -- we opted for vanilla JS to limit overhead. You can learn about how to use ArcGIS in javascript via [their handy tutorials](https://developers.arcgis.com/labs/?product=JavaScript&topic=any).

#### ArcGIS libraries used by this project:
- `esri/Map`: A map object.
- `esri/views/MapView`: The view on which graphics are drawn.
- `esri/Graphic`: Conceptual graphics object.
- `esri/geometry/Point`: Definition of a geometric point.
- `esri/symbols/SimpleMarkerSymbol`: Visual marker indicator.
- `esri/request`: Allows ArcGIS to make its own external calls for resources.
- `esri/geometry/Polygon`: Definition of a geometric polygon. 
- `esri/symbols/SimpleFillSymbol`: Represents a fillable graphics object.

Any ArcGIS library can simply be listed in the require, and it will be automatically pulled in by the main ArcGIS script.

## APIs


All our constructed APIs operate off the same base URL as generated via stitch: `"https://us-east-1.aws.webhooks.mongodb-stitch.com/api/client/v2.0/app/540-1-vvypp/service`. 

In addition, each endpoint expects a query parameter secret which verifies the authenticity of the call.

### /contracts
_Search for government contracts based on zip code, county, state, latitude / longitude, or UGC location code._

The `/contracts` webhook exposes a means to find contracts based on some location data. In the context of this application, the call will typically employ UGC code, as this is the most straightforward means of searching via the data returned by NWS alert data.

To make a query against some location, call the `/contracts` endpoint with a query parameter of one of `[zip, county, state, latitude, longitude, ugc]`.

So for instance a call to `<base-url>/contracts/incoming_webhook/contracts?secret=<app-secret>&ugc=IAC063` would return something like this (part of the actual result as of 4/15/19):
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

Running the same query with the `mock` param applied will return the same filters applied to mock data: `<base_url>/contracts/incoming_webhook/contracts?secret=<app-secret>&ugc=IAC063&mock=1`.

### /alerts
_Get the most recent weather alerts from the National Weather Service, scoped down to basic information._

Querying the `/alerts` endpoint presents a simplified asset collection parsed from the records returned by the NWS's own APIs (e.g. `https://api.weather.gov/alerts/active`). The NWS returns a good amount of quality data, but it's more than is necessary for this application to consume, and passing all of that on to the front end of a client would slow down processing and be cumbersome to intepret for future development.

The `/alerts` API pares down that data to the impacted location(s), the active dates, and some fundamental information describing the weather event. 

To make a query on this endpoint, no additional parameter is necessary. Simply run a call like the following:
`<base-url>/weather/incoming_webhook/alerts?secret=<app-secret>`.

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
