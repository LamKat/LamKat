


function setupMap() {
	var mapOverlays;

	var map = L.map('map').fitWorld();

	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
			'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="http://mapbox.com">Mapbox</a>',
		id: 'mapbox.streets'
	}).addTo(map);

	
	function onLocationError(e) {
		alert(e.message);
	}

	map.on('locationfound', onLocationFound);
	map.on('locationerror', onLocationError);

	map.locate({setView: true, maxZoom: 16});

	function onLocationFound(e) {
		var radius = e.accuracy / 2;
		L.marker(e.latlng).addTo(map).bindPopup("You are here");

		getApplications(e.latitude, e.longitude, drawApplications);
		function drawApplications(objJSON) {
			var polygonLayer = L.layerGroup();
			//var pinLayer = L.layerGroup();
			
			polygonLayer.addLayer(L.geoJSON(objJSON, {
				onEachFeature: onEachFeature
			}));
			
			function onEachFeature(feature, layer) {
				if (feature.properties) {
					layer.bindPopup(feature.properties.description + '<br><a href="' + feature.properties.url + '">More info</a>');
				}
			}
			
			
			/*for (i = 0; i < objJSON.length; i++) { 
				var popup = objJSON[i].Description + '<br><a href="' + objJSON[i].URL + '">More info</a>';
				polygonLayer.addLayer(L.polygon(objJSON[i].Geometry).bindPopup(popup));
				pinLayer.addLayer(L.marker(coordinateCentre(objJSON[i].Geometry)).bindPopup(popup));

			}*/
			polygonLayer.addTo(map);
			var viewLayers = {
				"Polygons":polygonLayer,
				//"Pins":pinLayer
			}
			L.control.layers(viewLayers).addTo(map);
		}
	}


	
	
}

function coordinateCentre(coords) {
	//If coords is empty then dont hide div 0 error
	var x = 0, y = 0;
	for (j = 0; j < coords.length; j++) { 
		x += coords[j][0];
		y += coords[j][1];
	}
	var centre = [x / coords.length, y / coords.length];
	return centre;
}

function getApplications(latitude, longitude, callback) {

    var xJSON = new XMLHttpRequest();
    xJSON.overrideMimeType("application/json");
    xJSON.open('GET', 'https://872qc811b5.execute-api.us-east-1.amazonaws.com/prod/botl-get-app?' + 
								'radius=0.5&' + 
								'latitude=' + latitude + 
								'&longitude=' + longitude, true);
    xJSON.onreadystatechange = function() {
        if (xJSON.readyState == 4 && xJSON.status == "200") {
	    console.log(xJSON.responseText);
            var objJSON = JSON.parse(xJSON.responseText);
            callback(objJSON);
        }
    }
    xJSON.send();
}
