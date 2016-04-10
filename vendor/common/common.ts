declare var TweenMax, TimelineMax, CSSPlugin, Ease;
declare var Quad, Quint, Cubic, Back, Elastic, Bounce, Sine, Circ, Linear;
declare var Enabler, studio;
declare var Ad, atlasURL:string;

var d = document, w=window, defaults, ad, isDebug = false;

var trace = console.log.bind(console);
var log = console.log.bind(console);

function isArray(o) {
    return (o instanceof Array) || o.hasOwnProperty('length');
}

function rem(arr, o) {
    var i = arr.indexOf(o);
    if (i > -1) arr.splice(i, 1);
}

function id(n) {
    var found:HTMLElement;
    if(n.indexOf(" ")>-1) {
        var eachIDs = n.split(" ");
        found = d.getElementById( eachIDs[0] );
        for(var r=1; r<eachIDs.length;) {
            var subName = eachIDs[r];
            if(subName.charAt(0)==".") {
                //subName = subName.substr(1);
            }
            var kids = found.getElementsByClassName(subName);
            if(kids.length==0) {
                throw new Error("Cannot find child: " + subName);
                return null;
            }
            found = <HTMLElement> kids[0];
        }

    } else {
        found = d.getElementById(n);
    }

    if(!found) trace("ERROR: Cannot find element by id: " + n);
    //else trace("Found id: " + n);
    return found;
}

var getQueryVariable = (function() {
    var query = w.location.search.substring(1);
    var vars = query.split('&');
    var queryObj = {};
    for (var i = 0; i < vars.length; i++) {
        var kv = vars[i].split('=');
        queryObj[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
    }

    return function _getQueryVariable(variable) {
        if(queryObj.hasOwnProperty(variable)) {
            return queryObj[variable];
        }

        trace('info: Query variable \"%s\" not found', variable);
        return null;
    };
})();

(function() {
    var clickTagHandler;
    w.onload = _preload;

    function _preload() {
        if (w.location.hostname == "localhost" && w.location.port == "3333") {
            trace(w.document.title = "*LOCAL* " + w.document.title);
        }

        if(getQueryVariable('debug')) {
            var b = d.body;
            isDebug = true;
            b.classList.add('debug');
            b.addEventListener("keydown", function(e) {
                switch(e.keyCode) {
                    case 13: ad.onEnter && ad.onEnter(); break;
                }
            });
        }

        //Check if DoubleClick Enabler is missing:
        if (isDebug || !w['Enabler'] || !w['studio']) {
            trace("**DoubleClick Enabler not loaded!**");
            _callMain();
        } else {
            var SE = studio.events.StudioEvent;

            function Enabler_init() {
                // Polite loading
                Enabler.isVisible() ? _callMain() : Enabler.addEventListener(SE.VISIBLE, _callMain);

                clickTagHandler = function Enabler_clickTag() { Enabler.exit('Background Exit'); };
            }

            // If true, start function. If false, listen for INIT.
            Enabler.isInitialized() ? Enabler_init() : Enabler.addEventListener(SE.INIT, Enabler_init);
        }
    }

    function _callMain() {
        if(w['atlasURL']!=null) {
            trace("Preloading atlasURL '%s' ...", atlasURL);
            var img = new Image();
            img.addEventListener("load", function() {
                trace("Downloaded atlasURL '%s'.", atlasURL);
                isDebug ? setTimeout( _prepareAd, 250 ) : _prepareAd();
            });
            img.src = atlasURL;
        } else _prepareAd();
    }



    function _prepareAd() {
        var clickTarget = id("link");
        defaults = {
            attachTo: id("content"),
            timeline: new TimelineMax()
        };

        //Create the Ad, init and play it:
        if(window['Ad']==null) {
            trace("No Ad object defined!"); return;
        }

        ad = new Ad();
        ad.play(defaults.timeline);
        // /*
        clickTarget.addEventListener("click", function() {
            if(!clickTagHandler) trace("No click tag");
            else clickTagHandler();
            ad.onClick && ad.onClick();
        });
        // */

        defaults.timeline.call( function() {
            ad.onEnd && ad.onEnd();
        });
    }
})();

function makeDiv(classes=null, attachTo=null) {
    if(attachTo==null) attachTo = defaults.attachTo;
    if(typeof(attachTo)=="string") attachTo = id(attachTo);

    var div = document.createElement("div");
    //div.classList.add("sprite");
    if(classes!=null) addClassesTo(div, classes);
    attachTo.appendChild(div);
    return div;
}

function makeSprite(cssName, x=0, y=0, options=null) {
    if(options==null) options = {};

    var div = makeDiv(null, options.attachTo);
    addClassesTo(div, cssName + " sprite");

    TweenMax.set(div, {x: x, y: y, alpha: defaults.hidden || options.hidden ? 0 : 1});
    return div;
}

function makeText(text, className, x=0, y=0, options=null) {
    var div = makeSprite(className + " text", x, y, options);

    div.innerHTML = text.replace(/\|\|/g, "<br/>\n");
    return div;
}

function addClassesTo(div, classes:any) {
    var classList = typeof(classes)=="string" ? classes.split(" ") : classes;
    for(var c=classList.length; --c>=0;) {
        div.classList.add(classList[c]);
    }
}

function show(... rest) {
    for(var r=rest.length; --r>=0;) defaults.timeline.set(rest[r], {alpha: 1});
}

function hide(... rest) {
    for(var r=rest.length; --r>=0;) defaults.timeline.set(rest[r], {alpha: 0});
}

function wait(time) {
    defaults.timeline.set({}, {}, "+=" + time);
}

function pauseHere() {
    var t = defaults.timeline;
    t.call( t.pause.bind(t) );
}

var singleArr = [];
function fadeIn(time, rest:any, offset=null) {
    var current = typeof(offset)=="string" ? offset : defaults.timeline.totalDuration() + (offset==null ? 0 : offset);
    if(!isArray(rest)) {singleArr[0] = rest; rest = singleArr; }
    for(var r=rest.length; --r>=0;) {
        defaults.timeline.to(rest[r], time, {alpha: 1}, current);
    }
}

function fadeOut(time, rest:any, offset=null) {
    var current = defaults.timeline.totalDuration() + (offset==null ? 0 : offset);
    if(!isArray(rest)) {singleArr[0] = rest; rest = singleArr; }
    for(var r=rest.length; --r>=0;) {
        defaults.timeline.to(rest[r], time, {alpha: 0}, current);
    }
}


