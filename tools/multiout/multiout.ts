declare var require;
declare var module;
declare var process;
const fs = require('fs');
const __dirModules = process.mainModule.paths[2];
const anymatch = require(__dirModules+'/anymatch');
const crypto = require('crypto');
const spawn = require('child_process').spawnSync;
const trace = console.log.bind(console);
const UTF_8 = {encoding: "utf-8"};
var root = "./app/";
var allFiles = recursiveGetFiles(root);
var isProduction = process.argv.indexOf("-p")>-1 ? 1 : 0;

function clear() {
    console.log('\033[2J');
}

function makeMD5(str:any):string {
    if(str==null) return "";
    return crypto.createHash('md5').update(str.toString()).digest('hex');
}

RegExp.prototype['toJSON'] = function() {
    return this.source;
};

function gsub(str, ... args) {
    //var args = Array.prototype.slice(arguments, 1);
    for(var a=args.length; --a>=0;) {
        var pattern = new RegExp("%"+a, "g");
        str = str.replace(pattern, args[a]);
    }
    return str;
}

function info(... args) {
    if(!multiout.config.isInfo) return;
    trace.apply(console, ["[INFO] "].concat(args));
}

function traceJSON(o) {
    if(!multiout.config.isDebug) return;
    trace(JSON.stringify(o, null, '  '));
}

var exceptions = 'node_modules,public,tools'.split(",");
function endsWith(path, char:string) {
    if(path.charAt(path.length-1)!=char) return path + char;
    return path;
}

function recursiveGetFiles(path, foundFiles:Array<string>=[], exceptions:Array<string>=[]) {
    path = endsWith(path, "/");
    var files = fs.readdirSync(path);
    files.forEach(function(file) {
        var fullpath = path + file;
        if(file.indexOf(".")==0) return;
        if(fs.lstatSync(fullpath).isDirectory()) {
            if(exceptions.indexOf(file)>-1) return;

            foundFiles.push(fullpath);
            recursiveGetFiles( fullpath, foundFiles);
        } else {
            foundFiles.push(fullpath);
        }
    });

    return foundFiles;
}

function fileExists(path:string):boolean {
    try {
        fs.statSync(path);
        return true;
    } catch(e) {
        return false;
    }
}

function resolveHandleBars(str:string, obj:any):string {
    if(str==null) return null;
    if(str.length>0) {
        for(var prop in obj) {
            if(!obj.hasOwnProperty(prop)) continue;
            //obj[prop]
            var propHandlebar = "{{" + prop + "}}";
            while(str.indexOf(propHandlebar)>-1) {
                str = str.replace(propHandlebar, obj[prop]);
            }
        }
    }

    return str;
}

function resolveEnvVars(str:string):string {
    return str.replace(/%([^%]+)%/g, function(_,n) {
        return process.env[n];
    });
}

function reduceExistingDirectories(arr:Array<string>):Array<string> {
    var TAG_CHECK_EXISTS = "@@";

    for(var r=arr.length; --r>=0;) {
        var resolved = arr[r];
        if(resolved.indexOf(TAG_CHECK_EXISTS)==0) {
            resolved = resolved.substr(TAG_CHECK_EXISTS.length);
            if(!fileExists(resolved)) {
                arr.splice(r, 1);
                continue;
            }

            arr[r] = resolved;
        }
    }
    return arr;
}

function removeBeginsWith(path:string, char:string):string {
    if(path.indexOf(char)==0) return path.substr(char.length);
    return path;
}

function readFile(path:string, replacements:any=null ):string {
    var data = fs.readFileSync(path, UTF_8);
    if(replacements!=null) {
        data = resolveHandleBars(data, replacements);
    }
    return data;
}

function copyFile(from:string, to:string) {
    fs.createReadStream(from).pipe(fs.createWriteStream(to));
}

module.exports.configMultiout = function(config) {
    var m = module.exports.multiout;
    m.config = config;

    if(config.init===true) {
        m.populateTypicalAdFormats();
    } else if(typeof(config.init)=="function") {
        config.init();
    }

    return m;
};

