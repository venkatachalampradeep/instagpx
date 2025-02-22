<template>
    <footer role="contentinfo">
        <div class="footer-content">
            <p>Inspired by <strong><a href="https://twitter.com/alterebro" target="_blank" rel="noopener noreferrer" title="Follow @alterebro on Twitter!">@alterebro</a></strong></p>
            <nav>
                <h4>Share! :</h4>
                <ul>
                    <li v-for="network in networks" :class="network.network | networkClass">
                        <a :href="network.url | networkURL" :title="network.network | networkTitle" @click="networkOpen($event)" :target="network.modal ? '_blank' : false" :rel="network.modal ? 'noopener noreferrer' : false">{{ network.network }}</a>
                    </li>
                </ul>
            </nav>
        </div>
    </footer>
</template>

<script>
import { Config } from './../config.js';
export default {
    data() {
        return {
            networks : [
            ]
        };
    },
    name: 'Footer',
    methods : {
        networkOpen(e) {
            let _el = e.currentTarget;
            if (_el.getAttribute('target') == '_blank') {
                let w = window.open(_el.href, 'share', 'width=550,height=440');
                    w.focus()
                e.preventDefault();
            }
        }
    },
    filters : {
        networkClass(str) {
            return str.toLowerCase().replace('-', '');
        },
        networkURL(url) {
            let _title = encodeURIComponent(Config.title);
            let _desc = encodeURIComponent(Config.description);
            let _url = encodeURIComponent(Config.url);
            return url.replace('{TITLE}', _title).replace('{TEXT}', _desc).replace('{URL}', _url);
        },
        networkTitle(str) {
            return `Share it via ${str}!`;
        }
    }
};
</script>

<style lang="scss" scoped>
@import "./../../scss/_variables.scss";

footer[role="contentinfo"] {
    background: #fff;
    border-top: solid rgba(0, 0, 0, .1) 1px;
}

.footer-content {
    width: 100%;
    max-width: 86rem;
    margin: 0 auto;
    padding: 2rem;
    display: flex;
    align-items: center;

    > p { flex: 0 0 auto }
    > nav { flex: 1 1 auto }

    @media #{$mobile} {
        display: block;
        > p {
            text-align: center;
            margin: 0 auto 1rem;
        }
        > nav {
            margin: 0 auto;
            justify-content: center;
        }
    }
}

nav {
    display: flex;
    align-items: center;
    justify-content: flex-end;

    h4 { display: none }
    ul {
        display: flex;

        &:hover > li {
            opacity: .75;
            transform: scale(.9);
        }
        &:hover > li:hover {
            opacity: 1;
            transform: scale(1);
        }
    }

    li {
        transition: all .35s;
        margin: 0 5px 0 0;

        &:last-child { margin: 0 }
        a {
            display: block;
            width: 28px;
            height: 28px;
            overflow: hidden;
            border-bottom: none;

            &:before {
                content: '';
                display: block;
                width: 28px;
                height: 28px;
                border-radius: 3px;
                transition: background .35s ease-in-out;
                background-color: $color-primary-light;
                background-size: auto 12px;
                background-position: center center;
            }
        }

        &.twitter a:before { background-image: url(../../img/social-share/icon-share-twitter.svg); }
        &.facebook a:before { background-image: url(../../img/social-share/icon-share-facebook.svg); }
        &.linkedin a:before { background-image: url(../../img/social-share/icon-share-linkedin.svg); }
        &.email a:before { background-image: url(../../img/social-share/icon-share-email.svg); }
        &.telegram a:before { background-image: url(../../img/social-share/icon-share-telegram.svg); }

        a:hover:before { background-color: $color-primary-dark; }
    }
}
</style>
