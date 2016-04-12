/**
 * Created by Chamberlain on 10/04/2016.
 */
var trace = console.log.bind(console);
var log = console.log.bind(console);

AdPreloader.prototype._preload = function() {
    var _THIS = this;
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

    if(!w['clickTag']) {
        document.body.innerHTML += "<h1 class=\"warning\">MISSING<br/>CLICKTAG!</h1>";
    }

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

AdPreloader.prototype._onAdCreated = function() {
    trace("TOTAL DURATION: " + defaults.timeline.totalDuration());
};

AdPreloader.prototype._callMain = function() {
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