var multiout = module.exports.multiout = {
    cmdParam: null,
    config: null,
    before: function() { this.process("before"); },
    after: function() { this.process("after"); },

    populateTypicalAdFormats: function() {
        var config = this.config;
        if(!config) throw new Error("Missing multiout's config property!");
        if(!config.folderPattern) config.folderPattern = /^(en|fr)[0-9a-z_\-]*/i;
        if(!config.commonJS) config.commonJS = "app/common/env_" + (isProduction ? "prod\\.js" : "debug\\.js");
        if(!config.commonCSS) config.commonCSS = "app/common/.*\\.(less|css)";

        var vendorJS = "vendor\\/[a-zA-Z0-9_\\-\\/]*\\.js";
        var vendorCSS = "vendor\\/[a-zA-Z0-9_\\-\\/]*\\.(less|css)";
        if(config.commonJS) vendorJS += "|" + config.commonJS;
        if(config.commonCSS) vendorCSS += "|" + config.commonCSS;
        var jsFiles = {'js/vendor.js': new RegExp("^("+vendorJS+")")};
        var cssFiles = {'css/vendor.css': new RegExp("^("+vendorCSS+")")};

        this.populateWatchedFiles(allFiles);
        this.populateSeperateOutputs(config.folderPattern, ".js", jsFiles);
        //this.populateSeperateOutputs(folderPattern, ".css", cssFiles);
        this.populateSeperateOutputs(config.folderPattern, ".(less|css):.css", cssFiles);

        this.jsFiles = jsFiles;
        this.cssFiles = cssFiles;

        if(!isProduction && config.pollFileChanges) {
            this.runCustomFileChecker( config.pollFileChanges );
        }

        if(config.traceWatchedFiles) {
            var sep = "==========================================";
            trace(sep); trace("jsFiles: " + JSON.stringify(this.jsFiles, null, '  '));
            trace(sep); trace("cssFiles: " + JSON.stringify(this.cssFiles, null, '  '));
            trace(sep); trace("watchFolders: " + JSON.stringify(this.watchFolders, null, '  '));

            if(this.foundPrimary) {
                trace("\n   ** Working on primary file: " + this.foundPrimary.name + " **\n");
            }
        }
    },

    runCustomFileChecker: function(params) {
        var _THIS = this;
        var fileTypes = anymatch( params.fileTypes || "**/*.*" );
        var delay = params.delay || 1000;
        var trigger = params.trigger || function() { _THIS.before(); };
        var md5Before = null, isBusy = false;

        // TODO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        function getFileDate(file) {
            return fs.statSync(file)['mtime'];
        }

        function callCheck() {
            if(isBusy);
            var currentFiles = recursiveGetFiles(root);
            var validFiles = currentFiles.filter(fileTypes);
            var sumStats = "";
            validFiles.forEach(file => {sumStats += getFileDate(file);} );
            var md5Now = makeMD5( sumStats );

            if(md5Now!=md5Before) { //md5Before!=null
                isBusy = true;
                trigger();
                isBusy = false;
            }
            md5Before = md5Now;
            setTimeout( callCheck, delay );
        }

        setTimeout( callCheck, delay );
    },

    populateWatchedFiles: function(allFiles) {
        var config = this.config;
        if(!config.files) config.files = [];

        var files = config.files;
        var foundPrimary = null;
        var primaryFlagFile = config.primaryFlagFile || "focus.primary";

        var watchFolders = this.watchFolders = ["vendor","app/common"];
        var watchInitLength = watchFolders.length;

        allFiles.forEach( function(fullpath) {
            var shortpath = fullpath.substr(root.length);
            if(!config.folderPattern.test(shortpath) || shortpath.indexOf("/")>-1) return;

            var fileObj = {name: shortpath, fullpath: fullpath, isPrimary: false};
            multiout.internalFileLoop( fileObj );
            config.filesLoop && config.filesLoop(fileObj);
            files.push(fileObj);

            watchFolders.push(fullpath);

            var primaryPath = fullpath+"/"+primaryFlagFile;
            if(fileExists(primaryPath)) {
                if(foundPrimary) {
                    trace("\tThere can only be ONE place for the primary file:\n\t" + primaryPath + "\n\tfirst one found in:\n\t" + foundPrimary.name + "\n");
                    throw new Error("DUPLICATE PRIMARY FILE!");
                }

                foundPrimary = fileObj;
                fileObj.isPrimary = true;
            }
        });

        this.foundPrimary = foundPrimary;

        if(foundPrimary) {
            var filename = foundPrimary.name;
            watchFolders.splice(watchInitLength, watchFolders.length, foundPrimary.fullpath);
            config.folderPattern = new RegExp("^" + filename);
            trace("[PRIMARY FILE FOUND]: changing pattern to: \"%s\"\n", config.folderPattern);
        }
    },

    internalFileLoop: function(fileObj) {
        var dimensions = fileObj.name.match(/[0-9]*x[0-9]*/);
        if(!dimensions || dimensions.length==0) return;
        dimensions = dimensions[0].split("x");
        fileObj.width = dimensions[0] | 0; //Set the width
        fileObj.height = dimensions[1] | 0; //Set the height
    },

    populateSeperateOutputs: function(pattern:RegExp, ext:string, files:any={}):any {
        if(ext.indexOf('.')!=0) ext = "." + ext;
        var outputExt;
        if(ext.indexOf(':')>-1) {
            var ext2 = ext.split(":");
            ext = ext2[0];
            outputExt = ext2[1];
        } else {
            outputExt = ext;
        }

        //Filter files by pattern (EDIT: this only detects /app/ subfolders with ad-like patterns.
        allFiles.forEach( function(fullpath) {
            var completePath = fullpath;

            if(fullpath.indexOf(root)==0) fullpath = fullpath.substr(root.length);
            if(!pattern.test(fullpath) || fullpath.indexOf("/")>-1) return;

            var mergedname = endsWith(outputExt.substr(1), "/") + fullpath + outputExt;
            var filesSrc = "^"+removeBeginsWith(completePath,"./")+"/.*\\"+ext;
            var filesRegex = new RegExp(filesSrc,"gi");
            //trace(mergedname + " -- " + filesSrc + " -- " + filesRegex.source);

            files[mergedname] = filesRegex;
        });

        return files;
    },

    process: function(currentName:string) {
        if(!this.config) throw new Error("Missing configuration for multiout!");

        var config = this.config;
        var currentConfig = config[currentName];
        var currentTasks = currentConfig.tasks;
        var currentFiles = config.files;
        var _THIS = this;

        if(currentTasks==null) {
            info("  Missing 'tasks' in multiout's '" + currentName + "' section.");
            return;
        }

        if(currentFiles==null) {
            info("  Missing 'files' in multiout configuration file.");
            return;
        }

        if(currentConfig.inputFile!=null) {
            if(!fileExists(currentConfig.inputFile)) {
                info("'inputFile' missing / incorrect path: " + currentConfig.inputFile);
                return;
            } else {
                info("Reading file: " + currentConfig.inputFile);
                ////////////////////////////////////////////////////////////////////////////////////////////////////////////
                this._inputFileContent = readFile(currentConfig.inputFile);
            }
        }

        if(currentConfig.outputDir!=null) {
            this._outputDir = endsWith(currentConfig.outputDir, "/");
            if(!fileExists(this._outputDir)) {
                info("  'outputDir' does not exist yet - creating it now: " + this._outputDir);
                fs.mkdirSync(this._outputDir);
            }
        }

        info("[PROCESSING = %s]", currentName.toUpperCase());
        var isAFTER = currentName=="after";

        //Detect for primary file:
        if (_THIS.foundPrimary) {
            _THIS._indexDefault = _THIS._outputDir + _THIS.foundPrimary.name + ".html";
        }

        function showOutput(str, header) {
            if(str==null || str.length==0) return "";
            return header + " " + str;
        }

        currentFiles.forEach( function(adUnit) {
            if(_THIS.foundPrimary!=null) {
               if(_THIS.foundPrimary!=adUnit) return;
            }

            if(!fileExists("app/" + adUnit.name)) {
                info("  Skipping missing folder: " + adUnit.name);
                return;
            }

            currentTasks.forEach( function(task) {
                if(task.name==null || task.name.length==0 || task.off===true) return;
                var resolvedArgs = task.args==null ? [] : resolveHandleBars(task.args, adUnit).split(" ");
                reduceExistingDirectories(resolvedArgs);

                var taskExec = resolveEnvVars(task.name);

                info("  [TASK] %s %s", taskExec, "\n  ... " + resolvedArgs.join("\n  ... "));

                if(builtinTasks[task.name]!=null) {
                    builtinTasks[task.name].call(_THIS, adUnit, resolvedArgs, task);
                } else {
                    var cmd = spawn(taskExec, resolvedArgs, UTF_8);
                    if(task.silent || _THIS.config.silenceTasks) return;
                    var output =    showOutput(cmd.stdout, gsub("==== STDOUT %0 ====\n", task.name)) + "\n" +
                                    showOutput(cmd.stderr, gsub("==== STDERR %0 ====\n", task.name));
                    trace(output);
                }
            });
        });

        if(isAFTER) {
            if(_THIS._indexDefault==null) {
                _THIS._indexDefault = _THIS._lastHTMLFile;
                if(_THIS._indexDefault==null) { //Still no file written...
                    info("Default index file could not be written! :(");
                    return;
                }
            }

            var indexHTML = _THIS._outputDir + "index.html";
            info("Copying " + _THIS._indexDefault + " to index.html");
            if(!fileExists(_THIS._indexDefault)) {
                info("The file doesn't exist to copy as index.html file! " + _THIS._indexDefault);
                return;
            }
            copyFile(_THIS._indexDefault, indexHTML);
        }
    }
};

