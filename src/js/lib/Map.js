import polyline from '@mapbox/polyline';
import urlencode from 'urlencode';

function createMap(points, size, provider, callback) {

    // console.log(size);

    let _output = '';
    switch (provider) {

        case 'mapbox' :
            const mapbox = {

                interval : 0,
                points : [],
                center : [0, 0],
                bounds : [0, 0, 0, 0], // maxlat, maxlng, minlat, minlng
                size : [0, 0], // width (lng), height (lat)
                start : null,
                finish : null,

                options : {
                    steps : 100, // ~ 100
                    endpoint : 'https://api.mapbox.com/styles/v1/',
                    username : 'mapbox',
                    style_id : 'light-v10',
                    width : (size.width / 2),
                    height : (size.height / 2),
                    overlay : '',
                    location : 'auto',
                    boundSource: 'gpsData', // 'gpsData or markers'
                    token : 'pk.eyJ1IjoiYWx0ZXJlYnJvIiwiYSI6ImNrZWhrMTR0aTFuZmUyeWx0c2dkemFlencifQ._7m9LHScKO_nv4HCXtsgaQ'
                }
            };

            if (mapbox.options.boundSource === 'gpsData') {
                // Use GPS data to calculate bounds, center, and offsets
                // Your existing logic for GPS data processing
                mapbox.bounds = [ points[0][1], points[0][0], points[0][1], points[0][0] ];
                mapbox.interval = (points.length <= mapbox.options.steps) ? points.length : Math.ceil(points.length / mapbox.options.steps);

                for ( let i = 0; i < points.length; i += mapbox.interval ) {

                    mapbox.points.push([points[i][1], points[i][0]]);

                    mapbox.center[0] += points[i][1]; // latitude
                    mapbox.center[1] += points[i][0]; // longitude

                    mapbox.bounds[0] = Math.max(mapbox.bounds[0], points[i][1]);
                    mapbox.bounds[1] = Math.max(mapbox.bounds[1], points[i][0]);
                    mapbox.bounds[2] = Math.min(mapbox.bounds[2], points[i][1]);
                    mapbox.bounds[3] = Math.min(mapbox.bounds[3], points[i][0]);
                }

                mapbox.center[0] = parseFloat((mapbox.center[0] / mapbox.points.length).toFixed(4));
                mapbox.center[1] = parseFloat((mapbox.center[1] / mapbox.points.length).toFixed(4));

                mapbox.size = [
                    Math.abs(mapbox.bounds[1] - mapbox.bounds[3]), // width (lng)
                    Math.abs(mapbox.bounds[0] - mapbox.bounds[2])  // height (lat)
                ];
                mapbox.start = mapbox.points[0];
                mapbox.finish = mapbox.points[(mapbox.points.length - 1)];

                let _offsetH = Math.max(mapbox.size[0], mapbox.size[1]) / 12; // Horizontal
                let _offsetT = Math.max(mapbox.size[0], mapbox.size[1]) / 3;  // Top
                let _offsetB = Math.max(mapbox.size[0], mapbox.size[1]) / 2;  // Bottom
                let _bounds = [
                    [mapbox.bounds[0] + _offsetT, mapbox.bounds[1] + _offsetH],
                    [mapbox.bounds[0], mapbox.bounds[1]],
                    [mapbox.bounds[2], mapbox.bounds[3]],
                    [mapbox.bounds[2] - _offsetB, mapbox.bounds[3] - _offsetH],
                ];

                // Initialize the overlay string
                mapbox.options.overlay = '';
                mapbox.options.overlay += `path-1+343432-0(${urlencode(polyline.encode(_bounds))})`; // path-1+343432-0
                mapbox.options.overlay += `,pin-l-marker+387edf(${mapbox.start[1]},${mapbox.start[0]})`;
                mapbox.options.overlay += `,pin-l-marker+387edf(${mapbox.finish[1]},${mapbox.finish[0]})`;
                mapbox.options.overlay += `,path-5+286ecf-1(${urlencode(polyline.encode(mapbox.points))})`;

            }
            else if (mapbox.options.boundSource === 'markers') {
                // Use provided markers to calculate bounds, center, and offsets
                const markerCoordinates = [
                    // Sample Coordinates
                    // Latitude: 47.4235° N Longitude: -121.5467° W
                    [49.1967, -123.1815], // Vancouver International Airport (YVR)
                    [49.0847, -121.4223], // Lindeman Lake, British Columbia, Canada
                    [49.0, -122.0], // Matsqui Trail Regional Park, Abbotsford, British Columbia, Canada
                    [49.3665, -122.3946], // Golden Ears Provincial Park, British Columbia, Canada
                    [49.3439, -123.0185], // Lynn Canyon Park, British Columbia, Canada
                    [49.5075, -123.2324], // Tunnel Bluffs Hike, British Columbia, Canada
                    [49.3439, -123.0185], // Lynn Canyon Park, British Columbia, Canada
                    [49.2421, -122.9939], // Burnaby
                    // [latitude, longitude]  // Replace longitude, latitude with your actual coordinates
                ];
                const AbbotsfordCoordinates = [
                [49.0514, -122.3578],
                ];
                // Reset bounds and center
                let [minLat, minLng] = markerCoordinates[0];
                let [maxLat, maxLng] = markerCoordinates[0];

                // Calculate bounds based on marker coordinates
                markerCoordinates.forEach(coord => {
                    minLat = Math.min(minLat, coord[0]);
                    maxLat = Math.max(maxLat, coord[0]);
                    minLng = Math.min(minLng, coord[1]);
                    maxLng = Math.max(maxLng, coord[1]);
                });

                // Calculate center
                const centerLat = (minLat + maxLat) / 2;
                const centerLng = (minLng + maxLng) / 2;
                console.log('Mapbox Center Longitude:', centerLng);

                // Set bounds
                mapbox.bounds = [maxLat, maxLng, minLat, minLng];
                mapbox.center = [centerLat, centerLng];
                console.log('Mapbox Center Coordinates:', mapbox.center);

                mapbox.size = [
                    Math.abs(mapbox.bounds[1] - mapbox.bounds[3]), // width (lng)
                    Math.abs(mapbox.bounds[0] - mapbox.bounds[2])  // height (lat)
                ];

                // Set offsets (adjust as needed)
                let _offsetH = 0.5 + (Math.max(mapbox.size[0], mapbox.size[1]) / 100); // Horizontal
                let _offsetT = Math.max(mapbox.size[0], mapbox.size[1]) / 20;  // Top
                let _offsetB = Math.max(mapbox.size[0], mapbox.size[1]) / 10;  // Bottom

                let _bounds = [
                    [mapbox.bounds[0] + _offsetT, mapbox.bounds[1] + _offsetH],
                    [mapbox.bounds[0], mapbox.bounds[1]],
                    [mapbox.bounds[2], mapbox.bounds[3]],
                    [mapbox.bounds[2] - _offsetB, mapbox.bounds[3] - _offsetH],
                ];
                console.log('Mapbox Center Longitude:', _bounds);

                mapbox.options.overlay = '';
                mapbox.options.overlay += `path-1+343432-0(${urlencode(polyline.encode(_bounds))})`; // 
                mapbox.options.overlay += `,pin-s-heart+ff0000(${AbbotsfordCoordinates[0][1]},${AbbotsfordCoordinates[0][0]})`;
                // Iterate over the markerCoordinates array to construct the overlay string
                markerCoordinates.forEach(coord => {
                // Append each coordinate to the overlay string
                mapbox.options.overlay += `,pin-s-marker+387edf(${coord[1]},${coord[0]})`;
            });

            }

            let _urlMapbox = `${mapbox.options.endpoint}${mapbox.options.username}/${mapbox.options.style_id}/static/${mapbox.options.overlay}/${mapbox.options.location}/${mapbox.options.width}x${mapbox.options.height}@2x`;
                _urlMapbox += `?logo=false&attribution=false&access_token=${mapbox.options.token}`;

            _output = _urlMapbox;
            break;

        default:
            _output = false;
            break;
    }

    _output = _output || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    let _imageMap = new Image();
        _imageMap.src = _output;
        _imageMap.crossOrigin = "Anonymous";
        _imageMap.onload = function() {

            let _w = _imageMap.width;
            let _h = _imageMap.height;

            let _el = document.createElement('canvas');
                _el.width = _w;
                _el.height = _h;
            let _ctx = _el.getContext('2d');
                _ctx.drawImage(_imageMap, 0, 0, _w, _h);

            let _ctxData = _ctx.getImageData(0, 0, _w, _h);
            callback(_ctxData);
        }

}

export default createMap;
