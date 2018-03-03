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
    var popup = new L.Popup();
    if (prop === null) {
        return L.popup().setContent('<p>This application doesn\' have any valid properties</p>');
    }
    else {
        var tmp = $('#popupTemplate').get(0);
        var maybePopupRoot = tmp.content.querySelector("div");
        if (maybePopupRoot === null) {
            console.log("No template found");
            return L.popup().setContent('<p>This application doesn\' have any valid properties</p>');
        }
        var x = maybePopupRoot;
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
        if (prop !== null) {
        }
    }
    return ApplicationProperty;
}());
