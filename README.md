# GovAlert
_Be in the know when weather impacts your mission._

## Inspiration

Through our work with the Federal Government, we know that contractors are a critical part of an agency's ability to accomplish its mission. When major weather events occur, it disrupts the lives of those contractors and impacts the money involved. We want contractors and agency officials to be in the know when weather warnings will impact the contractor workforce.

## What it does

GovAlert brings together publicly available data, combining it into a single, streamlined process, and adding new meaning to the data. We make identifying the impact of a weather alert is as simple as searching on a map.

## How we built it

Mongo's Atlas cloud store provides the core of this data-driven application. The contracts collection contains a recent copy of government contract data ingested via a python script. Mongo Stitch made it simple to stand up endpoints to access our data while also tying into external data sources and APIs. We used Mongo Compass along the way to analyze and understand the data.

We coupled these Mongo technologies with ArcGIS to generate an interactive map overlaid with meaningful, interpreted data.


## Challenges we ran into

Right out of the gate, we struggled to contextualize and ingest the huge amount of contract data necessary for our system. Data analysis let us generate an ingestion script that pared down the government contract data to its necessary elements.

Our most difficult challenge lay in coupling the weather data with that of the contracts. The National Weather Service data uses industry-specific geocodes to indicate location -- data not present in the contracts. We worked both ends of the problem, processing the data as it was ingested, to provide geographic context, while using our API to interpret and compare the data on the fly.

Additional challenges included providing enough continuous data to the front-end to make the map useful, while limiting the load to keep things speedy. Finding geographic distances efficiently also presented difficulties, as did extracting the geographic area of the map that the user sees for use in filtering the data.

## Accomplishments that we're proud of

We started our project halfway through the allotted time, with very little idea of what steps would be necessary to accomplish our goal. Despite new challenges at every step, through collaborative research and a good amount of grunt-work, we stood up a functional, useful application in a brief time -- and made it look good, too.

## What we learned

The upside of facing so many challenges is that we all encountered a cross-cutting view of the solution. Besides gaining an understanding of data that has relevance to our work as a company, we learned how to interpret and apply geographic data in new contexts.
We also learned much more about what's offered by various Mongo tools, and got a chance to dive into some of the newer features, such as Stitch's static hosting.

## What's next for GovAlert

From the start, we developed a broad set of user stories to help contractors and agency officials limit the impact of weather events. Due to time constraints, as predicted, we focused on implementing the most critical and useful features. We'd love to continue to build out the system, making it more robust, more full-featured, and more beneficial to government contractors across the country.

---

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
