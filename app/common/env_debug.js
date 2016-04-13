/**
 * Created by Chamberlain on 10/04/2016.
 */
var trace = console.log.bind(console);
var log = console.log.bind(console);
var animLimitSeconds = 15;

function writeWarning(message, className) {
    if(className==null) className = "warning";
    id('info').innerHTML += "<h1 class=\""+className+"\">"+message+"</h1>";
}

function gotoEnd(twn) {
    twn.seek(twn.totalDuration());
}

var p = AdPreloader.prototype;

p._preload = function() {
    var _THIS = this;
    if (w.location.hostname == "localhost" && w.location.port == "3333") {
        trace(w.document.title = "*LOCAL* " + w.document.title);
    }

    if(getQueryVariable('debug')) {
        isDebug = true;
    }
    d.body.classList.add('debug');
    w.addEventListener("keydown", function(e) {
        var twn = defaults.timeline;
        var time = twn.time();
        var duration = twn.totalDuration();

        var theKey = e.code.replace(/Numpad|Digit|Key|Arrow/gi, "");
        if(!isNaN(theKey)) {
            var theNum = theKey | 0;
            if(theNum>0) { twn.seek(duration * 0.1 * theNum); return; }
        }

        switch(theKey) {
            case "Enter": ad.onEnter && ad.onEnter(); break;
            case "Up": case "S": twn.seek(0); break;
            case "Down": case "E": gotoEnd(twn); break;
            case "0": twn.timeScale(1); break;
            case "Minus": twn.timeScale(twn.timeScale() *.5); break;
            case "Equal": twn.timeScale(twn.timeScale() * 2); break;
            case "Comma": case "Left": twn.seek(time-0.5 < 0 ? 0 : time-0.5); break;
            case "Period": case "Right": twn.seek(time+0.5); break;
            case "Space": twn.paused() ? twn.play() : twn.pause(); break;
            //default: trace(theKey);
        }
    });

    //Check if eyeBuild is missing:
    if (isDebug || !w['eyeBuild']) {
        trace("**eyeReturn not loaded!**");
        _THIS.callMain();
    } else {
        trace("eyeReturn loading...");
        eyeBuild.initialize();

        _THIS.clickTagHandler = function() { eyeBuild.doClick(0); };
        _THIS.callMain();
    }
};

p._onAdCreated = function() {
    var twn = defaults.timeline;
    if(!w['clickTag']) { writeWarning("MISSING CLICKTAG IN<br/>"+atlasURL); }

    var time = twn.totalDuration();
    if(twn.totalDuration()>animLimitSeconds) writeWarning("Animation too long<br/>" + time + "s &gt; " + animLimitSeconds + "s");
    else if(isDebug) writeWarning("Total Length<br/>" + time, "success");

    if(getQueryVariable('fast')) twn.timeScale(3);
    if(getQueryVariable('end')) gotoEnd(twn);
    if(getQueryVariable('pause')) {
        twn.seek(getQueryVariable('pause'));
        twn.pause();
    }
};

p._callMain = function() {
    var _THIS = this;
    if(w['atlasURL']!=null) {
        trace("Preloading atlasURL '%s' ...", atlasURL);
        var img = new Image();
        img.addEventListener("load", function() {
            trace("Downloaded atlasURL '%s'.", atlasURL);
            isDebug ? setTimeout( _THIS.prepareAd, 250 ) : _THIS.prepareAd();
        });
        img.src = atlasURL;
    } else _THIS._prepareAd();
};