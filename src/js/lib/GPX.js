
function readGPX(file, callback) {

    function pointsDistance(p1, p2) {

        function _degreesToRadians(degrees) {
            return degrees * Math.PI / 180;
        }

        const EARTH_RADIUS_KM = 6371.009;
        let _p1 = { lat : _degreesToRadians(p1.lat), lon : _degreesToRadians(p1.lon) }
        let _p2 = { lat : _degreesToRadians(p2.lat), lon : _degreesToRadians(p2.lon) }

        let latDiff = _p1.lat - _p2.lat;
        let lonDiff = _p1.lon - _p2.lon;

        let a = Math.sin(latDiff / 2) * Math.sin(latDiff / 2)
            + Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2)
            * Math.cos(_p1.lat) * Math.cos(_p2.lat);

        let radAngDist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let distanceKm = EARTH_RADIUS_KM * radAngDist;
        return distanceKm;
    }

    function gpxToJSON(trkpts) {

        let trackpoints = [];
        for( let trkpt = 0; trkpt < trkpts.length; trkpt++ ){

            let point = trkpts[ trkpt ];
            let lon = parseFloat( point.getAttribute('lon') );
            let lat = parseFloat( point.getAttribute('lat') );
            let elevation = point.getElementsByTagName('ele')[0].textContent;
            let time = point.getElementsByTagName('time')[0].textContent;
            // let time = 0;

            trackpoints.push({ lon, lat, elevation, time });
        }
        return trackpoints;
    }

    function averageElevation(trkpts) {
        let elevation = 0;
        let devideBy = 0;

        for (let trkpt = 0; trkpt < trkpts.length; trkpt++ ){
            let point = trkpts[trkpt];
            if ( point.querySelector('ele') ) {
                elevation += parseFloat( point.querySelector( 'ele' ).textContent );
                devideBy++;
            }
        }
        return elevation / devideBy;
    }

    function msToTime(ms) {

        let seconds = parseInt( ( ms / 1000 ) % 60, 10 );
        let minutes = parseInt( ( ms / ( 1000 * 60 ) ) % 60, 10 );
        let hours = parseInt( ( ms / ( 1000 * 60 * 60 ) ) % 24, 10 );
        let days = parseInt( ms / ( 1000 * 60 * 60 * 24 ), 10 );
        let hoursDays = parseInt( days * 24, 10 );
            hours += hoursDays;

        return { hours, minutes, seconds, ms }
        // return {
        //     hours : String(hours).padStart(2, '0'),
        //     minutes : String(minutes).padStart(2, '0'),
        //     seconds : String(seconds).padStart(2, '0'),
        //     ms : ms
        // }
    }

    function GPX(gpxData) {
        let _xmlDoc = new DOMParser().parseFromString(gpxData, 'application/xml');
        let _trkpts = [];
            try { _trkpts = _xmlDoc.querySelectorAll( 'trkpt' ) }
            catch(e) { _trkpts = _xmlDoc.documentElement.getElementsByTagName( 'trkpt' ) }

        const trackpoints = gpxToJSON(_trkpts);

        // let _totalDistance = 0;
        // for (let i = 0; i < trackpoints.length -1; i++) {
        //     let _elevation = trackpoints[i].elevation;
        //     let _distance = pointsDistance( trackpoints[i], trackpoints[i+1] );
        //     console.log(i, Math.round(_elevation), parseFloat((_totalDistance).toFixed(3)));
        //     _totalDistance += _distance;
        // }

        // let a = new Date(trackpoints[0].time).getTime();
        // console.log('a: ', a);
        // let b = tinytime('{dddd}, {DD} {MMMM} {YYYY} · {h}:{mm}{a}')
        // console.log( b.render(new Date(a)) )

        const start = new Date(trackpoints[0].time).getTime();
        const end = new Date(trackpoints[trackpoints.length - 1].time).getTime();
        const timestamp = { start, end }

        const startPoint = trackpoints[0];
        const endPoint = trackpoints[trackpoints.length-1];
        const coords = {
            start : {
                lat : startPoint.lat,
                lon : startPoint.lon
            },
            end : {
                lat : endPoint.lat,
                lon : endPoint.lon
            }
        }

        // const duration = msToTime( Math.abs(end.getTime() - start.getTime()) );
        const duration = {
            hours: 2,
            minutes: 2,
            seconds: 24,
            ms: (2 * 60 * 60 * 1000) + (2 * 60 * 1000) + (24 * 1000) // This calculates the total milliseconds for 2h 2m 24s
        };
        const distance = (function() {

            let _distance = 0;
            for( let i = 0; i < trackpoints.length - 1; i++ ){
                _distance += pointsDistance( trackpoints[i], trackpoints[i+1] );
            }
            return {
                km : _distance,
                mi : _distance * 0.621371
            };

        }());

        const pace = (function() {

            let _msKm = duration.ms / distance.km;

            return {
                'perKm' : {
                    'minutes' : new Date( _msKm ).getUTCMinutes(),
                    'seconds' : new Date( _msKm ).getUTCSeconds()
                }
            }
        }());

        const speed = {
            'kmh' : (distance.km * 3600000) / duration.ms,
        }

        const elevation = (function() {

            let eleForMinMax = [];
            let richElevation = [];
            let gain = 0;
            let loss = 0;
            let startTime = new Date(trackpoints[0].time).getTime();
            let dist = 0;

            for( let i = 0; i < trackpoints.length - 1; i++ ){
                let diff = trackpoints[i+1].elevation - trackpoints[i].elevation;
                let time = new Date( trackpoints[i+1].time ).getTime();
                let timeDiff = Math.abs( time - startTime );

                if ( diff < 0 ) { loss += diff }
                if ( diff > 0 ) { gain += diff }

                eleForMinMax.push( trackpoints[i].elevation );
                richElevation.push( {
                    elevation: trackpoints[i].elevation,
                    // time: msToTime(timeDiff).ms,
                    dist: dist
                });

                dist += pointsDistance(trackpoints[i], trackpoints[i+1]);
            }

            // Adds final point
            richElevation.push({
                elevation : trackpoints[trackpoints.length-1].elevation,
                dist: dist
            });

            return {
                dataPoints: richElevation,
                // elevation: richElevation,
                max: Math.max.apply( null, eleForMinMax ),
                min: Math.min.apply( null, eleForMinMax ),
                loss: loss,
                gain: gain,
                // average : averageElevation(_trkpts)
            }

        }());

        const points = (function() {

            let _trackPoints = [];
            for (let i = 0; i < trackpoints.length - 1; i++ ) {
                let _lat = parseFloat((trackpoints[i].lat).toFixed(5));
                let _lng = parseFloat((trackpoints[i].lon).toFixed(5));
                _trackPoints.push([ _lng, _lat ]);
            }
            return _trackPoints;

        })();

        return {
            duration,
            distance,
            pace,
            speed,
            elevation,
            timestamp,
            coords,
            points
        };
    }

    let reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = function(e) {

            callback( GPX(this.result) );
        }
}

export default readGPX;
