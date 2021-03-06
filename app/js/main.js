var L = require('leaflet/dist/leaflet-src');
var _ = require('underscore');

var map = L.map('map', {
	center: [27.7460, -18.08],
	zoom: 13,
	minZoom: 4,
	maxZoom: 20,
	scrollWheelZoom: false
});

L.tileLayer('https://{s}.tiles.mapbox.com/v3/{key}/{z}/{x}/{y}.png', {
	key: 'lrqdo.2f512fdf',
	attribution: ''
}).addTo(map);


L.tileLayer('https://{s}.tiles.mapbox.com/v3/{key}/{z}/{x}/{y}.png', {
	key: 'lrqdo.0c289a18',
	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);



var getXHRPromise = function(url) {
	return new Promise((resolve, reject) => {
        var request = new XMLHttpRequest();
        request.onload = e => {
            if ( e.target.status !== 200) {
                reject(e.target.statusText);
            } else {
                resolve(JSON.parse(e.target.response));
            }
        };

        request.onerror = e => {
            reject(e.target.statusText);
        };
        request.open('GET', url);
        request.send();
    });
};


var testCoords, testPath, testPath2;


Promise.all([
	getXHRPromise('./data/6/0_car_topo.json'),
	getXHRPromise('./data/6/1_feet_test_topo.json'),
	// getXHRPromise('./data/6/2_car.json')
]).then( data => {
	//invert lat/lon manually :/

	var car0topo = data[0];
	var car0geo = topojson.feature(car0topo, car0topo.objects['0_car'] );

	let car0 = car0geo.features[0].geometry.coordinates.map( coords => [coords[1], coords[0]] );
	L.polyline(car0, {color: 'red', dashArray: '10,10', lineCap: 'square', weight: 8, opacity: .3}).addTo(map);

	var testTopo = data[1];
	var testGeo = topojson.feature(testTopo, testTopo.objects['1_feet_test'] );

	testCoords = testGeo.features[0].geometry.coordinates.map( coords => [coords[1], coords[0]] );
	testPath = L.polyline([], {color: 'red', weight: 8, opacity: .3}).addTo(map);
	testPath2 = L.polyline([], {color: 'red', weight: 1, opacity: 1}).addTo(map);

	// let car2 = data[2].features[0].geometry.coordinates.map( coords => [coords[1], coords[0]] );
	// L.polyline([], {color: 'green'}).addTo(map);
});




// var videoTpl = _.template( document.querySelector('.tpl-video').firstChild.nodeValue );

// var videoContainer = new L.Popup({
// 							maxWidth: 400,
// 							maxHeight: 300,
// 							autoPan: false,
// 							offset: new L.Point(0,0)
// 						})
// 						.setLatLng([27.7, -17.9])
// 						.openOn(map);
// var video = document.querySelector('.video-player');

var numImages = 1026;
var targetWidth = 256;
var sheetWidth = 2048;

var targetHeight = targetWidth*.75;
var gridCols = sheetWidth/targetWidth;
var gridRows = Math.floor(gridCols/.75);
var spritesInSheet = gridCols * gridRows;
var numSS = Math.ceil(numImages/spritesInSheet);

var spritesheets = [];
var currentSpriteSheetIndex, currentSpriteSheetContainer, currentSpriteSheetCoords;
var img;

var timelapse = document.querySelector('.timelapse');
var timelapseLow = document.querySelector('.timelapse-low');
var timelapseMedium = document.querySelector('.timelapse-medium');

for (var i = 0; i < numSS; i++) {
	img = document.createElement('div');
	img.style.backgroundImage = 'url(data/6/timelapse/spritesheet_' + i + '.jpg)'; 
	img.style.display = 'none'; 
	spritesheets.push(img);
	timelapseLow.appendChild(img);
}





var body = document.body,
    html = document.documentElement;

var totalScroll = Math.max( body.scrollHeight, body.offsetHeight, 
                       html.clientHeight, html.scrollHeight, html.offsetHeight );
totalScroll -= window.innerHeight;

var showMediumTimeout;
var mediumImage;

document.addEventListener('scroll', function (e) {
	// console.log(window.scrollY);
		

	if (!testCoords) return;

	var scrollR = window.scrollY/totalScroll;
	// console.log(scrollR)

	testPath.setLatLngs( testCoords.slice(0, Math.floor( scrollR*testCoords.length ) ) );
	testPath2.setLatLngs( testCoords.slice(0, Math.floor( scrollR*testCoords.length ) ) );

	/*
	var elem = document.querySelector('.test');
	if (window.scrollY>1700 && elem.style.position !== 'fixed') {
		elem.style.top = elem.getBoundingClientRect().top + 'px';
		elem.style.position = "fixed";
		elem.style.width = "200px";
	} else if (window.scrollY<=1700 && elem.style.position === 'fixed') {
		elem.style.top = 0;
		elem.style.position = "relative";
	}
	*/

	// console.log(video.seekable.start(), video.seekable.end() );
	// video.currentTime = scrollR * video.duration;
	// video.currentTime = scrollR * video.duration;

	// var imgIndex = Math.floor(scrollR * images.length);
	// console.log(imgIndex);
	// videoContainer.setContent( images[ imgIndex ] );

	var imgIndex = Math.floor(scrollR * numImages);
	var spritesheetIndex = Math.floor( imgIndex / spritesInSheet );

	//check against current ss index
	if (spritesheetIndex !== currentSpriteSheetIndex) {
		if (currentSpriteSheetContainer) currentSpriteSheetContainer.style.display = 'none';
		currentSpriteSheetIndex = spritesheetIndex;
		currentSpriteSheetContainer = spritesheets[spritesheetIndex];
		currentSpriteSheetContainer.style.display = 'block';
	}

	//get position
	var indexInSheet = imgIndex % spritesInSheet;
	var col = indexInSheet % gridCols;
	var row = Math.floor( indexInSheet / gridCols );

	var spriteSheetCoords = [spritesheetIndex, indexInSheet];
	// console.log(imgIndex, currentSpriteSheetIndex, indexInSheet, col, row)

	

	if ( ! _.isEqual( currentSpriteSheetCoords, spriteSheetCoords ) ) {
		var posX = col * targetWidth;
		var posY = row * targetHeight;

		currentSpriteSheetContainer.style.backgroundPosition = '-'+posX+'px -' + posY + 'px';
		console.log('change');

		clearTimeout (showMediumTimeout);

		if (mediumImage) {
			timelapseMedium.removeChild(mediumImage);
			timelapseMedium.style.display = 'none';
			timelapseLow.style.display = 'block';
			mediumImage.removeEventListener('load', onMediumImageLoaded);
			mediumImage = null;
		}

		showMediumTimeout = setTimeout( function () {
			console.log(imgIndex)
			mediumImage = document.createElement('img');
			mediumImage.addEventListener('load', onMediumImageLoaded)
			mediumImage.setAttribute('src', 'data/6/timelapse/medium/' + imgIndex + '.jpg');
			mediumImage.setAttribute('class', 'medium');
			timelapseMedium.appendChild(mediumImage);
			

		}, 500)
	}

	currentSpriteSheetCoords = spriteSheetCoords;

	

});


var onMediumImageLoaded = function() {
	timelapseMedium.style.display = 'block';
	timelapseLow.style.display = 'none';
}




