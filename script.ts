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
	map.doubleClickZoom.disable();
	map.setMinZoom(15);

	
	map.on('contextmenu', (a: LeafletEvent) => {
			var f : LeafletMouseEvent = a as LeafletMouseEvent;
			map.panTo(f.latlng);
			ServerDAO.getApplications(f.latlng, drawApplications);
		});

	map.locate({setView: true, maxZoom: 16});
}

function onLocationError(e : LeafletEvent) : void {
	$('#ErrorModalTitle').text("Location Error");
	$('#ErrorModalBody').html("<p>Unable to get device location. Please enable location</p>");
	$('#ErrorModal').modal('show');
	var defaultLatLng: LatLng = new L.LatLng(52.93631488220747, 1.1357331275939944);
	map.panTo(defaultLatLng);
	ServerDAO.getApplications(defaultLatLng, drawApplications);
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
				layer.bindPopup(() => {return createApplicationPopup(feature.properties)}, {minWidth: 300});
			}
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

	if(prop.Comments !== null && prop.Comments !== undefined) { //Shout out to typescript, what a guy
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
		ServerDAO.postComment(form.serialize());
		e.preventDefault();
	});
	modal.modal('show');
}

function fromTemplate(id: string) : JQuery<HTMLElement>{
	var template = $(id).get(0) as HTMLTemplateElement;
	return $(template.content.cloneNode(true));
}

class ServerDAO {

	public static getApplications(latlng : LatLng, handler : Function) : void {
		this.showLoadingModal();
		$.getJSON('https://872qc811b5.execute-api.us-east-1.amazonaws.com/prod/botl-get-app',
				{radius: 0.5, latitude: latlng.lat, longitude: latlng.lng})
			.done((json) => { 
				this.hideLoadingModal(); 
				handler(json) 
			})
			.fail(() => {
				$('#ErrorModalTitle').text("Communication Error");
				$('#ErrorModalBody').html("<p>Unable to get applications</p>");
				$('#ErrorModal').modal('show');
			});
	}

	public static postComment(data: string) : void {
		$.post('https://872qc811b5.execute-api.us-east-1.amazonaws.com/prod/botl-comment-app', data)
		.fail(() => {
			$('#ErrorModalTitle').text("Communication Error");
			$('#ErrorModalBody').html("<p>Unable to post comment</p>");
			$('#ErrorModal').modal('show');
		});
	}

	private static showLoadingModal() {
		$('#spinnerModal').modal("show");
	}

	private static hideLoadingModal() {
		$('#spinnerModal').modal("hide");
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