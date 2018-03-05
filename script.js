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
    map.doubleClickZoom.disable();
    map.setMinZoom(15);
    var gotoAndLoad = function (a) {
        var f = a;
        map.panTo(f.latlng);
        ServerDAO.getApplications(f.latlng, drawApplications);
    };
    map.on('touchstart', function () {
        map.off('touchstart');
        map.on('contextmenu', gotoAndLoad);
    });
    map.on('tap', gotoAndLoad);
    map.on('dblclick', gotoAndLoad);
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
                layer.bindPopup(function () { return createApplicationPopup(feature.properties); }, { minWidth: 300 });
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
    if (prop.Comments !== null && prop.Comments !== undefined) {
        var c = prop.Comments;
        popup.find('#comments')
            .text('view ' + c.length + ' comments')
            .click(function () { return showComments(prop.Description, prop.ID, c); });
    }
    else {
        popup.find('#comments')
            .text('Add first comment')
            .click(function () { return showAddComment(prop.ID, prop.Description); });
    }
    return popup;
}
function showComments(description, id, comments) {
    var modal = $('#CommentModal');
    modal.find('#ApplicationDescription').text(description);
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
        showAddComment(id, description);
    });
    modal.modal('show');
}
function showAddComment(id, description) {
    var modal = $('#AddCommentModal');
    if (modal.find("#id").attr('value') !== id.toString()) {
        modal.find("#id").attr('value', id);
        modal.find('#comment').val('');
    }
    modal.find('#ApplicationDescription').text(description);
    modal.modal('show');
}
function fromTemplate(id) {
    var template = $(id).get(0);
    return $(template.content.cloneNode(true));
}
var ServerDAO = /** @class */ (function () {
    function ServerDAO() {
    }
    ServerDAO.getApplications = function (latlng, handler) {
        var _this = this;
        this.showLoadingModal();
        $.getJSON('https://872qc811b5.execute-api.us-east-1.amazonaws.com/prod/botl-get-app', { radius: 0.5, latitude: latlng.lat, longitude: latlng.lng })
            .done(function (json) { _this.hideLoadingModal(); handler(json); })
            .fail(function () { _this.showErrorModal("Communication Error", "<p>Unable to get applications</p>"); });
    };
    ServerDAO.showErrorModal = function (title, body) {
        $('#ErrorModalTitle').text(title);
        $('#ErrorModalBody').html(body);
        $('#ErrorModal').modal('show');
    };
    ServerDAO.showLoadingModal = function () {
        $('#spinnerModal').modal("show");
    };
    ServerDAO.hideLoadingModal = function () {
        $('#spinnerModal').modal("hide");
    };
    return ServerDAO;
}());
