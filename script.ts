/// <reference path="script.d.ts" />


var map : Map;
function init() : void {
	var mapOverlays;
	map = L.map('map').fitWorld();
	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
			'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="http://mapbox.com">Mapbox</a>',
		id: 'mapbox.streets'
	}).addTo(map);

	map.on('locationfound', onLocationFound);
	map.on('locationerror', onLocationError);
	map.locate({setView: true, maxZoom: 16});
}

function onLocationError(e : LeafletEvent) : void {
	console.log("Location not found");
	/*
		Display Location error
	*/
}

function onLocationFound(e : LeafletEvent) : void {
	var locationE = e as LocationEvent;
	//TODO make this more destinctive 
	L.marker(locationE.latlng).addTo(map).bindPopup("You are here"); 
	ServerDAO.getApplications(locationE.latlng, drawApplications);
}

function drawApplications(geojson :  GeoJsonObject) : void {
	var polygonLayer = L.layerGroup();
	map.addLayer(L.geoJSON(geojson, {
		onEachFeature: (feature, layer) => {
			if (feature.properties) {
				layer.bindPopup(feature.properties.description + '<br><a href="' + feature.properties.url + '">More info</a>');
			}
		} 
	}));
}

class ServerDAO {
	public static getApplications(latlng : LatLng, handler : Function) : void{
		var xJSON : XMLHttpRequest = new XMLHttpRequest();
		xJSON.overrideMimeType("application/json");
		xJSON.open('GET', 'https://872qc811b5.execute-api.us-east-1.amazonaws.com/prod/botl-get-app?' + 
							'radius=0.5' + 
							'&latitude=' + latlng.lat + 
							'&longitude=' + latlng.lng, true);
		xJSON.onreadystatechange = () => {
			if (xJSON.readyState == 4 && xJSON.status == 200) {
				console.log("GET-APP Response Text: " + xJSON.responseText);
				var geoJson : GeoJsonObject = JSON.parse(xJSON.responseText);
				handler(geoJson); 
			} else {
				console.log("GET-APP Failed: code = " + xJSON.status);
				// TODO handle
			}
		};
		xJSON.send();
	}
}