<template>
    <div class="app" :class="{ 'with-modal' : modalVisible }">

        <Header></Header>

        <section role="form">
            <div>
                <h4><span v-if="gpxFile" class="file-ok"></span>GPX</h4>
                <p>
                    <input type="file" accept=".gpx" @change="loadGPX" id="user-file-gpx" />
                    <label v-if="gpxFile" for="user-file-gpx">{{ gpxFile }}</label>
                    <label v-else for="user-file-gpx"><strong>.GPX</strong> file</label>
                </p>
            </div>
            <div>
                <h4><span v-if="imageFile" class="file-ok"></span>Image</h4>
                <p>
                    <input type="file" accept="image/*" @change="loadIMG" id="user-file-image" />
                    <label v-if="imageFile" for="user-file-image">{{ imageFile }}</label>
                    <label v-else for="user-file-image"><strong>Image</strong> file</label>
                </p>
            </div>
        </section>

        <!-- <InstagramFeed></InstagramFeed> -->
        <IntroSlide :hidden="userDataLoaded"></IntroSlide>

        <main role="main" :class="{ visible : userDataLoaded }">
            <figure role="figure">
                <div id="output"></div>
            </figure>

            <aside role="complementary">
                <p><a href="#" download="instagpx.com.jpg" id="download-img" class="button" v-on:click="showModal">Download Image</a></p>

                <form role="form" v-on:submit.prevent>

                    <h3>Options</h3>

                    <p class="form-input-container">
                        <label for="activity-title">Title</label>
                        <input type="text" placeholder="Activity Title" name="activity-title" id="activity-title" maxlength="140" v-model="options.title" />
                    </p>

                    <p class="form-submit-container">
                        <button type="submit" name="activity-regenerate" v-on:click="regenerateImage">Regenerate Image</button>
                    </p>
                </form>
            </aside>
        </main>

        <ModalThanks ref="modal"></ModalThanks>
        <Footer></Footer>

    </div>
</template>

<script>

import tinytime from 'tinytime';
import { Config, Data } from '../config.js';
import { filename, preloadFont, destroyPreloadedFonts } from '../lib/Utils.js';
import readGPX from '../lib/GPX.js';
import createIMG from '../lib/IMG.js';
import createMap from '../lib/Map.js';
import instaGPX from '../lib/InstaGPX.js';
import reverseGeocoding from '../lib/GeoCode.js';
import Header from './Header.vue';
// import InstagramFeed from './InstagramFeed.vue';
import IntroSlide from './IntroSlide.vue';
import Footer from './Footer.vue';
import ModalThanks from './ModalThanks.vue';

const App =  {
    data() {
        return Data;
    },
    name: "App",
    components : {
        Header,
        // InstagramFeed,
        IntroSlide,
        Footer,
        ModalThanks
    },

    filters : {

        renderTimestamp(value, template) {
            let _timestamp = tinytime(template, { padMonth: true, padDays : true, padHours: true });
            return _timestamp.render( new Date(value) );
        }
    },

    computed : {
        userDataLoaded : function() {
            return this.gpxLoaded || (this.gpxLoaded && this.imageLoaded);
        },

        outputSize : function() {
            return {
                'width' : this.outputRatioModes[this.options.mode].width,
                'height' : this.outputRatioModes[this.options.mode].height
            }
        }
    },

    methods : {

        postGPX() {

            let _latStart = this.gpx.coords.start.lat;
            let _lonStart = this.gpx.coords.start.lon;
            let _latEnd = this.gpx.coords.end.lat;
            let _lonEnd = this.gpx.coords.end.lon;
            let _distance = this.gpx.distance.km;
            let _speed = this.gpx.speed.kmh;
            let _act = 'ride';

                if ( _distance <= 12 ) { if (_speed < 14 ) { _act = 'run' } }
                else if ( _distance > 12 && _distance <= 25 ) { if (_speed < 13 ) { _act = 'run' } }
                else if ( _distance > 25 && _distance <= 45 ) { if (_speed < 12 ) { _act = 'run' } }
                else { if (_speed < 8 ) { _act = 'run' } }

            this.options.activity = _act;
            this.options.show = (_act == 'run') ? 'speed' : 'elevation';
            this.options.title = (_latStart).toFixed(6) +', '+ (_lonStart).toFixed(6);

            reverseGeocoding(_latStart, _lonStart, (start) => {

                reverseGeocoding(_latEnd, _lonEnd, (end) => {

                    let _output = '';
                        _output = (start.name != end.name)
                            ? start.name + ' - ' + end.name
                            : start.displayName;

                    Data.options.title = _output;
                    // TODO : callback here
                });
            });

        },

        loadGPX(e) {

            if ( !e.target.files.length ) { return }
            this.gpxFile = filename(e.target.value);

            readGPX(
                e.target.files[0],
                (gpxData) => {
                    Data.gpx = gpxData;
                    Data.gpxLoaded = true;
                    this.postGPX();

                    createMap(gpxData.points, this.outputSize, (imageMapData) => {

                        Data.imageMap = imageMapData
                        Data.imageMapLoaded = true;
                        // instaGPX(this.gpx, imageMapData, this.outputSize);
                        this.generateImage();

                    });
                }
            );
        },

        loadIMG(e) {

            if ( !e.target.files.length ) { return }
            this.imageFile = filename(e.target.value);

            createIMG(
                e.target.files[0],
                (imgData) => {
                    Data.image = imgData;
                    Data.imageLoaded = true;
                    Data.imageSourceMap = false;
                    if (this.userDataLoaded) { this.generateImage(); }
                }
            );
        },

        generateImage() {

            instaGPX(
                this.gpx,
                (this.imageSourceMap)
                    ? this.imageMap
                    : this.image,
                this.outputSize
            );
        },

        regenerateImage() {

            if ( this.imageSourceMap ) {

                createMap(this.gpx.points, this.outputSize, (imageMapData) => {

                    Data.imageMap = imageMapData
                    Data.imageMapLoaded = true;
                    // instaGPX(this.gpx, imageMapData, this.outputSize);
                    this.generateImage();

                });

            } else {

                instaGPX( this.gpx, this.image, this.outputSize );
            }

        },

        showModal() {
            let _modalWindow = this.$refs.modal;
                _modalWindow.showModal();
        },

        // TODO : destroyPreloadedFonts();
    },

    created() {
        preloadFont('Montserrat')
    }
};

