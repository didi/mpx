"use strict";
(self["webpackChunkmpx_transform_web_demo"] = self["webpackChunkmpx_transform_web_demo"] || []).push([[4],{

/***/ 362:
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ Slide; }
/* harmony export */ });
/*!
 * better-scroll / slide
 * (c) 2016-2022 ustbhuangyi
 * Released under the MIT License.
 */
function warn(msg) {
    console.error("[BScroll warn]: " + msg);
}

// ssr support
var inBrowser = typeof window !== 'undefined';
var ua = inBrowser && navigator.userAgent.toLowerCase();
!!(ua && /wechatdevtools/.test(ua));
ua && ua.indexOf('android') > 0;
/* istanbul ignore next */
((function () {
    if (typeof ua === 'string') {
        var regex = /os (\d\d?_\d(_\d)?)/;
        var matches = regex.exec(ua);
        if (!matches)
            return false;
        var parts = matches[1].split('_').map(function (item) {
            return parseInt(item, 10);
        });
        // ios version >= 13.4 issue 982
        return !!(parts[0] === 13 && parts[1] >= 4);
    }
    return false;
}))();
/* istanbul ignore next */
var supportsPassive = false;
/* istanbul ignore next */
if (inBrowser) {
    var EventName = 'test-passive';
    try {
        var opts = {};
        Object.defineProperty(opts, 'passive', {
            get: function () {
                supportsPassive = true;
            },
        }); // https://github.com/facebook/flow/issues/285
        window.addEventListener(EventName, function () { }, opts);
    }
    catch (e) { }
}

var extend = function (target, source) {
    for (var key in source) {
        target[key] = source[key];
    }
    return target;
};
function between(x, min, max) {
    if (x < min) {
        return min;
    }
    if (x > max) {
        return max;
    }
    return x;
}

var elementStyle = (inBrowser &&
    document.createElement('div').style);
var vendor = (function () {
    /* istanbul ignore if  */
    if (!inBrowser) {
        return false;
    }
    var transformNames = [
        {
            key: 'standard',
            value: 'transform',
        },
        {
            key: 'webkit',
            value: 'webkitTransform',
        },
        {
            key: 'Moz',
            value: 'MozTransform',
        },
        {
            key: 'O',
            value: 'OTransform',
        },
        {
            key: 'ms',
            value: 'msTransform',
        },
    ];
    for (var _i = 0, transformNames_1 = transformNames; _i < transformNames_1.length; _i++) {
        var obj = transformNames_1[_i];
        if (elementStyle[obj.value] !== undefined) {
            return obj.key;
        }
    }
    /* istanbul ignore next  */
    return false;
})();
/* istanbul ignore next  */
function prefixStyle(style) {
    if (vendor === false) {
        return style;
    }
    if (vendor === 'standard') {
        if (style === 'transitionEnd') {
            return 'transitionend';
        }
        return style;
    }
    return vendor + style.charAt(0).toUpperCase() + style.substr(1);
}
vendor && vendor !== 'standard' ? '-' + vendor.toLowerCase() + '-' : '';
var transform = prefixStyle('transform');
var transition = prefixStyle('transition');
inBrowser && prefixStyle('perspective') in elementStyle;
({
    transform: transform,
    transition: transition,
    transitionTimingFunction: prefixStyle('transitionTimingFunction'),
    transitionDuration: prefixStyle('transitionDuration'),
    transitionDelay: prefixStyle('transitionDelay'),
    transformOrigin: prefixStyle('transformOrigin'),
    transitionEnd: prefixStyle('transitionEnd'),
    transitionProperty: prefixStyle('transitionProperty'),
});
function prepend(el, target) {
    var firstChild = target.firstChild;
    if (firstChild) {
        before(el, firstChild);
    }
    else {
        target.appendChild(el);
    }
}
function before(el, target) {
    var parentNode = target.parentNode;
    parentNode.insertBefore(el, target);
}
function removeChild(el, child) {
    el.removeChild(child);
}

var ease = {
    // easeOutQuint
    swipe: {
        style: 'cubic-bezier(0.23, 1, 0.32, 1)',
        fn: function (t) {
            return 1 + --t * t * t * t * t;
        }
    },
    // easeOutQuard
    swipeBounce: {
        style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fn: function (t) {
            return t * (2 - t);
        }
    },
    // easeOutQuart
    bounce: {
        style: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
        fn: function (t) {
            return 1 - --t * t * t * t;
        }
    }
};

