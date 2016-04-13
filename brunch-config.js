var trace = console.log.bind(console);
var isProduction = process.argv.indexOf("-p")>-1 ? 1 : 0;

var multiout = require("./tools/multiout/multiout.js").configMultiout({
  filesLoop: function(fileObj) {
    fileObj.borderWidth = fileObj.width - 2;
    fileObj.borderHeight = fileObj.height - 2;
  },

  init: true,
  isDebug: isProduction==0,
  pollFileChanges: {
    fileTypes: /\.png/,
    delay: 2000,
    trigger: function() {
      multiout.before();
      multiout.sendMessage(['page']);
    }
  },

  //isInfo: true,
  traceWatchedFiles: false,
  silenceTasks: false,

  before: {
    tasks: [
        //--force-publish
      {name: 'texturepacker', off: true, args: "--force-publish --data app/{{name}}/{{name}}.less --sheet public/{{name}}.png @@app/{{name}}/images @@app/images_{{width}}x{{height}} @@app/images_common app/atlas_common.tps"},
      {name: '%PNGQUANT%/pngquant.exe', off: true, silent: true, args: "--force --verbose --quality=60-80 --output public/{{name}}-fs8.png -- public/{{name}}.png"}
    ]
  },

  after: {
    inputFile: "app/index.html",
    outputDir: "public/",
    outputName: "{{name}}.html",
    tasks: [
      //{name: 'prettytype', silent: false},
      {name: 'merge-and-paste', silent: true, args: "{{name}}.html", replace: [".png","-fs8.png"]}
    ]
  }
});

module.exports = {
  // See http://brunch.io for documentation.
  modules: { wrapper: false, definition: false },
  paths: {
    "public": "public",
    "watched": multiout.watchFolders
  },
  overrides: {
    production: {
      optimize: false,
      plugins: {
        uglify: {
          mangle: true,
          dead_code: true,
          sequences: true,
          properties: true,
          conditionals: true,
          //beautify: true,
          compress: { global_defs: { DEBUG: false }, hoist_vars: true }
        }
      }
    }
  },

  //optimize: true,
  sourceMaps: false,
  plugins: {
    less: { enabled: true, modules: false },
    autoReload: {
      enabled: true,  //delay: 300
      exposeSendMessage: function(func) {
        multiout.sendMessage = func;
      },
      match: {
        stylesheets: '**/*.css',
        javascripts: '**/*.js'
      }
    }//,
    /*
    uglify: {
      mangle: false, //used to be: true
      dead_code: true,
      sequences: true,
      properties: true,
      conditionals: true,
      compress: { global_defs: { DEBUG: false }, hoist_vars: true }
    }
    */
  },

  preCompile: function() {
    //multiout.before();
  },
  hooks: {
    onCompile: function() {
      multiout.after();
    }
  },


  files: {
    javascripts: { joinTo: multiout.jsFiles },
    stylesheets: { joinTo: multiout.cssFiles, order: { before: ['vendor/common/reset.css'] }},
    templates: { joinTo: 'app.js' }
  }
};
