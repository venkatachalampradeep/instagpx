const Config = {
    title : 'InstaGPX · Add GPX activity stats to your photos',
    description : 'Create beautiful sharing pictures adding activity stats from a GPX file to your photos with InstaGPX',
    url : 'https://instagpx.com',
    timestampTemplates : [
        '{dddd}, {DD}.{Mo}.{YYYY} @{H}:{mm}',
        '{dddd}, {DD} {MMMM} {YYYY} · {h}:{mm}{a}',
        '{dddd}, {MMMM} {DD}, {YYYY} · {h}:{mm}{a}',
        '{DD}.{Mo}.{YYYY} · {H}:{mm}',
        '{Mo}.{DD}.{YYYY} · {H}:{mm}',
        '{Do} {MMMM} {YYYY}',
        '{DD} {MMMM} {YYYY}',
        '{DD} {MM} {YYYY} · {h}:{mm}{a}',
        '{MMMM} {Do}, {YYYY}',
        '{MMMM} {DD}, {YYYY}'
    ],
    imageModes: {
        '1:1' : { width: 1280, height: 1280, name: '1:1  Square'    },
        '2:3' : { width: 1080, height: 1620, name: '2:3  Portrait'  },
        '5:7' : { width: 1080, height: 1512, name: '5:7  Portrait'  },
        '3:4' : { width: 1080, height: 1440, name: '3:4  Portrait'  },
        '4:5' : { width: 1080, height: 1350, name: '4:5  Portrait'  },
        '9:16': { width: 1080, height: 1920, name: '9:16 Portrait'  },
        '16:9': { width: 1920, height: 1080, name: '16:9 Landscape' },
        '1:2' : { width: 1080, height: 2160, name: '1:2  Landscape' }
    }
}

const Data = {
    gpxLoaded: false,
    gpxFile: null,
    gpx: {},

    imageLoaded: false,
    imageFile: null,
    image: {},

    imageMapLoaded: false,
    imageMap: {},

    imageSourceMap: true, // true: map, false: input image

    outputRatioModes: Config.imageModes,
    dateTemplates: Config.timestampTemplates,
    options: { // Image default options
        mode: '16:9',
        padding: 60,
        activity: 'ride', // ride || run
        units: 'metric',  // metric || imperial
        show: 'speed',    // elevation || speed
        wordSpacing: 10,
        title: '',
        timestampPattern: 0,
        promote: true,
        graph: false,     // Elevation graph
        showText: true   // Toggle text display
    },
    mapboxOptions: {
        steps: 1000,
        zoomFactor: 1, // Default zoom factor (1 means no zoom, <1 zoom in, >1 zoom out)
        boundSource: 'gpsData', //markers ; gpsData
        hardcodeBounds: false,
        overlayPathColor: 'BA55D3' // Medium Orchid
        // overlayPathColor: '6A0DAD' // Bright Purple
        // overlayPathColor: 'FF4500' // Orange Red
        // overlayPathColor: '32CD32' // Lime Green
        // overlayPathColor: 'FFD700' // Gold
        // overlayPathColor: '1E90FF' // Dodger Blue
        // overlayPathColor: 'DA70D6' // Orchid
        // overlayPathColor: 'FF6347' // Tomato
        // overlayPathColor: '7FFF00' // Chartreuse
    },
    modalVisible: false,
};

export { Config, Data };