var PagesMatrix = /** @class */ (function () {
    function PagesMatrix(scroll) {
        this.scroll = scroll;
        this.init();
    }
    PagesMatrix.prototype.init = function () {
        var scroller = this.scroll.scroller;
        var scrollBehaviorX = scroller.scrollBehaviorX, scrollBehaviorY = scroller.scrollBehaviorY;
        this.wrapperWidth = scrollBehaviorX.wrapperSize;
        this.wrapperHeight = scrollBehaviorY.wrapperSize;
        this.scrollerHeight = scrollBehaviorY.contentSize;
        this.scrollerWidth = scrollBehaviorX.contentSize;
        this.pages = this.buildPagesMatrix(this.wrapperWidth, this.wrapperHeight);
        this.pageLengthOfX = this.pages ? this.pages.length : 0;
        this.pageLengthOfY = this.pages && this.pages[0] ? this.pages[0].length : 0;
    };
    PagesMatrix.prototype.getPageStats = function (pageX, pageY) {
        return this.pages[pageX][pageY];
    };
    PagesMatrix.prototype.getNearestPageIndex = function (x, y) {
        var pageX = 0;
        var pageY = 0;
        var l = this.pages.length;
        for (; pageX < l - 1; pageX++) {
            if (x >= this.pages[pageX][0].cx) {
                break;
            }
        }
        l = this.pages[pageX].length;
        for (; pageY < l - 1; pageY++) {
            if (y >= this.pages[0][pageY].cy) {
                break;
            }
        }
        return {
            pageX: pageX,
            pageY: pageY,
        };
    };
    // (n x 1) matrix for horizontal scroll or
    // (1 * n) matrix for vertical scroll
    PagesMatrix.prototype.buildPagesMatrix = function (stepX, stepY) {
        var pages = [];
        var x = 0;
        var y;
        var cx;
        var cy;
        var i = 0;
        var l;
        var maxScrollPosX = this.scroll.scroller.scrollBehaviorX.maxScrollPos;
        var maxScrollPosY = this.scroll.scroller.scrollBehaviorY.maxScrollPos;
        cx = Math.round(stepX / 2);
        cy = Math.round(stepY / 2);
        while (x > -this.scrollerWidth) {
            pages[i] = [];
            l = 0;
            y = 0;
            while (y > -this.scrollerHeight) {
                pages[i][l] = {
                    x: Math.max(x, maxScrollPosX),
                    y: Math.max(y, maxScrollPosY),
                    width: stepX,
                    height: stepY,
                    cx: x - cx,
                    cy: y - cy,
                };
                y -= stepY;
                l++;
            }
            x -= stepX;
            i++;
        }
        return pages;
    };
    return PagesMatrix;
}());

var BASE_PAGE = {
    pageX: 0,
    pageY: 0,
    x: 0,
    y: 0,
};

