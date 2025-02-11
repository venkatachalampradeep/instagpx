import tinytime from 'tinytime';
import { Config, Data } from '../config.js';
import Styles from './InstaGPX.styles.js';


CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {

    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;

    this.beginPath();
        this.moveTo(x+r, y);
        this.arcTo(x+w, y,   x+w, y+h, r);
        this.arcTo(x+w, y+h, x,   y+h, r);
        this.arcTo(x,   y+h, x,   y,   r);
        this.arcTo(x,   y,   x+w, y,   r);
    this.closePath();
    return this;
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    let words = text.split(' ');
    let line = '';

    for(let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = context.measureText(testLine);
        let testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}

function plotElevationGraph(context, x, y, w, h, elevation, distance) {

    function map(value, start1, stop1, start2, stop2) {
        return ((value - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
    }

    function clamp(num, min, max) {
        return num <= min ? min : num >= max ? max : num;
    }

    function mapIntInclusive (value, start1, stop1, start2, stop2) {
        let stop2b = stop2 + 1;
        let v = Math.floor(map(value, start1, stop1, start2, stop2b));
        return clamp(v, start2, stop2);
    }

    let _altitudeDiff = (elevation.max - elevation.min);
    let _altitudeFactor = clamp(_altitudeDiff, 0, 1000);
        _altitudeFactor = map(_altitudeFactor, 0, 1000, 0, h);

    let _altitudeFactorRest = h - _altitudeFactor;
    let _altitudeYOffset = (80*_altitudeFactorRest)/100; // 80:20

    // Vertical guidelines : xAxis
    let _blockKms = Math.ceil(Math.ceil((distance.km)/10));
    let _blockKmsSize = (_blockKms*w)/distance.km;

    // Horizontal guidelines : yAxis
    let _altitudeAxisNum = mapIntInclusive(_altitudeFactor, 0, h, 1, 6)

    // Remove Blur
    context.shadowBlur = 0;

    // Clip
    context.roundRect(x, y, w, h, 10);
    context.clip();

    // Background
    context.fillStyle = 'rgba(255, 255, 255, .05)';
    context.fillRect(x, y, w, h);

    // xAxis
    context.strokeStyle = 'rgba(255, 255, 255, .1)';
    context.lineWidth = 2;

    let xAxisCounter = x;
    while (xAxisCounter < x+w) {
        xAxisCounter += _blockKmsSize;
        context.beginPath();
        context.moveTo(xAxisCounter, y);
        context.lineTo(xAxisCounter, y+h);
        context.stroke();
    }

    // yAxis
    for (let i = 1; i < _altitudeAxisNum; i++) {
        context.beginPath();
            context.moveTo(x, (h/_altitudeAxisNum)*i + y);
            context.lineTo(x+w, (h/_altitudeAxisNum)*i + y);
        context.stroke();
    }


    // Profile
    context.beginPath();
    context.moveTo( x-10, y+h+10);
    elevation.dataPoints.forEach((el, i, arr) => {
        if (i == 0) { context.lineTo( x-10, map(el.elevation, elevation.min, elevation.max, _altitudeFactor, 0) + y + _altitudeYOffset ) }
        context.lineTo(
            map(el.dist, 0, distance.km, 0, w) + x,
            map(el.elevation, elevation.min, elevation.max, _altitudeFactor, 0) + y + _altitudeYOffset
        )
        if (i == arr.length-1) { context.lineTo( x+w+10, map(el.elevation, elevation.min, elevation.max, _altitudeFactor, 0) + y + _altitudeYOffset ) }
    });
    context.lineTo( x+w+10, y+h+10 )
    context.closePath();

    context.strokeStyle = 'rgba(255, 255, 255, 1)';
    context.lineWidth = 4;
    context.stroke();

    context.fillStyle = 'rgba(255, 255, 255, .25)';
    context.fill();

}

function instaGPX(gpxData, imgData, outputSize) {

    const config = {...Config, ...Data.options }

    let _duration = [ // Default (<1h)
        {v: String(gpxData.duration.minutes).padStart(2, '0'), u: 'm'},
        {v: String(gpxData.duration.seconds).padStart(2, '0'), u: 's'}
    ];
    if (gpxData.duration.hours > 0) { // Overwrite if more than 1hour activity time
        _duration = (gpxData.duration.hours > 9)
            ? [
                { v: String(gpxData.duration.hours), u: 'h'},
                { v: String(gpxData.duration.minutes).padStart(2, '0'), u: 'm' }
            ]
            : [
                { v: String(gpxData.duration.hours), u: 'h'},
                { v: String(gpxData.duration.minutes).padStart(2, '0') + '\'' + String(gpxData.duration.seconds).padStart(2, '0') + '"', u: false }
            ];
    }

    let _pace = gpxData.pace[(config.units == 'metric') ? 'perKm' : 'perMile'];

    let output = {
        distance : ((config.units == 'metric') ? gpxData.distance.km : gpxData.distance.mi).toFixed(2),
        distanceUnit : (config.units == 'metric') ? 'km' : 'mi',
        duration : _duration,
        elevation : Math.round(gpxData.elevation.gain),
        speed : (config.units == 'metric') ? (gpxData.speed.kmh).toFixed(1) : (gpxData.speed.mih).toFixed(1),
        pace : _pace.minutes +'\''+ String(_pace.seconds).padStart(2, '0'),
        optionLabel : 'elevation'
    }

    let _canvas = document.createElement('canvas')
        _canvas.width = outputSize.width;
        _canvas.height = outputSize.height;

    let ctx = _canvas.getContext('2d');

            let _srcCanvas = document.createElement('canvas');
                _srcCanvas.width = imgData.width;
                _srcCanvas.height = imgData.height;
            let _srcctx = _srcCanvas.getContext('2d');
                _srcctx.putImageData(imgData, 0, 0);

                let _outputRatio = (outputSize.width / outputSize.height);
                let _imgRatio = (imgData.width / imgData.height);

                let _w = imgData.width;
                let _h = imgData.height;
                let _x = 0;
                let _y = 0;

            ctx.drawImage(_srcCanvas,
                _x, _y, _w, _h,
                0, 0, outputSize.width, outputSize.height
            );

        // ---
        ctx.globalCompositeOperation = 'multiply';

        // ---
        // Hide top shadow if nothing on top
        if ( !!config.promote || config.timestampPattern !== 'false' || !!(config.title).trim().replace(/\s\s+/g, ' ') ) {

            let grdTopSize = outputSize.height/4;
            let grdTop = ctx.createLinearGradient(0, 0, 0, grdTopSize);
                grdTop.addColorStop(0.0, "rgba(0, 0, 0, 0.50)");
                grdTop.addColorStop(1.0, "rgba(0, 0, 0, 0.00)");

                ctx.fillStyle = grdTop;
                ctx.fillRect(0, 0, outputSize.width, grdTopSize);
        }

        let grdBottomSize = outputSize.height/4;
        let grdBottom = ctx.createLinearGradient(0, outputSize.height - grdBottomSize, 0, outputSize.height);
            grdBottom.addColorStop(0.0, "rgba(0, 0, 0, 0.00)");
            grdBottom.addColorStop(1.0, "rgba(0, 0, 0, 0.50)");

            ctx.fillStyle = grdBottom;
            ctx.fillRect(0, outputSize.height - grdBottomSize, outputSize.width, grdBottomSize);

        ctx.globalCompositeOperation = 'source-over';
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 4;

        let _third = Math.round((outputSize.width - (config.padding*4))/3)
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.textBaseline = 'alphabetic';



        const txtSize = {}

        // ----------------
        // Duration calculate size

        txtSize.duration = [];
        output.duration.forEach((el, i) => {

            // ctx.font = '72px Montserrat';
            ctx.font = '64px Montserrat';
            let _vSize = ctx.measureText(el.v).width;
            ctx.font = '36px Montserrat';
            let _uSize = (el.u) ? ctx.measureText(el.u).width : 0;

            txtSize.duration.push({v : _vSize, u : _uSize});
        })

        // ----------------
        // Values output
        let _labelOffsetY = 80;
        if (config.showText) {
        ctx.font = '64px Montserrat';
            ctx.fillText(output.distance, config.padding, outputSize.height - config.padding);
                
        txtSize.distance = ctx.measureText(output.distance).width;

        let _xDurationOffset = 0;
        output.duration.forEach((el, i) => {
            ctx.fillText(el.v, config.padding*2 + _third + _xDurationOffset, outputSize.height - config.padding);
            _xDurationOffset += txtSize.duration[i].v + txtSize.duration[i].u + (config.wordSpacing*2);
        })
        
        let optionUnitsWidths = ctx.measureText(output[output.optionLabel]).width + ctx.measureText('m').width - 5;
        let optionUnitsXs = outputSize.width - config.padding - optionUnitsWidths;

        ctx.fillText(output[output.optionLabel], optionUnitsXs, outputSize.height - config.padding);
        txtSize.option = ctx.measureText(output[output.optionLabel]).width;
        // ----------------
        // Def
        ctx.fillStyle = "rgba(255, 255, 255, .5)";
        ctx.font = '36px Montserrat';
        // Assume optionUnitsX and optionUnitsWidth are already calculated as in previous steps
        let distanceFieldX = optionUnitsX - txtSize.distance - config.wordSpacing;  // X-coordinate for distance field
            
        // Set fill style and font for distance unit
        ctx.fillStyle = "rgba(255, 255, 255, .5)";
        ctx.font = '36px Montserrat';
            
        // Draw the distance unit
        ctx.fillText(output.distanceUnit, distanceFieldX, outputSize.height - config.padding);
            
        // Calculate the starting x-coordinate for duration units
        let durationStartX = distanceFieldX - config.wordSpacing;  // Adjust this as needed
            
        // Draw each duration unit
        output.duration.forEach((el, i) => {
            if (el.u) {
                // Adjust x-coordinate based on the width of each duration unit
                durationStartX -= (txtSize.duration[i].u + config.wordSpacing);
                ctx.fillText(el.u, durationStartX, outputSize.height - config.padding);
            }
        });

        ctx.fillText(output.distanceUnit, config.padding + txtSize.distance + config.wordSpacing, outputSize.height - config.padding);

        _xDurationOffset = 0; // Reset
        output.duration.forEach((el, i) => {
            _xDurationOffset += txtSize.duration[i].v + config.wordSpacing;
            if ( el.u ) { ctx.fillText(el.u, config.padding*2 + _third + _xDurationOffset, outputSize.height - config.padding) }
            _xDurationOffset += config.wordSpacing + txtSize.duration[i].u;
        })

        let _optionUnits = 'm'
        // Measure _optionUnits text width
        let optionUnitsWidth = ctx.measureText(_optionUnits).width;
            
        // Calculate right-aligned x position
        let optionUnitsX = outputSize.width - config.padding - optionUnitsWidth;
            
        // Draw the _optionUnits
        ctx.fillText(_optionUnits, optionUnitsX, outputSize.height - config.padding);

        // ----------------
        // Labels
        ctx.font = '24px Montserrat';
        ctx.fillText('DISTANCE', config.padding, outputSize.height - config.padding - _labelOffsetY);
        ctx.fillText('ACTIVITY TIME', config.padding*2 + _third, outputSize.height - config.padding - _labelOffsetY);

        let optionLabelWidth = ctx.measureText(output.optionLabel.toUpperCase()).width;

        // Calculate right-aligned x position
        let optionLabelX = outputSize.width - config.padding - optionLabelWidth;

        // Draw the optionLabel
        ctx.fillText(output.optionLabel.toUpperCase(), optionLabelX, 
                    outputSize.height - config.padding - _labelOffsetY);
        }

        ctx.textBaseline = 'hanging';

        let _tpl = Config.timestampTemplates[config.timestampPattern];
        let _datetime = null;
        if (!!_tpl) {
            let _timestamp = tinytime(_tpl, { padMonth : true, padDays : true, padHours: true });
                _datetime = _timestamp.render(new Date(gpxData.timestamp.start));
                _datetime = _datetime.toUpperCase()
        }
        let _top = [];

        if (!!_datetime) {
            _top.push(_datetime)
        }
        if (config.showText) {        
        ctx.fillText(_top.join(' / '), config.padding, config.padding);
        }
        // ----------------
        // Title
        ctx.fillStyle = "#fff";
        ctx.font = '52px Montserrat';
        let _titleOffset = (_top.length) ? 42 : 0;
        wrapText(ctx, (config.title).toUpperCase().trim().replace(/\s\s+/g, ' '), config.padding, config.padding + _titleOffset, outputSize.width - (config.padding*2), 58);

        // ----------------
        // Plot elevation graph
        if (config.graph) {
            plotElevationGraph(
                ctx,
                config.padding,
                outputSize.height - config.padding - (_labelOffsetY + 50) - (outputSize.height/6),
                outputSize.width - (config.padding*2),
                (outputSize.height/6),
                gpxData.elevation,
                gpxData.distance
            );
        }

        // ----------------
        // Render
        document.querySelector('#output').innerHTML = '';

        _canvas.toBlob(function(blob) {

            let _output = new File([blob], 'hello.com.jpg', { type : 'image/jpeg', lastModified: Date.now() });
            let objectURL = URL.createObjectURL(_output);

            let _img = document.createElement('img');
                _img.src = objectURL;
                _img.onload = function() {}
                _img.addEventListener('contextmenu', (e) => { e.preventDefault() }, true);

            document.querySelector('#output').appendChild(_img);
            document.querySelector('#download-img').href = objectURL;
        }, 'image/jpeg', .65);
}

export default instaGPX;
