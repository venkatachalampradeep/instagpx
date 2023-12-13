const Config = {
    title : 'InstaGPX · Add GPX activity stats to your photos',
    description : 'Create beautiful sharing pictures adding activity stats from a GPX file to your photos with InstaGPX',
    url : 'https://instagpx.com',
    timestampTemplates : [
        '{Mo}.{DD}.{YYYY}',
    ],
    imageModes : {
       '9:16' : { width : 1080, height : 1920, name : 'Portrait Narrow 9:16' },
    }
}

const Data = {
    gpxLoaded : false,
    gpxFile : null,
    gpx : {},

    imageLoaded : false,
    imageFile : null,
    image : {},

    imageMapLoaded : false,
    imageMap : {},

    imageSourceMap : true, // true : map, false : input image

    outputRatioModes : Config.imageModes,
    dateTemplates : Config.timestampTemplates,
    options : { // Image default options
        mode : '9:16',
        padding: 60, // 80?
        activity : 'hike', // hike || run
        units : 'metric', // metric || imperial
        show : 'elevation', // elevation || speed
        wordSpacing : 10, // 10?
        title : '',
        timestampPattern : 0,
        promote : true,
        graph : true // Elevation graph
    },

    modalVisible : false,

    // Computed :
    // - userDataLoaded
    // - outputSize { width , height }
}

export { Config, Data };
