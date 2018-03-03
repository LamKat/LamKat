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
	if(prop === null) {
		return L.popup().setContent('<p>This application doesn\' have any valid properties</p>');
	} else {
		var popup: HTMLElement = document.createElement('div');
		var props : any[] = prop.applications;
		switch (props.length) {
			case 0:
				//TODO handle
				break;
			case 1:
				popup = $($.parseHTML(f(new ApplicationProperty(prop[0])))).get(0);
				break;
			default:
				var s: string = '<div id="myCarousel" class="carousel slide" data-wrap="false" data-interval="false">' +
				'  <ul class="pager">' +
				'	<li class="previous"><a href="#myCarousel" data-slide="prev">&larr; Newer</a></li>' +
				'	<li class="next"><a href="#myCarousel" data-slide="next">Older &rarr;</a></li>' +
				'  </ul>' +
				'  <div class="carousel-inner">' +
				'  </div>' +
				'</div>';
				console.log(s);
		
				var elm = $($.parseHTML(s));
				var inner = elm.find('.carousel-inner');
				for(var i = 0; i < props.length; i++) {
					inner.append(f(new ApplicationProperty(prop[0])));
				}
				inner.find('.item:first').addClass('active');
				elm.find('.previous').hide();
				elm.on('slid.bs.carousel', "", ()  => {
					elm.find('li').show();
					if(elm.find('.carousel-inner .item:last').hasClass('active')) {
						elm.find('.next').hide();
					} else if(elm.find('.carousel-inner .item:first').hasClass('active')) {
						elm.find('.previous').hide();
					} 
				});
				popup = elm.get(0);
		}
		return L.popup().setContent(popup);

	}
}

function f(prop: ApplicationProperty) : string {
	return '<div class="item">' +
	'		<p>Certificate of lawfulness (proposed) for single storey rear extension and rear dormer.</p>' +
	'		<a href="">More info</a>' +
	'	</div>' ;
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
	}

}
