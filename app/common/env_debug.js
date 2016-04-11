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

    //Check if DoubleClick Enabler is missing:
    if (isDebug || !w['Enabler'] || !w['studio']) {
        trace("**DoubleClick Enabler not loaded!**");
        _THIS.callMain();
    } else {
        trace("DoubleClick loading...");
        var SE = studio.events.StudioEvent;

        function Enabler_init() {
            // Polite loading
            Enabler.isVisible() ? _THIS.callMain() : Enabler.addEventListener(SE.VISIBLE, _THIS.callMain);

            _THIS.clickTagHandler = function Enabler_clickTag() { Enabler.exit('Background Exit'); };
        }

        // If true, start function. If false, listen for INIT.
        Enabler.isInitialized() ? Enabler_init() : Enabler.addEventListener(SE.INIT, Enabler_init);
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