const TAG_MERGE = "@merge:";
const TAG_PASTE = "@paste:";
const TAG_SOURCES = "src=,href=".split(',');

var builtinTasks = {
    /*'prettytype': function(adUnit, configArgs, task) {
        var _THIS = this;
        var jsFile = _THIS._outputDir + "js/" + adUnit.name + ".js";
        trace(jsFile + " : "  + fileExists(jsFile));
        var jsContent = readFile(jsFile);
        var prettifiedTag = "@prettified ;)";
        //if(jsContent.indexOf(prettifiedTag)>-1) return;
        //var jsLines =
    },*/
    'merge-and-paste': function mergeAndPaste(adUnit, configArgs, task) {
        var _THIS = this;

        if(configArgs==null) {
            info("ERROR: incorrect 'args' passed to built-in task 'merge-and-paste': " + configArgs)
            return;
        }

        var htmlOut = _THIS._outputDir + removeBeginsWith( resolveHandleBars( configArgs[0], adUnit ), "./" );

        var htmlTemplate = resolveHandleBars(_THIS._inputFileContent, adUnit);
        if(htmlTemplate==null || htmlTemplate.length==0) return;

        var buffers = {};
        var mergedLines = [];
        var htmlLines = htmlTemplate.split("\n");

        function getSource(tag:string, line:string, lookupData:boolean):any {
            var result = {name: null, data: null, filename: null, altFilename:null};
            var tagStart = line.indexOf(tag);
            if(tagStart==-1) return null;

            var name = line.substr(tagStart + tag.length).trim();
            var matchName = name.match(/[a-z0-9\-_\.]*/i);
            if(matchName==null || matchName.length==0) {
                result.name = null;
            } else {
                result.name = matchName[0];
            }

            if(lookupData) {
                for(var t=TAG_SOURCES.length; --t>=0;) {
                    var src = TAG_SOURCES[t];
                    var srcID = line.indexOf(src);
                    if(srcID==-1) continue;
                    var quoteStart = srcID + src.length + 1;
                    var quoteEnd = line.indexOf("\"", quoteStart);
                    result.filename = removeBeginsWith(line.substring(quoteStart, quoteEnd), "/");
                    result.altFilename = _THIS._outputDir + result.filename;

                    if(fileExists(result.filename)) {
                        result.data = readFile(result.filename, adUnit);
                    } else if(fileExists(result.altFilename)) {
                        result.data = readFile(result.altFilename, adUnit);
                    } else {
                        info("'merge-and-paste' > SRC=/HREF= not found: " + result.filename + " || " + result.altFilename);
                        continue;
                    }

                    break;
                }
            }

            return result;
        }

        //First, iterate to "merge" the data in specific string variables:
        for(var m=0; m<htmlLines.length; m++) {
            var line = htmlLines[m];
            var o = getSource(TAG_MERGE, line, true);
            if(o==null || o.name==null || o.data==null) {
                mergedLines.push(line);
                continue;
            }

            if(buffers[o.name]==null) { buffers[o.name] = []; }

            info("  Writing to the buffer: " + o.name + "\t-> " + o.data.length + " chars ...");
            buffers[o.name].push( o.data );
        }

        for(var p=0; p<mergedLines.length; p++) {
            var o = getSource(TAG_PASTE, mergedLines[p], false);
            if(o==null || o.name==null) continue;
            var buffer = buffers[o.name];
            if(buffer==null) {
                info("  Buffer is empty: " + o.name);
                continue;
            }

            mergedLines[p] = buffer.join("\n");
        }

        var output = mergedLines.join("\n");

        function escapedForRegex(str) {
            str = str.replace(/\./g, "\\.");
            str = str.replace(/\-/g, "\\-");
            return str;
        }

        var reps = task.replace;
        if(reps!=null) {
            for(var r=0; r<reps.length; r+=2) {
                var a = escapedForRegex(reps[r]);
                var b = reps[r+1];

                output = output.replace(new RegExp(a, "g"), b);
            }
        }

        fs.writeFileSync(htmlOut, output, UTF_8);
        info("  -- Writing HTML file: " + htmlOut);

        _THIS._lastHTMLFile = htmlOut;

    }
};