export default App;
</script>

<style lang="scss">
@import "./../../scss/_global.scss";
</style>

<style lang="scss" scoped>
@import "./../../scss/_fonts.scss";
@import "./../../scss/_variables.scss";

.app {

    display: flex;
    flex-direction: column;
    min-height: 100%;
    height: 100%;
    overflow: scroll;

    .with-modal { overflow: hidden }

    > section[role="presentation"],
    > main[role="main"] { flex: 1 0 auto }
    > footer { flex: 0 0 auto }

    section[role="form"] {
        flex: 0 0 auto;
        display: flex;
        padding: 1rem 0;
        justify-content: center;
        text-align: center;

        > div {
            padding: 1rem;

            h4 {
                font-size: 80%;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: $color-fg-medium;
                margin: 0 0 1rem;

                .file-ok {

                        &:before {
                            content: '';
                            display: inline-block;
                            vertical-align: top;
                            position: relative;
                            margin: 0 5px 0 0;
                            width: 16px;
                            height: 16px;
                            background-image: url(../../img/ui/icon-check.svg);
                            background-position: center center;
                            background-size: 16px auto;
                            background-repeat: no-repeat;
                        }
                }
            }

            input[type="file"] + label { min-width: 22rem }
        }

        @media #{$tablet} {
            > div input[type="file"] + label { min-width: auto !important }
        }

        @media #{$mobile} {
            padding: 1rem 1.5rem;
            max-width: 100%;
            justify-content: space-between;

            > div {
                width: calc(50% - .5rem);
                padding: 1rem 0;

                input[type="file"] + label {
                    width: 100%;
                    padding: 12px 8px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            }
        }
    }

    main[role="main"] {

        &.visible { display: grid; }
        display: none;
        grid-template-rows: auto; // 512px
        grid-template-columns : 512px auto;
        grid-gap: 3rem;
        grid-template-areas: "image sidebar";

        width: 100%;
        max-width: 84rem;
        margin: 2rem auto 5rem;
        background: #fff;
        padding: 3rem;
        box-shadow: 0 5px 30px -15px rgba(0, 0, 0, .2);

        figure {
            grid-area: image;
        }
        aside {
            grid-area: sidebar;
            display: flex;
            flex-direction: column;
            justify-content: space-between;

            form { padding: 2rem 0 0 0 }
            .button, button { width: 100% }
            a.button { font-weight: bold }
        }

        @media #{$tablet} {
            &.visible { display: block; }
            max-width: 572px;

            figure { margin: 0 0 2rem; }
        }
        @media #{$mobile} {
            padding: 1.5rem 1.5rem 2rem 1.5rem;
            border-radius: 0;
            margin: 1rem auto 0rem;
            figure { margin: 0 0 1rem; }
        }
    }
}
</style>
