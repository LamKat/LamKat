/// <reference path="script.d.ts" />
var map;
/*
Full disclosure, projections are hard. Here is the flow of projections
In LPA site = OSGB36
This is then shifted to the WGS84 and stored in the database using Jcoord (Helmert datum transformation) (EPSG4326?)
We are using the geojson standard of WGS84 in out REST service
We are then imploring Leaflet to project using EPSG3857.
All polygons are slightly wrong. I think this is an issue with JCoord??
 */
/* images courtesy http://ajaxload.info/ & https://mapicons.mapsmarker.com/ */
var mapOptions = { minZoom: 15 };
var mapSource = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
var mapBoxAttribution = '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>';
var defaultLatLng = new L.LatLng(52.9495761, -1.1548782); //Nottingham castle
var commentAPI = 'https://872qc811b5.execute-api.us-east-1.amazonaws.com/prod/botl-comment-app';
var applicationAPI = 'https://872qc811b5.execute-api.us-east-1.amazonaws.com/prod/botl-get-app';
var applicationMarkerIcon = L.icon({
    iconUrl: 'images/application.png',
    iconSize: [32, 37],
    iconAnchor: [16, 37],
    popupAnchor: [0, -35]
});
var userLocationMarkerIcon = L.icon({
    iconUrl: 'images/location.png',
    iconSize: [32, 37],
    iconAnchor: [16, 37],
    popupAnchor: [0, -35]
});
function init() {
    var aboutModal = $('#aboutModal').modal('show');
    aboutModal.find('#useLocation').click(function () {
        map.locate({ setView: true, enableHighAccuracy: true });
    });
    aboutModal.find('#dontUseLocation').click(function () {
        gotoLocation(defaultLatLng);
    });
    setupMap();
}
function setupMap() {
    map = L.map('map', mapOptions).fitWorld();
    L.tileLayer(mapSource, {
        attribution: mapBoxAttribution,
        id: 'mapbox.streets'
    }).addTo(map);
    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);
    map.on('contextmenu', function (e) {
        gotoLocation(e.latlng);
    });
}
function onLocationError(e) {
    $('#ErrorModalTitle').text("Location Error");
    $('#ErrorModalBody').html("<p>Unable to get device location. Please enable location</p>");
    $('#ErrorModal').modal('show');
    gotoLocation(defaultLatLng);
}
function gotoLocation(location) {
    map.panTo(location);
    getApplications(location, drawApplications);
}
function onLocationFound(e) {
    var locationE = e;
    L.marker(locationE.latlng)
        .setIcon(userLocationMarkerIcon)
        .bindPopup('<p class="text-center">You are here</p>', { minWidth: 300 })
        .addTo(map);
    getApplications(locationE.latlng, drawApplications);
}
function drawApplications(geojson) {
    var polygonLayer = L.layerGroup();
    map.addLayer(L.geoJSON(geojson, {
        onEachFeature: function (feature, layer) {
            if (feature.properties) {
                layer.bindPopup(function () {
                    return createApplicationPopup(feature.properties);
                }, { minWidth: 300 });
            }
        },
        pointToLayer: function (feature, latLng) {
            return L.marker(latLng, { icon: applicationMarkerIcon });
        }
    }));
}
function createApplicationPopup(a) {
    var prop = a.applications;
    var popup;
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
            popup.bind('slid.bs.carousel', function () {
                popup.find('li').show();
                if (popup.find('.carousel-inner .item:last').hasClass('active')) {
                    popup.find('.next').hide();
                }
                else if (popup.find('.carousel-inner .item:first').hasClass('active')) {
                    popup.find('.previous').hide();
                }
            });
    }
    return popup.get(0);
}
function buildApplicationText(prop) {
    var template = $('#popupText').get(0);
    var popup = $(template.content.cloneNode(true));
    popup.find('#refrence').text(prop.Reference);
    popup.find('#description').text(prop.Description);
    popup.find('#URL').click(function () {
        window.open(prop.URL, '_blank');
    });
    if (prop.Comments) {
        var c = prop.Comments;
        popup.find('#comments')
            .text('view ' + c.length + ' comments')
            .click(function () { return showComments(prop, c); });
    }
    else {
        popup.find('#comments')
            .text('Add first comment')
            .click(function () { return showAddComment(prop); });
    }
    return popup;
}
function showComments(prop, comments) {
    var modal = $('#CommentModal');
    modal.find('#ApplicationDescription').text(prop.Description);
    modal.find('#Comments')
        .empty()
        .append(comments.map(function (comment) {
        var card = fromTemplate("#commentCardTemplate");
        card.find('#name').text(comment.Name);
        card.find('#comment').text(comment.Comment);
        return card;
    }));
    modal.find('#addComment').click(function () {
        modal.modal('hide');
        showAddComment(prop);
    });
    modal.modal('show');
}
function showAddComment(prop) {
    var modal = $('#AddCommentModal');
    if (modal.find("#id").attr('value') !== prop.ID.toString()) {
        modal.find("#id").attr('value', prop.ID);
        modal.find('#comment').val('');
    }
    modal.find('#ApplicationDescription').text(prop.Description);
    var form = modal.find('form:first');
    form.off('submit');
    form.submit(function (e) {
        if (!prop.Comments)
            prop.Comments = [];
        prop.Comments.push({
            Comment: form.find('#comment').val(),
            Name: form.find('#name').val()
        });
        map.closePopup();
        modal.modal('hide');
        postComment(form.serialize());
        e.preventDefault();
    });
    modal.modal('show');
}
function fromTemplate(id) {
    var template = $(id).get(0);
    return $(template.content.cloneNode(true));
}
function getApplications(latlng, handler) {
    $('#spinnerModal').modal("show");
    $.getJSON(applicationAPI, { radius: 0.5, latitude: latlng.lat, longitude: latlng.lng })
        .always(function () { return $('#spinnerModal').modal("hide"); })
        .done(handler)
        .fail(function () {
        $('#ErrorModalTitle').text("Communication Error");
        $('#ErrorModalBody').html("<p>Unable to get applications</p>");
        $('#ErrorModal').modal('show');
    });
}
function postComment(data) {
    $.post(commentAPI, data)
        .fail(function () {
        $('#ErrorModalTitle').text("Communication Error");
        $('#ErrorModalBody').html("<p>Unable to post comment</p>");
        $('#ErrorModal').modal('show');
    });
}
