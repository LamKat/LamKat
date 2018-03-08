/// <reference path="script.d.ts" />

var map : Map;

/*
Full disclosure, projections are hard. Here is the flow of projections 
In LPA site = OSGB36
This is then shifted to the WGS84 and stored in the database using Jcoord (Helmert datum transformation) (EPSG4326?)
We are using the geojson standard of WGS84 in out REST service
We are then imploring Leaflet to project using EPSG3857. 
All polygons are slightly wrong. I think this is an issue with JCoord??
 */

/* images courtesy http://ajaxload.info/ & https://mapicons.mapsmarker.com/ */

const mapOptions: L.MapOptions = {minZoom: 15};
const mapSource: string = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
const mapBoxAttribution: string = '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>'
const defaultLatLng: LatLng = new L.LatLng(52.9495761, -1.1548782); //Nottingham castle
const commentAPI: string = 'https://872qc811b5.execute-api.us-east-1.amazonaws.com/prod/botl-comment-app';
const applicationAPI: string = 'https://872qc811b5.execute-api.us-east-1.amazonaws.com/prod/botl-get-app';

const applicationMarkerIcon: L.Icon = L.icon({
		iconUrl: 'images/application.png',
		iconSize: [32, 37],
		iconAnchor: [16, 37],
		popupAnchor: [0, -35]
	});
const userLocationMarkerIcon: L.Icon = L.icon({
		iconUrl: 'images/location.png',
		iconSize: [32, 37],
		iconAnchor: [16, 37],
		popupAnchor: [0, -35]
	});

function init() : void {
	var aboutModal = $('#aboutModal').modal('show');
	aboutModal.find('#useLocation').click(() => {
		map.locate({setView: true, enableHighAccuracy: true})
	});
	aboutModal.find('#dontUseLocation').click(() => {
		gotoLocation(defaultLatLng);
	});
	setupMap();
}

function setupMap(){
	map = L.map('map', mapOptions).fitWorld();
	L.tileLayer(mapSource, {
		attribution: mapBoxAttribution,
		id: 'mapbox.streets'
	}).addTo(map);
	
	map.on('locationfound', onLocationFound);
	map.on('locationerror', onLocationError);

	map.on('contextmenu', (e: LeafletEvent) => {
			gotoLocation((e as LeafletMouseEvent).latlng)
		});
}

function onLocationError(e : LeafletEvent) : void {
	$('#ErrorModalTitle').text("Location Error");
	$('#ErrorModalBody').html("<p>Unable to get device location. Please enable location</p>");
	$('#ErrorModal').modal('show');
	gotoLocation(defaultLatLng);
}

function gotoLocation(location : LatLng) {
	map.panTo(location);
	getApplications(location, drawApplications);
}

function onLocationFound(e : LeafletEvent) : void {
	var locationE = e as LocationEvent;
	L.marker(locationE.latlng)
		.setIcon(userLocationMarkerIcon)
		.bindPopup('<p class="text-center">You are here</p>', {minWidth: 300})
		.addTo(map);
	
	getApplications(locationE.latlng, drawApplications);
}

function drawApplications(geojson :  GeoJsonObject) : void {
	var polygonLayer = L.layerGroup();
	map.addLayer(L.geoJSON(geojson, {
		onEachFeature: (feature, layer) => {
			if (feature.properties) {
				layer.bindPopup(() => {
					return createApplicationPopup(feature.properties)
				}, {minWidth: 300});
			}
		},
		pointToLayer: (feature, latLng) => {
			return L.marker(latLng, {icon: applicationMarkerIcon});
		}
	}));
}

function createApplicationPopup(a: any) : L.Content {
	var prop: Application[] = a.applications;
	var popup: JQuery<HTMLElement>;
	switch (prop.length) {
		case 0:
			throw "Data returned from server doesn't contain any applications for a geo feature";
		case 1:
			popup = buildApplicationText(prop[0]);
			break;
		default:
			popup = fromTemplate('#popupCarousel').find('#applicationCarousel');
			popup.find('.carousel-inner').append(prop.map(buildApplicationText));
			popup.find('.item:first').addClass('active');
			popup.find('.previous').hide();

			popup.bind('slid.bs.carousel', ()  => {
				popup.find('li').show();
				if(popup.find('.carousel-inner .item:last').hasClass('active')) {
					popup.find('.next').hide();
				} else if(popup.find('.carousel-inner .item:first').hasClass('active')) {
					popup.find('.previous').hide();
				} 
			});
	}
	return popup.get(0);

}

function buildApplicationText(prop: Application) : JQuery<HTMLElement>{
	var template = $('#popupText').get(0) as HTMLTemplateElement;
	var popup = $(template.content.cloneNode(true));
	popup.find('#refrence').text(prop.Reference);
	popup.find('#description').text(prop.Description);
	popup.find('#URL').click(() => {
		window.open(prop.URL, '_blank');
	});

	if(prop.Comments) {
		var c : Comment[] = prop.Comments;
		popup.find('#comments')
			.text('view ' + c.length + ' comments')
			.click(() => showComments(prop, c));
	} else {
		popup.find('#comments')
			.text('Add first comment')
			.click(() => showAddComment(prop));
	}
	return popup;
}

function showComments(prop: Application, comments: Comment[]) {
	var modal = $('#CommentModal');
	modal.find('#ApplicationDescription').text(prop.Description);
	modal.find('#Comments')
		.empty()
		.append(comments.map((comment: Comment) => {
			var card = fromTemplate("#commentCardTemplate");
			card.find('#name').text(comment.Name);
			card.find('#comment').text(comment.Comment);
			return card;
		}));
	modal.find('#addComment').click(() => {
		modal.modal('hide');
		showAddComment(prop);
	});
	modal.modal('show');
}

function showAddComment(prop: Application) {
	var modal = $('#AddCommentModal');
	if(modal.find("#id").attr('value') !== prop.ID.toString()) {
		modal.find("#id").attr('value', prop.ID);
		modal.find('#comment').val('');
	}
	modal.find('#ApplicationDescription').text(prop.Description);
	var form = modal.find('form:first');
	form.off('submit');
	form.submit((e) => {
		if(!prop.Comments) 
			prop.Comments = [];
		prop.Comments.push({
			Comment: form.find('#comment').val() as string,
			Name: form.find('#name').val() as string
		} as Comment);
		map.closePopup();
		modal.modal('hide');
		postComment(form.serialize());
		e.preventDefault();
	});
	modal.modal('show');
}

function fromTemplate(id: string) : JQuery<HTMLElement>{
	var template = $(id).get(0) as HTMLTemplateElement;
	return $(template.content.cloneNode(true));
}


function getApplications(latlng : LatLng, handler : (json: GeoJsonObject) => void) : void {
	$('#spinnerModal').modal("show");
	$.getJSON(applicationAPI,
			{radius: 0.5, latitude: latlng.lat, longitude: latlng.lng})
		.always(() => $('#spinnerModal').modal("hide"))
		.done(handler)
		.fail(() => {
			$('#ErrorModalTitle').text("Communication Error");
			$('#ErrorModalBody').html("<p>Unable to get applications</p>");
			$('#ErrorModal').modal('show');
		});
}

function postComment(data: string) : void {
	$.post(commentAPI, data)
	.fail(() => {
		$('#ErrorModalTitle').text("Communication Error");
		$('#ErrorModalBody').html("<p>Unable to post comment</p>");
		$('#ErrorModal').modal('show');
	}); 
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