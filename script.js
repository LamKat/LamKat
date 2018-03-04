/// <reference path="script.d.ts" />
var map;
function init() {
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
    map.locate({ setView: true, maxZoom: 16 });
}
function onLocationError(e) {
    console.log("Location not found");
    /*
        Display Location error
    */
}
function onLocationFound(e) {
    var locationE = e;
    //TODO make this more destinctive 
    L.marker(locationE.latlng).addTo(map).bindPopup("You are here");
    ServerDAO.getApplications(locationE.latlng, drawApplications);
}
function drawApplications(geojson) {
    var polygonLayer = L.layerGroup();
    map.addLayer(L.geoJSON(geojson, {
        onEachFeature: function (feature, layer) {
            if (feature.properties) {
                layer.bindPopup(createApplicationPopup(feature.properties));
            }
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
            popup = $($.parseHTML(buildApplicationText(prop[0])));
            break;
        default:
            var s = '<div id="applicationCarousel" class="carousel slide" data-wrap="false" data-interval="false">' +
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
            popup.on('slid.bs.carousel', "", function () {
                popup.find('li').show();
                if (popup.find('.carousel-inner .item:last').hasClass('active')) {
                    popup.find('.next').hide();
                }
                else if (popup.find('.carousel-inner .item:first').hasClass('active')) {
                    popup.find('.previous').hide();
                }
            });
    }
    return L.popup().setContent(popup.get(0));
}
function buildApplicationText(prop) {
    if (prop.Comments !== null) {
        console.log(prop.Comments);
    }
    return '<div class="item">' +
        '		<p>' + prop.Description + '</p>' +
        '		<a href="' + prop.URL + '">More info</a>' +
        '	</div>';
}
var ServerDAO = /** @class */ (function () {
    function ServerDAO() {
    }
    ServerDAO.getApplications = function (latlng, handler) {
        var _this = this;
        $.getJSON('https://872qc811b5.execute-api.us-east-1.amazonaws.com/prod/botl-get-app1', { radius: 0.5, latitude: latlng.lat, longitude: latlng.lng })
            .done(function (json) { handler(json); })
            .fail(function () { _this.showErrorModal("Communication Error", "<p>Unable to get applications</p>"); });
    };
    ServerDAO.showErrorModal = function (title, body) {
        $('#ErrorModalTitle').text(title);
        $('#ErrorModalBody').html(body);
        $('#ErrorModal').modal('show');
    };
    return ServerDAO;
}());
