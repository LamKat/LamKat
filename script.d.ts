import * as Leafletjs from "leaflet";
import { 
    LeafletEvent as _LeafletEvent, 
    LocationEvent as _LocationEvent, 
    LeafletMouseEvent as _LeafletMouseEvent,
    Map as _Map, 
    LatLng as _LatLng, 
    geoJSON as _geoJSON
} from "leaflet";

import  {
    GeoJsonObject as _GeoJsonObject,
    GeoJsonProperties as _GeoJsonProperties 
} from "geojson";

declare global {
    const leaflet: typeof Leafletjs;
    type LeafletEvent = _LeafletEvent;
    type LocationEvent = _LocationEvent;
    type LeafletMouseEvent = _LeafletMouseEvent;
    type Map = _Map;
    type LatLng = _LatLng;
    type GeoJsonObject = _GeoJsonObject;
    type GeoJsonProperties = _GeoJsonProperties;
}

export {};


// import { LeafletEvent, LocationEvent, Map, LatLng, geoJSON} from "leaflet";
// import * as L from 'leaflet';

// import { GeoJsonObject } from "geojson";