var SlidePages = /** @class */ (function () {
    function SlidePages(scroll, slideOptions) {
        this.scroll = scroll;
        this.slideOptions = slideOptions;
        this.slideX = false;
        this.slideY = false;
        this.currentPage = extend({}, BASE_PAGE);
    }
    SlidePages.prototype.refresh = function () {
        this.pagesMatrix = new PagesMatrix(this.scroll);
        this.checkSlideLoop();
        this.currentPage = this.getAdjustedCurrentPage();
    };
    SlidePages.prototype.getAdjustedCurrentPage = function () {
        var _a = this.currentPage, pageX = _a.pageX, pageY = _a.pageY;
        // page index should be handled
        // because page counts may reduce
        pageX = Math.min(pageX, this.pagesMatrix.pageLengthOfX - 1);
        pageY = Math.min(pageY, this.pagesMatrix.pageLengthOfY - 1);
        // loop scene should also be respected
        // because clonedNode will cause pageLength increasing
        if (this.loopX) {
            pageX = Math.min(pageX, this.pagesMatrix.pageLengthOfX - 2);
        }
        if (this.loopY) {
            pageY = Math.min(pageY, this.pagesMatrix.pageLengthOfY - 2);
        }
        var _b = this.pagesMatrix.getPageStats(pageX, pageY), x = _b.x, y = _b.y;
        return { pageX: pageX, pageY: pageY, x: x, y: y };
    };
    SlidePages.prototype.setCurrentPage = function (newPage) {
        this.currentPage = newPage;
    };
    SlidePages.prototype.getInternalPage = function (pageX, pageY) {
        if (pageX >= this.pagesMatrix.pageLengthOfX) {
            pageX = this.pagesMatrix.pageLengthOfX - 1;
        }
        else if (pageX < 0) {
            pageX = 0;
        }
        if (pageY >= this.pagesMatrix.pageLengthOfY) {
            pageY = this.pagesMatrix.pageLengthOfY - 1;
        }
        else if (pageY < 0) {
            pageY = 0;
        }
        var _a = this.pagesMatrix.getPageStats(pageX, pageY), x = _a.x, y = _a.y;
        return {
            pageX: pageX,
            pageY: pageY,
            x: x,
            y: y,
        };
    };
    SlidePages.prototype.getInitialPage = function (showFirstPage, firstInitialised) {
        if (showFirstPage === void 0) { showFirstPage = false; }
        if (firstInitialised === void 0) { firstInitialised = false; }
        var _a = this.slideOptions, startPageXIndex = _a.startPageXIndex, startPageYIndex = _a.startPageYIndex;
        var firstPageX = this.loopX ? 1 : 0;
        var firstPageY = this.loopY ? 1 : 0;
        var pageX = showFirstPage ? firstPageX : this.currentPage.pageX;
        var pageY = showFirstPage ? firstPageY : this.currentPage.pageY;
        if (firstInitialised) {
            pageX = this.loopX ? startPageXIndex + 1 : startPageXIndex;
            pageY = this.loopY ? startPageYIndex + 1 : startPageYIndex;
        }
        else {
            pageX = showFirstPage ? firstPageX : this.currentPage.pageX;
            pageY = showFirstPage ? firstPageY : this.currentPage.pageY;
        }
        var _b = this.pagesMatrix.getPageStats(pageX, pageY), x = _b.x, y = _b.y;
        return {
            pageX: pageX,
            pageY: pageY,
            x: x,
            y: y,
        };
    };
    SlidePages.prototype.getExposedPage = function (page) {
        var exposedPage = extend({}, page);
        // only pageX or pageY need fix
        if (this.loopX) {
            exposedPage.pageX = this.fixedPage(exposedPage.pageX, this.pagesMatrix.pageLengthOfX - 2);
        }
        if (this.loopY) {
            exposedPage.pageY = this.fixedPage(exposedPage.pageY, this.pagesMatrix.pageLengthOfY - 2);
        }
        return exposedPage;
    };
    SlidePages.prototype.getExposedPageByPageIndex = function (pageIndexX, pageIndexY) {
        var page = {
            pageX: pageIndexX,
            pageY: pageIndexY,
        };
        if (this.loopX) {
            page.pageX = pageIndexX + 1;
        }
        if (this.loopY) {
            page.pageY = pageIndexY + 1;
        }
        var _a = this.pagesMatrix.getPageStats(page.pageX, page.pageY), x = _a.x, y = _a.y;
        return {
            x: x,
            y: y,
            pageX: pageIndexX,
            pageY: pageIndexY,
        };
    };
    SlidePages.prototype.getWillChangedPage = function (page) {
        page = extend({}, page);
        // Page need fix
        if (this.loopX) {
            page.pageX = this.fixedPage(page.pageX, this.pagesMatrix.pageLengthOfX - 2);
            page.x = this.pagesMatrix.getPageStats(page.pageX + 1, 0).x;
        }
        if (this.loopY) {
            page.pageY = this.fixedPage(page.pageY, this.pagesMatrix.pageLengthOfY - 2);
            page.y = this.pagesMatrix.getPageStats(0, page.pageY + 1).y;
        }
        return page;
    };
    SlidePages.prototype.fixedPage = function (page, realPageLen) {
        var pageIndex = [];
        for (var i = 0; i < realPageLen; i++) {
            pageIndex.push(i);
        }
        pageIndex.unshift(realPageLen - 1);
        pageIndex.push(0);
        return pageIndex[page];
    };
    SlidePages.prototype.getPageStats = function () {
        return this.pagesMatrix.getPageStats(this.currentPage.pageX, this.currentPage.pageY);
    };
    SlidePages.prototype.getValidPageIndex = function (x, y) {
        var lastX = this.pagesMatrix.pageLengthOfX - 1;
        var lastY = this.pagesMatrix.pageLengthOfY - 1;
        var firstX = 0;
        var firstY = 0;
        if (this.loopX) {
            x += 1;
            firstX = firstX + 1;
            lastX = lastX - 1;
        }
        if (this.loopY) {
            y += 1;
            firstY = firstY + 1;
            lastY = lastY - 1;
        }
        x = between(x, firstX, lastX);
        y = between(y, firstY, lastY);
        return {
            pageX: x,
            pageY: y,
        };
    };
    SlidePages.prototype.nextPageIndex = function () {
        return this.getPageIndexByDirection("positive" /* Positive */);
    };
    SlidePages.prototype.prevPageIndex = function () {
        return this.getPageIndexByDirection("negative" /* Negative */);
    };
    SlidePages.prototype.getNearestPage = function (x, y) {
        var pageIndex = this.pagesMatrix.getNearestPageIndex(x, y);
        var pageX = pageIndex.pageX, pageY = pageIndex.pageY;
        var newX = this.pagesMatrix.getPageStats(pageX, 0).x;
        var newY = this.pagesMatrix.getPageStats(0, pageY).y;
        return {
            x: newX,
            y: newY,
            pageX: pageX,
            pageY: pageY,
        };
    };
    SlidePages.prototype.getPageByDirection = function (page, directionX, directionY) {
        var pageX = page.pageX, pageY = page.pageY;
        if (pageX === this.currentPage.pageX) {
            pageX = between(pageX + directionX, 0, this.pagesMatrix.pageLengthOfX - 1);
        }
        if (pageY === this.currentPage.pageY) {
            pageY = between(pageY + directionY, 0, this.pagesMatrix.pageLengthOfY - 1);
        }
        var x = this.pagesMatrix.getPageStats(pageX, 0).x;
        var y = this.pagesMatrix.getPageStats(0, pageY).y;
        return {
            x: x,
            y: y,
            pageX: pageX,
            pageY: pageY,
        };
    };
    SlidePages.prototype.resetLoopPage = function () {
        if (this.loopX) {
            if (this.currentPage.pageX === 0) {
                return {
                    pageX: this.pagesMatrix.pageLengthOfX - 2,
                    pageY: this.currentPage.pageY,
                };
            }
            if (this.currentPage.pageX === this.pagesMatrix.pageLengthOfX - 1) {
                return {
                    pageX: 1,
                    pageY: this.currentPage.pageY,
                };
            }
        }
        if (this.loopY) {
            if (this.currentPage.pageY === 0) {
                return {
                    pageX: this.currentPage.pageX,
                    pageY: this.pagesMatrix.pageLengthOfY - 2,
                };
            }
            if (this.currentPage.pageY === this.pagesMatrix.pageLengthOfY - 1) {
                return {
                    pageX: this.currentPage.pageX,
                    pageY: 1,
                };
            }
        }
    };
    SlidePages.prototype.getPageIndexByDirection = function (direction) {
        var x = this.currentPage.pageX;
        var y = this.currentPage.pageY;
        if (this.slideX) {
            x = direction === "negative" /* Negative */ ? x - 1 : x + 1;
        }
        if (this.slideY) {
            y = direction === "negative" /* Negative */ ? y - 1 : y + 1;
        }
        return {
            pageX: x,
            pageY: y,
        };
    };
    SlidePages.prototype.checkSlideLoop = function () {
        this.wannaLoop = this.slideOptions.loop;
        if (this.pagesMatrix.pageLengthOfX > 1) {
            this.slideX = true;
        }
        else {
            this.slideX = false;
        }
        if (this.pagesMatrix.pages[0] && this.pagesMatrix.pageLengthOfY > 1) {
            this.slideY = true;
        }
        else {
            this.slideY = false;
        }
        this.loopX = this.wannaLoop && this.slideX;
        this.loopY = this.wannaLoop && this.slideY;
        if (this.slideX && this.slideY) {
            warn('slide does not support two direction at the same time.');
        }
    };
    return SlidePages;
}());

