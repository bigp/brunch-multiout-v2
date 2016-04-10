var trace = console.log.bind(console);
var isProduction = process.argv.indexOf("-p")>-1 ? 1 : 0;
var multiout = require("./tools/multiout/multiout.js").configMultiout({
  filesLoop: function(fileObj) {
    fileObj.borderWidth = fileObj.width - 2;
    fileObj.borderHeight = fileObj.height - 2;
  },

  init: true,
  isDebug: isProduction==0,
  //isInfo: true,
  traceWatchedFiles: true,

  before: {
    tasks: [
      {name: 'texturepacker', silent: false, args: "--force-publish --data app/{{name}}/{{name}}.less --sheet public/{{name}}.png @@app/{{name}}/images @@app/images_{{width}}x{{height}} @@app/images_common app/atlas_common.tps"},
      {name: '%PNGQUANT%/pngquant.exe', off: false, silent: false, args: "--force --verbose --quality=45-85 --output public/{{name}}-fs8.png -- public/{{name}}.png"}
    ]
  },

  after: {
    inputFile: "app/index.html",
    outputDir: "public/",
    outputName: "{{name}}.html",
    tasks: [
      {name: 'merge-and-paste', silent: true, args: "{{name}}.html {\"replace\":[\".png\",\"-fs8.png\"]}" },
    ]
  }
});

module.exports = {
  // See http://brunch.io for documentation.
  modules: { wrapper: false, definition: false },

  //optimize: true,
  sourceMaps: false,
  plugins: {
    less: { enabled: true, modules: false },
    autoReload: { enabled: true }, //delay: 300
    uglify: {
      mangle: true,
      dead_code: true,
      sequences: true,
      properties: true,
      conditionals: true,
      compress: { global_defs: { DEBUG: false }, hoist_vars: true }
    }
  },

  preCompile: function() {
    multiout.process("before", isProduction);
  },
  onCompile: function() {
    multiout.process("after", isProduction);
  },

  files: {
    javascripts: { joinTo: multiout.jsFiles },
    stylesheets: { joinTo: multiout.cssFiles, order: { before: ['vendor/common/reset.css'] }},
    templates: { joinTo: 'app.js' }
  }
};
