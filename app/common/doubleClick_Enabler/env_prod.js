/**
 * Created by Chamberlain on 10/04/2016.
 */

var trace, log;
trace = log = function(){};

AdPreloader.prototype._preload = function() {
    if(!w['Enabler'] || !w['studio']) throw new Error("Missing Enabler");
    var _THIS = this;
    var SE = studio.events.StudioEvent;

    function Enabler_init() {
        // Polite loading
        Enabler.isVisible() ? _THIS.callMain() : Enabler.addEventListener(SE.VISIBLE, _THIS.callMain);

        _THIS.clickTagHandler = function Enabler_clickTag() { Enabler.exit('Background Exit'); };
    }

    // If true, start function. If false, listen for INIT.
    Enabler.isInitialized() ? Enabler_init() : Enabler.addEventListener(SE.INIT, Enabler_init);
};