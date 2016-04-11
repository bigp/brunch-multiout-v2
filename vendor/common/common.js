var d = document, w = window, defaults, ad, isDebug = false;
function isArray(o) {
    return o != null && ((o instanceof Array) || o.hasOwnProperty('length'));
}
function rem(arr, o) {
    var i = arr.indexOf(o);
    if (i > -1)
        arr.splice(i, 1);
}
function id(n) {
    var found;
    if (n.indexOf(" ") > -1) {
        var eachIDs = n.split(" ");
        found = d.getElementById(eachIDs[0]);
        for (var r = 1; r < eachIDs.length;) {
            var subName = eachIDs[r];
            if (subName.charAt(0) == ".") {
            }
            var kids = found.getElementsByClassName(subName);
            if (kids.length == 0) {
                throw new Error("Cannot find child: " + subName);
                return null;
            }
            found = kids[0];
        }
    }
    else {
        found = d.getElementById(n);
    }
    if (!found)
        trace("ERROR: Cannot find element by id: " + n);
    //else trace("Found id: " + n);
    return found;
}
var getQueryVariable = (function () {
    var query = w.location.search.substring(1);
    var vars = query.split('&');
    var queryObj = {};
    for (var i = 0; i < vars.length; i++) {
        var kv = vars[i].split('=');
        queryObj[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
    }
    return function _getQueryVariable(variable) {
        if (queryObj.hasOwnProperty(variable)) {
            return queryObj[variable];
        }
        trace('info: Query variable \"%s\" not found', variable);
        return null;
    };
})();
var AdPreloader = (function () {
    function AdPreloader() {
        var _THIS = this;
        _THIS.clickTagHandler = null;
        _THIS.preload = function () { _THIS._preload(); };
        _THIS.prepareAd = function () { _THIS._prepareAd(); };
        _THIS.callMain = function () { _THIS._callMain(); };
        w.onload = this.preload;
    }
    AdPreloader.prototype._callMain = function () {
        var _THIS = this;
        trace("main: " + _THIS);
        if (w['atlasURL'] != null) {
            var img = new Image();
            img.addEventListener("load", function () {
                isDebug ? setTimeout(_THIS.prepareAd, 250) : _THIS.prepareAd();
            });
            img.src = atlasURL;
        }
        else
            _THIS.prepareAd();
    };
    AdPreloader.prototype._preload = function () { }; //Overriden
    AdPreloader.prototype._prepareAd = function () {
        var _THIS = this;
        var clickTarget = id("link");
        defaults = {
            attachTo: id("content"),
            timeline: new TimelineMax()
        };
        //Create the Ad, init and play it:
        if (!window['Ad']) {
            trace("No Ad object defined!");
            return;
        }
        ad = new Ad();
        ad.play(defaults.timeline);
        clickTarget.addEventListener("click", function () {
            if (!_THIS.clickTagHandler)
                trace("No click tag");
            else
                _THIS.clickTagHandler();
            ad.onClick && ad.onClick();
        });
        defaults.timeline.call(function () {
            ad.onEnd && ad.onEnd();
        });
        _THIS._onAdCreated();
    };
    AdPreloader.prototype._onAdCreated = function () {
    };
    return AdPreloader;
})();
;
var adPreloader = new AdPreloader();
function makeDiv(classes, attachTo) {
    if (classes === void 0) { classes = null; }
    if (attachTo === void 0) { attachTo = null; }
    if (attachTo == null)
        attachTo = defaults.attachTo;
    if (typeof (attachTo) == "string")
        attachTo = id(attachTo);
    var div = document.createElement("div");
    //div.classList.add("sprite");
    if (classes != null)
        addClassesTo(div, classes);
    attachTo.appendChild(div);
    return div;
}
function makeSprite(cssName, x, y, options) {
    if (x === void 0) { x = 0; }
    if (y === void 0) { y = 0; }
    if (options === void 0) { options = null; }
    if (options == null)
        options = {};
    var div = makeDiv(null, options.attachTo);
    addClassesTo(div, cssName + " sprite");
    TweenMax.set(div, { x: x, y: y, alpha: defaults.hidden || options.hidden ? 0 : 1 });
    return div;
}
function makeText(text, className, x, y, options) {
    if (x === void 0) { x = 0; }
    if (y === void 0) { y = 0; }
    if (options === void 0) { options = null; }
    var div = makeSprite(className + " text", x, y, options);
    div.innerHTML = text.replace(/\|\|/g, "<br/>\n");
    return div;
}
function addClassesTo(div, classes) {
    var classList = typeof (classes) == "string" ? classes.split(" ") : classes;
    for (var c = classList.length; --c >= 0;) {
        div.classList.add(classList[c]);
    }
}
function show() {
    var rest = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        rest[_i - 0] = arguments[_i];
    }
    for (var r = rest.length; --r >= 0;)
        defaults.timeline.set(rest[r], { alpha: 1 });
}
function hide() {
    var rest = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        rest[_i - 0] = arguments[_i];
    }
    for (var r = rest.length; --r >= 0;)
        defaults.timeline.set(rest[r], { alpha: 0 });
}
function wait(time) {
    defaults.timeline.set({}, {}, "+=" + time);
}
function pauseHere() {
    var t = defaults.timeline;
    t.call(t.pause.bind(t));
}
var singleArr = [];
function fadeIn(time, rest, offset) {
    if (offset === void 0) { offset = null; }
    var current = typeof (offset) == "string" ? offset : defaults.timeline.totalDuration() + (offset == null ? 0 : offset);
    if (!isArray(rest)) {
        singleArr[0] = rest;
        rest = singleArr;
    }
    for (var r = rest.length; --r >= 0;) {
        defaults.timeline.to(rest[r], time, { alpha: 1 }, current);
    }
}
function fadeOut(time, rest, offset) {
    if (offset === void 0) { offset = null; }
    var current = defaults.timeline.totalDuration() + (offset == null ? 0 : offset);
    if (!isArray(rest)) {
        singleArr[0] = rest;
        rest = singleArr;
    }
    for (var r = rest.length; --r >= 0;) {
        defaults.timeline.to(rest[r], time, { alpha: 0 }, current);
    }
}
