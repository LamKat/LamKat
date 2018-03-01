import * as Leafletjs from "leaflet";
import { 
    LeafletEvent as _LeafletEvent, 
    LocationEvent as _LocationEvent, 
    Map as _Map, 
    LatLng as _LatLng, 
    geoJSON as _geoJSON
} from "leaflet";
import  { GeoJsonObject as _GeoJsonObject } from "geojson"

declare global {
    const leaflet: typeof Leafletjs;
    type LeafletEvent = _LeafletEvent;
    type LocationEvent = _LocationEvent;
    type Map = _Map;
    type LatLng = _LatLng;
    type GeoJsonObject = _GeoJsonObject;
    // type geoJSON = _geoJSON;
}

export {};


// import { LeafletEvent, LocationEvent, Map, LatLng, geoJSON} from "leaflet";
// import * as L from 'leaflet';

// import { GeoJsonObject } from "geojson";