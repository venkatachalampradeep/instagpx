import polyline from '@mapbox/polyline';
import urlencode from 'urlencode';
import {Data} from '../config.js';

function createMap(points, size, callback) {

    let _output = '';
    const mapbox = {
        interval: 0,
        points: [],
        center: [0, 0],
        bounds: [0, 0, 0, 0], // maxLat, maxLng, minLat, minLng
        size: [0, 0], // width (lng), height (lat)
        start: null,
        finish: null,

    options: {
        endpoint: 'https://api.mapbox.com/styles/v1/',
        username: 'pradeep-venkatachalam',
        style_id: 'cly8oux6f00hx01pm49p6ds5n',
        width: size.width / 2,
        height: size.height / 2,
        overlay: '',
        location: 'auto',
        steps: Data.mapboxOptions.steps,
        boundSource: Data.mapboxOptions.boundSource,
        overlayPathColor: Data.mapboxOptions.overlayPathColor,
        zoomFactor: Data.mapboxOptions.zoomFactor,
        hardcodeBounds: Data.mapboxOptions.zoomFactor,
        token: 'pk.eyJ1IjoicHJhZGVlcC12ZW5rYXRhY2hhbGFtIiwiYSI6ImNseTZ4cGM0OTAwNHYyanM5cmgxa3A5aGwifQ.Hudkk5q4qTN13LSdxsdVXw'
    }
};

const calculateBoundsAndCenter = (coords) => {
    let [minLat, minLng] = coords[0];
    let [maxLat, maxLng] = coords[0];

    coords.forEach(([lat, lng]) => {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    return { bounds: [maxLat, maxLng, minLat, minLng], center: [centerLat, centerLng] };
};

const calculateSizeAndOffsets = (bounds, zoomFactor) => {
    const size = [
        Math.abs(bounds[1] - bounds[3]), // width (lng)
        Math.abs(bounds[0] - bounds[2])  // height (lat)
    ];

    const maxSize = Math.max(size[0], size[1]);
    const offsets = {
        horizontal: (maxSize / 20) * zoomFactor, // Reduced Horizontal Offset
        top: (maxSize / 10) * zoomFactor,  // Reduced Top Offset
        bottom: (maxSize / 20) * zoomFactor  // Reduced Bottom Offset
    };

    return { size, offsets };
};

const buildMapboxUrl = (mapbox) => {
    const { endpoint, username, style_id, overlay, location, width, height, token } = mapbox.options;
    let url = `${endpoint}${username}/${style_id}/static/${overlay}/${location}/${width}x${height}@2x`;
    url += `?logo=false&attribution=false&access_token=${token}`;
    return url;
};

const handleImageLoad = (imageUrl, callback) => {
    const image = new Image();
    image.src = imageUrl;
    image.crossOrigin = "Anonymous";
    image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, image.width, image.height);
        const ctxData = ctx.getImageData(0, 0, image.width, image.height);
        callback(ctxData);
    };
};

    if (mapbox.options.boundSource === 'gpsData') {
        // Use GPS data to calculate bounds, center, and offsets
        // Your existing logic for GPS data processing
        mapbox.bounds = [points[0][1], points[0][0], points[0][1], points[0][0]];
        mapbox.interval = (points.length <= mapbox.options.steps) ? points.length : Math.ceil(points.length / mapbox.options.steps);

        points.forEach((point, index) => {
            if (index % mapbox.interval === 0) {
                mapbox.points.push([point[1], point[0]]);
                mapbox.center[0] += point[1];
                mapbox.center[1] += point[0];
                mapbox.bounds[0] = Math.max(mapbox.bounds[0], point[1]);
                mapbox.bounds[1] = Math.max(mapbox.bounds[1], point[0]);
                mapbox.bounds[2] = Math.min(mapbox.bounds[2], point[1]);
                mapbox.bounds[3] = Math.min(mapbox.bounds[3], point[0]);
            }
        });

        mapbox.center[0] = parseFloat((mapbox.center[0] / mapbox.points.length).toFixed(4));
        mapbox.center[1] = parseFloat((mapbox.center[1] / mapbox.points.length).toFixed(4));

        if (mapbox.options.hardcodeBounds) {
            const hardcodedBounds = [52.989203, 4.223006, 50.672760, 6.680855]; // [maxLat, maxLng, minLat, minLng]
                                 //  52N,4E (top-right),   50N, 6E (top-left)
            const hardcodedCenter = [(hardcodedBounds[0] + hardcodedBounds[2]) / 2, (hardcodedBounds[1] + hardcodedBounds[3]) / 2];

            mapbox.bounds = hardcodedBounds;
            mapbox.center = hardcodedCenter;
        }

        const { size, offsets } = calculateSizeAndOffsets(mapbox.bounds, mapbox.options.zoomFactor);

        mapbox.size = size;
        mapbox.start = mapbox.points[0];
        mapbox.finish = mapbox.points[mapbox.points.length - 1];

        const _bounds = [
            [mapbox.bounds[0] + offsets.top, mapbox.bounds[1] + offsets.horizontal],
            [mapbox.bounds[0], mapbox.bounds[1]],
            [mapbox.bounds[2], mapbox.bounds[3]],
            [mapbox.bounds[2] - offsets.bottom, mapbox.bounds[3] - offsets.horizontal],
        ];

        // Initialize the overlay string
        mapbox.options.overlay += `path-0+343432-5(${urlencode(polyline.encode(_bounds))})`;
        mapbox.options.overlay += `,path-2+BA55D3-5(${urlencode(polyline.encode(mapbox.points))})`; // Medium Orchid
    }

    else if (mapbox.options.boundSource === 'markers') {
        const markerCoordinates = [
            [41.3275, 19.8187], // Tirana
            [42.0683, 19.5126], // Shkoder
            [42.4610, 19.8778], // Valbona
            [42.4247, 18.7712], // Kotor
        ];

        const { bounds, center } = calculateBoundsAndCenter(markerCoordinates);
        const { size, offsets } = calculateSizeAndOffsets(bounds, mapbox.options.zoomFactor);

        mapbox.bounds = bounds;
        mapbox.center = center;
        mapbox.size = size;

        const _bounds = [
            [bounds[0] + offsets.top, bounds[1] + offsets.horizontal],
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]],
            [bounds[2] - offsets.bottom, bounds[3] - offsets.horizontal],
        ];

        mapbox.size = [
            Math.abs(mapbox.bounds[1] - mapbox.bounds[3]), // width (lng)
            Math.abs(mapbox.bounds[0] - mapbox.bounds[2])  // height (lat)
        ];

        mapbox.options.overlay = `path-0+343432-0(${urlencode(polyline.encode(_bounds))})`;
        markerCoordinates.forEach(coord => {
            mapbox.options.overlay += `,pin-s-marker+387edf(${coord[1]},${coord[0]})`;
        });
    }

    const url = buildMapboxUrl(mapbox);
    handleImageLoad(url, callback);
}
export default createMap;
