# **Dependencies**

If you wish to build texture-atlases with TexturePacker (as demonstrated in this configuration), you will need a licensed copy of it. (may also need a custom LESSCSS exporter-format for the CSS classes to be used properly).

Also, you will need PNGQuant to compress the resulting PNG atlases.

Changes:

* Removed the need for separate configuration file (moved multiout-config.json to brunch-config.js).
* Moved common configuration settings to multiout.ts.
* Folder name detection greatly improved!
	* No more need for manually hand-coding each individual ad files.
	* `filesLoop` can be used to supply a function that stores extra fields on each file objects (ie: borderWidth, borderHeight).
	* Internally parses the filename to catch the {width} and {height} properties of each file objects.
* Primary file is assigned a bit differently now.
	* Now you need to add a special file (can be empty), as long it has the filename ``.

# Brunch app

This is HTML5 application, built with [Brunch](http://brunch.io).

## Getting started
* Install (if you don't have them):
    * [Node.js](http://nodejs.org): `brew install node` on OS X
    * [Brunch](http://brunch.io): `npm install -g brunch`
    * Brunch plugins and app dependencies: `npm install`
* Run:
    * `brunch watch --server` — watches the project with continuous rebuild. This will also launch HTTP server with [pushState](https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history).
    * `brunch build --production` — builds minified project for production
* Learn:
    * `public/` dir is fully auto-generated and served by HTTP server.  Write your code in `app/` dir.
    * Place static files you want to be copied from `app/assets/` to `public/`.
    * [Brunch site](http://brunch.io), [Getting started guide](https://github.com/brunch/brunch-guide#readme)

	
# About this specific Skeleton...

Writing plain HTML5 ad animations doesn't mean you have to waste your time rewriting the same HTML files, copy your CSS resets and JS librairies. Also, you CERTAINLY do NOT want to open TexturePacker everytime you make a change or add images, right?

Welcome to the skeleton that will save your life.

Essentially, this not only watches for file-changes, but updates each specific ad units into their own separate HTML, JS and CSS files.

What's more, it can also inline all the JS and CSS right into the end product HTML output.

While testing a particular animation, it usually makes sense to test it on *localhost:3333* but given you have seperate HTML pages per ads, how do you indicate which one you are actively working on?

You must add an empty *.primary.txt* file in the *app/your_ad_name/* folder of your choice.

A typical configuration file looks something like this:

	var multiout = require("./tools/multiout/multiout.js").configMultiout({
	  filesLoop: function(fileObj) {
		fileObj.borderWidth = fileObj.width - 2;
		fileObj.borderHeight = fileObj.height - 2;
	  },

	  init: true,
	  isDebug: process.argv.indexOf("-p")>-1 ? 1 : 0,
	  //isInfo: true,
	  traceWatchedFiles: true,

	  before: {
		tasks: [
		  {name: 'texturepacker', silent: true, args: "--force-publish --data app/{{name}}/{{name}}.less --sheet public/{{name}}.png @@app/{{name}}/images @@app/images_{{width}}x{{height}} @@app/images_common app/atlas_common.tps"},
		  {name: '%PNGQUANT%/pngquant.exe', off:true, silent: false, args: "--force --verbose --quality=45-85 --output public/{{name}}-fs8.png -- public/{{name}}.png"}
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
	
Easy as 1 - 2 - 3 right?