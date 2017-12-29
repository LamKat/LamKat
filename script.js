


function setupMap() {
	var map = L.map('map').fitWorld();

	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
			'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="http://mapbox.com">Mapbox</a>',
		id: 'mapbox.streets'
	}).addTo(map);

	function onLocationFound(e) {
		var radius = e.accuracy / 2;

		L.marker(e.latlng).addTo(map)
			.bindPopup("You are within " + radius + " meters from this point");

		L.circle(e.latlng, radius).addTo(map);

	}

	function onLocationError(e) {
		alert(e.message);
	}

	map.on('locationfound', onLocationFound);
	map.on('locationerror', onLocationError);

	map.locate({setView: true, maxZoom: 16});

	
	getApplications(drawApplications)


	function drawApplications(objJSON) {
		console.log(objJSON);
		for (i = 0; i < objJSON.length; i++) { 
			L.polygon(objJSON[i].Geometry).addTo(map);
		}
	}
}



function getApplications(callback) {

    var xJSON = new XMLHttpRequest();
    xJSON.overrideMimeType("application/json");
    xJSON.open('GET', 'test.json', true);
    xJSON.onreadystatechange = function() {
        if (xJSON.readyState == 4 && xJSON.status == "200") {
	    console.log(xJSON.responseText);
            var objJSON = JSON.parse(xJSON.responseText);
            callback(objJSON);
        }
    }
    xJSON.send();
}
