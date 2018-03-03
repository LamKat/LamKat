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
				layer.bindPopup(createApplicationPopup(feature.properties));
			}
		} 
	}));
}

function createApplicationPopup(prop: GeoJsonProperties) : L.Popup {
	var popup = new L.Popup();
	if(prop === null) {
		return L.popup().setContent('<p>This application doesn\' have any valid properties</p>');
	} else {
		var tmp: HTMLTemplateElement = $('#popupTemplate').get(0) as HTMLTemplateElement;
		var maybePopupRoot = tmp.content.querySelector("div");
		if(maybePopupRoot === null) {
			console.log("No template found");
			return L.popup().setContent('<p>This application doesn\' have any valid properties</p>');
		} 

		var x: HTMLElement = maybePopupRoot;
		

		console.log(tmp);
		// var rl: HTMLElement = tmp.content.cloneNode().textContent;

		return L.popup().setContent(x);
		// console.log(prop.applications);
	}

	// console.log(prop);
	// prop.applications;
//feature.properties.description + '<br><a href="' + feature.properties.url + '">More info</a>'

	// return new L.Popup();
}

class ServerDAO {

	public static getApplications(latlng : LatLng, handler : Function) : void {
		$.getJSON('https://872qc811b5.execute-api.us-east-1.amazonaws.com/prod/botl-get-app',
				{radius: 0.5, latitude: latlng.lat, longitude: latlng.lng})
			.done((json) => { handler(json) })
			.fail(() => { this.showErrorModal("Communication Error", "<p>Unable to get applications</p>") });
	}

	private static showErrorModal(title: string, body: string) {
		$('#ErrorModalTitle').text(title);
		$('#ErrorModalBody').html(body);
		$('#ErrorModal').modal('show');
	}

}

class ApplicationProperty  {
	constructor(prop: GeoJsonProperties) {
		if(prop !== null) {

		}
	}

}