var sourcePrefix = 'plugins.slide';
var propertiesMap = [
    {
        key: 'next',
        name: 'next',
    },
    {
        key: 'prev',
        name: 'prev',
    },
    {
        key: 'goToPage',
        name: 'goToPage',
    },
    {
        key: 'getCurrentPage',
        name: 'getCurrentPage',
    },
    {
        key: 'startPlay',
        name: 'startPlay',
    },
    {
        key: 'pausePlay',
        name: 'pausePlay',
    },
];
var propertiesConfig = propertiesMap.map(function (item) {
    return {
        key: item.key,
        sourceKey: sourcePrefix + "." + item.name,
    };
});

var samePage = function (p1, p2) {
    return p1.pageX === p2.pageX && p1.pageY === p2.pageY;
};
var Slide = /** @class */ (function () {
    function Slide(scroll) {
        this.scroll = scroll;
        this.cachedClonedPageDOM = [];
        this.resetLooping = false;
        this.autoplayTimer = 0;
        if (!this.satisfyInitialization()) {
            return;
        }
        this.init();
    }
    Slide.prototype.satisfyInitialization = function () {
        if (this.scroll.scroller.content.children.length <= 0) {
            warn("slide need at least one slide page to be initialised." +
                "please check your DOM layout.");
            return false;
        }
        return true;
    };
    Slide.prototype.init = function () {
        this.willChangeToPage = extend({}, BASE_PAGE);
        this.handleBScroll();
        this.handleOptions();
        this.handleHooks();
        this.createPages();
    };
    Slide.prototype.createPages = function () {
        this.pages = new SlidePages(this.scroll, this.options);
    };
    Slide.prototype.handleBScroll = function () {
        this.scroll.registerType(['slideWillChange', 'slidePageChanged']);
        this.scroll.proxy(propertiesConfig);
    };
    Slide.prototype.handleOptions = function () {
        var userOptions = (this.scroll.options.slide === true
            ? {}
            : this.scroll.options.slide);
        var defaultOptions = {
            loop: true,
            threshold: 0.1,
            speed: 400,
            easing: ease.bounce,
            listenFlick: true,
            autoplay: true,
            interval: 3000,
            startPageXIndex: 0,
            startPageYIndex: 0,
        };
        this.options = extend(defaultOptions, userOptions);
    };
    Slide.prototype.handleLoop = function (prevSlideContent) {
        var loop = this.options.loop;
        var slideContent = this.scroll.scroller.content;
        var currentSlidePagesLength = slideContent.children.length;
        // only should respect loop scene
        if (loop) {
            if (slideContent !== prevSlideContent) {
                this.resetLoopChangedStatus();
                this.removeClonedSlidePage(prevSlideContent);
                currentSlidePagesLength > 1 &&
                    this.cloneFirstAndLastSlidePage(slideContent);
            }
            else {
                // many pages reduce to one page
                if (currentSlidePagesLength === 3 && this.initialised) {
                    this.removeClonedSlidePage(slideContent);
                    this.moreToOnePageInLoop = true;
                    this.oneToMorePagesInLoop = false;
                }
                else if (currentSlidePagesLength > 1) {
                    // one page increases to many page
                    if (this.initialised && this.cachedClonedPageDOM.length === 0) {
                        this.oneToMorePagesInLoop = true;
                        this.moreToOnePageInLoop = false;
                    }
                    else {
                        this.removeClonedSlidePage(slideContent);
                        this.resetLoopChangedStatus();
                    }
                    this.cloneFirstAndLastSlidePage(slideContent);
                }
                else {
                    this.resetLoopChangedStatus();
                }
            }
        }
    };
    Slide.prototype.resetLoopChangedStatus = function () {
        this.moreToOnePageInLoop = false;
        this.oneToMorePagesInLoop = false;
    };
    Slide.prototype.handleHooks = function () {
        var _this = this;
        var scrollHooks = this.scroll.hooks;
        var scrollerHooks = this.scroll.scroller.hooks;
        var listenFlick = this.options.listenFlick;
        this.prevContent = this.scroll.scroller.content;
        this.hooksFn = [];
        // scroll
        this.registerHooks(this.scroll, this.scroll.eventTypes.beforeScrollStart, this.pausePlay);
        this.registerHooks(this.scroll, this.scroll.eventTypes.scrollEnd, this.modifyCurrentPage);
        this.registerHooks(this.scroll, this.scroll.eventTypes.scrollEnd, this.startPlay);
        // for mousewheel event
        if (this.scroll.eventTypes.mousewheelMove) {
            this.registerHooks(this.scroll, this.scroll.eventTypes.mousewheelMove, function () {
                // prevent default action of mousewheelMove
                return true;
            });
            this.registerHooks(this.scroll, this.scroll.eventTypes.mousewheelEnd, function (delta) {
                if (delta.directionX === 1 /* Positive */ ||
                    delta.directionY === 1 /* Positive */) {
                    _this.next();
                }
                if (delta.directionX === -1 /* Negative */ ||
                    delta.directionY === -1 /* Negative */) {
                    _this.prev();
                }
            });
        }
        // scrollHooks
        this.registerHooks(scrollHooks, scrollHooks.eventTypes.refresh, this.refreshHandler);
        this.registerHooks(scrollHooks, scrollHooks.eventTypes.destroy, this.destroy);
        // scroller
        this.registerHooks(scrollerHooks, scrollerHooks.eventTypes.beforeRefresh, function () {
            _this.handleLoop(_this.prevContent);
            _this.setSlideInlineStyle();
        });
        this.registerHooks(scrollerHooks, scrollerHooks.eventTypes.momentum, this.modifyScrollMetaHandler);
        this.registerHooks(scrollerHooks, scrollerHooks.eventTypes.scroll, this.scrollHandler);
        // a click operation will clearTimer, so restart a new one
        this.registerHooks(scrollerHooks, scrollerHooks.eventTypes.checkClick, this.startPlay);
        if (listenFlick) {
            this.registerHooks(scrollerHooks, scrollerHooks.eventTypes.flick, this.flickHandler);
        }
    };
    Slide.prototype.startPlay = function () {
        var _this = this;
        var _a = this.options, interval = _a.interval, autoplay = _a.autoplay;
        if (autoplay) {
            clearTimeout(this.autoplayTimer);
            this.autoplayTimer = window.setTimeout(function () {
                _this.next();
            }, interval);
        }
    };
    Slide.prototype.pausePlay = function () {
        if (this.options.autoplay) {
            clearTimeout(this.autoplayTimer);
        }
    };
    Slide.prototype.setSlideInlineStyle = function () {
        var styleConfigurations = [
            {
                direction: 'scrollX',
                sizeType: 'offsetWidth',
                styleType: 'width',
            },
            {
                direction: 'scrollY',
                sizeType: 'offsetHeight',
                styleType: 'height',
            },
        ];
        var _a = this.scroll.scroller, slideContent = _a.content, slideWrapper = _a.wrapper;
        var scrollOptions = this.scroll.options;
        styleConfigurations.forEach(function (_a) {
            var direction = _a.direction, sizeType = _a.sizeType, styleType = _a.styleType;
            // wanna scroll in this direction
            if (scrollOptions[direction]) {
                var size = slideWrapper[sizeType];
                var children = slideContent.children;
                var length_1 = children.length;
                for (var i = 0; i < length_1; i++) {
                    var slidePageDOM = children[i];
                    slidePageDOM.style[styleType] = size + 'px';
                }
                slideContent.style[styleType] = size * length_1 + 'px';
            }
        });
    };
    Slide.prototype.next = function (time, easing) {
        var _a = this.pages.nextPageIndex(), pageX = _a.pageX, pageY = _a.pageY;
        this.goTo(pageX, pageY, time, easing);
    };
    Slide.prototype.prev = function (time, easing) {
        var _a = this.pages.prevPageIndex(), pageX = _a.pageX, pageY = _a.pageY;
        this.goTo(pageX, pageY, time, easing);
    };
    Slide.prototype.goToPage = function (pageX, pageY, time, easing) {
        var pageIndex = this.pages.getValidPageIndex(pageX, pageY);
        this.goTo(pageIndex.pageX, pageIndex.pageY, time, easing);
    };
    Slide.prototype.getCurrentPage = function () {
        return this.exposedPage || this.pages.getInitialPage(false, true);
    };
    Slide.prototype.setCurrentPage = function (page) {
        this.pages.setCurrentPage(page);
        this.exposedPage = this.pages.getExposedPage(page);
    };
    Slide.prototype.nearestPage = function (x, y) {
        var _a = this.scroll.scroller, scrollBehaviorX = _a.scrollBehaviorX, scrollBehaviorY = _a.scrollBehaviorY;
        var maxScrollPosX = scrollBehaviorX.maxScrollPos, minScrollPosX = scrollBehaviorX.minScrollPos;
        var maxScrollPosY = scrollBehaviorY.maxScrollPos, minScrollPosY = scrollBehaviorY.minScrollPos;
        return this.pages.getNearestPage(between(x, maxScrollPosX, minScrollPosX), between(y, maxScrollPosY, minScrollPosY));
    };
    Slide.prototype.satisfyThreshold = function (x, y) {
        var _a = this.scroll.scroller, scrollBehaviorX = _a.scrollBehaviorX, scrollBehaviorY = _a.scrollBehaviorY;
        var satisfied = true;
        if (Math.abs(x - scrollBehaviorX.absStartPos) <= this.thresholdX &&
            Math.abs(y - scrollBehaviorY.absStartPos) <= this.thresholdY) {
            satisfied = false;
        }
        return satisfied;
    };
    Slide.prototype.refreshHandler = function (content) {
        var _this = this;
        if (!this.satisfyInitialization()) {
            return;
        }
        this.pages.refresh();
        this.computeThreshold();
        var contentChanged = (this.contentChanged = this.prevContent !== content);
        if (contentChanged) {
            this.prevContent = content;
        }
        var initPage = this.pages.getInitialPage(this.oneToMorePagesInLoop || this.moreToOnePageInLoop, contentChanged || !this.initialised);
        if (this.initialised) {
            this.goTo(initPage.pageX, initPage.pageY, 0);
        }
        else {
            this.registerHooks(this.scroll.hooks, this.scroll.hooks.eventTypes.beforeInitialScrollTo, function (position) {
                _this.initialised = true;
                position.x = initPage.x;
                position.y = initPage.y;
            });
        }
        this.startPlay();
    };
    Slide.prototype.computeThreshold = function () {
        var threshold = this.options.threshold;
        // Integer
        if (threshold % 1 === 0) {
            this.thresholdX = threshold;
            this.thresholdY = threshold;
        }
        else {
            // decimal
            var _a = this.pages.getPageStats(), width = _a.width, height = _a.height;
            this.thresholdX = Math.round(width * threshold);
            this.thresholdY = Math.round(height * threshold);
        }
    };
    Slide.prototype.cloneFirstAndLastSlidePage = function (slideContent) {
        var children = slideContent.children;
        var preprendDOM = children[children.length - 1].cloneNode(true);
        var appendDOM = children[0].cloneNode(true);
        prepend(preprendDOM, slideContent);
        slideContent.appendChild(appendDOM);
        this.cachedClonedPageDOM = [preprendDOM, appendDOM];
    };
    Slide.prototype.removeClonedSlidePage = function (slideContent) {
        // maybe slideContent has removed from DOM Tree
        var slidePages = (slideContent && slideContent.children) || [];
        if (slidePages.length) {
            this.cachedClonedPageDOM.forEach(function (el) {
                removeChild(slideContent, el);
            });
        }
        this.cachedClonedPageDOM = [];
    };
    Slide.prototype.modifyCurrentPage = function (point) {
        var _a = this.getCurrentPage(), prevExposedPageX = _a.pageX, prevExposedPageY = _a.pageY;
        var newPage = this.nearestPage(point.x, point.y);
        this.setCurrentPage(newPage);
        /* istanbul ignore if */
        if (this.contentChanged) {
            this.contentChanged = false;
            return true;
        }
        var _b = this.getCurrentPage(), currentExposedPageX = _b.pageX, currentExposedPageY = _b.pageY;
        this.pageWillChangeTo(newPage);
        // loop is true, and one page becomes many pages when call bs.refresh
        if (this.oneToMorePagesInLoop) {
            this.oneToMorePagesInLoop = false;
            return true;
        }
        // loop is true, and many page becomes one page when call bs.refresh
        // if prevPage > 0, dispatch slidePageChanged and scrollEnd events
        /* istanbul ignore if */
        if (this.moreToOnePageInLoop &&
            prevExposedPageX === 0 &&
            prevExposedPageY === 0) {
            this.moreToOnePageInLoop = false;
            return true;
        }
        if (prevExposedPageX !== currentExposedPageX ||
            prevExposedPageY !== currentExposedPageY) {
            // only trust pageX & pageY when loop is true
            var page = this.pages.getExposedPageByPageIndex(currentExposedPageX, currentExposedPageY);
            this.scroll.trigger(this.scroll.eventTypes.slidePageChanged, page);
        }
        // triggered by resetLoop
        if (this.resetLooping) {
            this.resetLooping = false;
            return;
        }
        var changePage = this.pages.resetLoopPage();
        if (changePage) {
            this.resetLooping = true;
            this.goTo(changePage.pageX, changePage.pageY, 0);
            // stop user's scrollEnd
            // since it is a seamless scroll
            return true;
        }
    };
    Slide.prototype.goTo = function (pageX, pageY, time, easing) {
        var newPage = this.pages.getInternalPage(pageX, pageY);
        var scrollEasing = easing || this.options.easing || ease.bounce;
        var x = newPage.x, y = newPage.y;
        var deltaX = x - this.scroll.scroller.scrollBehaviorX.currentPos;
        var deltaY = y - this.scroll.scroller.scrollBehaviorY.currentPos;
        /* istanbul ignore if */
        if (!deltaX && !deltaY) {
            this.scroll.scroller.togglePointerEvents(true);
            return;
        }
        time = time === undefined ? this.getEaseTime(deltaX, deltaY) : time;
        this.scroll.scroller.scrollTo(x, y, time, scrollEasing);
    };
    Slide.prototype.flickHandler = function () {
        var _a = this.scroll.scroller, scrollBehaviorX = _a.scrollBehaviorX, scrollBehaviorY = _a.scrollBehaviorY;
        var currentPosX = scrollBehaviorX.currentPos, startPosX = scrollBehaviorX.startPos, directionX = scrollBehaviorX.direction;
        var currentPosY = scrollBehaviorY.currentPos, startPosY = scrollBehaviorY.startPos, directionY = scrollBehaviorY.direction;
        var _b = this.pages.currentPage, pageX = _b.pageX, pageY = _b.pageY;
        var time = this.getEaseTime(currentPosX - startPosX, currentPosY - startPosY);
        this.goTo(pageX + directionX, pageY + directionY, time);
    };
    Slide.prototype.getEaseTime = function (deltaX, deltaY) {
        return (this.options.speed ||
            Math.max(Math.max(Math.min(Math.abs(deltaX), 1000), Math.min(Math.abs(deltaY), 1000)), 300));
    };
    Slide.prototype.modifyScrollMetaHandler = function (scrollMeta) {
        var _a = this.scroll.scroller, scrollBehaviorX = _a.scrollBehaviorX, scrollBehaviorY = _a.scrollBehaviorY, animater = _a.animater;
        var newX = scrollMeta.newX;
        var newY = scrollMeta.newY;
        var newPage = this.satisfyThreshold(newX, newY) || animater.forceStopped
            ? this.pages.getPageByDirection(this.nearestPage(newX, newY), scrollBehaviorX.direction, scrollBehaviorY.direction)
            : this.pages.currentPage;
        scrollMeta.time = this.getEaseTime(scrollMeta.newX - newPage.x, scrollMeta.newY - newPage.y);
        scrollMeta.newX = newPage.x;
        scrollMeta.newY = newPage.y;
        scrollMeta.easing = this.options.easing || ease.bounce;
    };
    Slide.prototype.scrollHandler = function (_a) {
        var x = _a.x, y = _a.y;
        if (this.satisfyThreshold(x, y)) {
            var newPage = this.nearestPage(x, y);
            this.pageWillChangeTo(newPage);
        }
    };
    Slide.prototype.pageWillChangeTo = function (newPage) {
        var changeToPage = this.pages.getWillChangedPage(newPage);
        if (!samePage(this.willChangeToPage, changeToPage)) {
            this.willChangeToPage = changeToPage;
            this.scroll.trigger(this.scroll.eventTypes.slideWillChange, this.willChangeToPage);
        }
    };
    Slide.prototype.registerHooks = function (hooks, name, handler) {
        hooks.on(name, handler, this);
        this.hooksFn.push([hooks, name, handler]);
    };
    Slide.prototype.destroy = function () {
        var slideContent = this.scroll.scroller.content;
        var _a = this.options, loop = _a.loop, autoplay = _a.autoplay;
        if (loop) {
            this.removeClonedSlidePage(slideContent);
        }
        if (autoplay) {
            clearTimeout(this.autoplayTimer);
        }
        this.hooksFn.forEach(function (item) {
            var hooks = item[0];
            var hooksName = item[1];
            var handlerFn = item[2];
            if (hooks.eventTypes[hooksName]) {
                hooks.off(hooksName, handlerFn);
            }
        });
        this.hooksFn.length = 0;
    };
    Slide.pluginName = 'slide';
    return Slide;
}());




/***/ })

}]);
//# sourceMappingURL=4.js.map