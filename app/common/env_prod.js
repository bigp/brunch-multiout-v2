/**
 * Created by Chamberlain on 10/04/2016.
 */

var trace, log;
trace = log = function(){};

AdPreloader.prototype._preload = function() {
    if (isDebug || !w['eyeBuild']) throw new Error("**eyeReturn not loaded!**");
    var _THIS = this;

    //Check if eyeBuild is missing:
    eyeBuild.initialize();

    _THIS.clickTagHandler = function() { eyeBuild.doClick(0); };
    _THIS.callMain();

};