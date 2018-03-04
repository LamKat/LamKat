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

function createApplicationPopup(a: any) : L.Popup {
	var prop: Application[] = a.applications;
	var popup: JQuery<HTMLElement>;
	switch (prop.length) {
		case 0:
			throw "Data returned from server doesn't contain any applications for a geo feature";
		case 1:
			popup = $($.parseHTML(buildApplicationText(prop[0])));
			break;
		default:
			var s: string = 
			'<div id="applicationCarousel" class="carousel slide" data-wrap="false" data-interval="false">' +
			'  <div class="carousel-inner"></div>' +
			'  <ul class="pager">' +
			'	<li class="previous"><a href="#applicationCarousel" data-slide="prev">&larr; Newer</a></li>' +
			'	<li class="next"><a href="#applicationCarousel" data-slide="next">Older &rarr;</a></li>' +
			'  </ul>' +
			'</div>';
	
			var popup = $($.parseHTML(s));
			popup.find('.carousel-inner')
				.html(prop.map(buildApplicationText).join(''))
				.find('.item:first').addClass('active');
			popup.find('.previous').hide();
			popup.find('#showComments').bind('click', () => {
				console.log("click");
				$('#CommentModal').modal('show');

			})

			popup.on('slid.bs.carousel', "", ()  => {
				popup.find('li').show();
				if(popup.find('.carousel-inner .item:last').hasClass('active')) {
					popup.find('.next').hide();
				} else if(popup.find('.carousel-inner .item:first').hasClass('active')) {
					popup.find('.previous').hide();
				} 
			});
	}
	return L.popup().setContent(popup.get(0));

}

function buildApplicationText(prop: Application) : string {
	if(prop.Comments !== null) {

		console.log(prop.Comments);
	}


	return '<div class="item">' +
	'		<p>' + prop.Description +'</p>' +
	'		<a href="' + prop.URL + '">More info</a>' +
	'		<button id="showComments">Show Comments</button>' + 
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

interface Application {
	Reference: string;
	Description: string;
	URL: string;
	ID: number;
	Comments?: Comment[];
}

interface Comment {
	Comment: string;
	Name: string;
}