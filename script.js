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
function createApplicationPopup(prop) {
    if (prop === null) {
        return L.popup().setContent('<p>This application doesn\' have any valid properties</p>');
    }
    else {
        var popup = document.createElement('div');
        var props = prop.applications;
        switch (props.length) {
            case 0:
                //TODO handle
                break;
            case 1:
                popup = $($.parseHTML(f(new ApplicationProperty(prop[0])))).get(0);
                break;
            default:
                var s = '<div id="myCarousel" class="carousel slide" data-wrap="false" data-interval="false">' +
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
                for (var i = 0; i < props.length; i++) {
                    inner.append(f(new ApplicationProperty(prop[0])));
                }
                inner.find('.item:first').addClass('active');
                elm.find('.previous').hide();
                elm.on('slid.bs.carousel', "", function () {
                    elm.find('li').show();
                    if (elm.find('.carousel-inner .item:last').hasClass('active')) {
                        elm.find('.next').hide();
                    }
                    else if (elm.find('.carousel-inner .item:first').hasClass('active')) {
                        elm.find('.previous').hide();
                    }
                });
                popup = elm.get(0);
        }
        return L.popup().setContent(popup);
    }
}
function f(prop) {
    return '<div class="item">' +
        '		<p>Certificate of lawfulness (proposed) for single storey rear extension and rear dormer.</p>' +
        '		<a href="">More info</a>' +
        '	</div>';
}
var ServerDAO = /** @class */ (function () {
    function ServerDAO() {
    }
    ServerDAO.getApplications = function (latlng, handler) {
        var _this = this;
        $.getJSON('https://872qc811b5.execute-api.us-east-1.amazonaws.com/prod/botl-get-app', { radius: 0.5, latitude: latlng.lat, longitude: latlng.lng })
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
var ApplicationProperty = /** @class */ (function () {
    function ApplicationProperty(prop) {
    }
    return ApplicationProperty;
}());
