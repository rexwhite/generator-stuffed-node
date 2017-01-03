### Common Goals
- compile .jade into .html
- injector: add scripts to index.html
- wiredep: add bower components to index.html

### Dev Goals
- some sort of browser sync (livereload?)
  - inject livereload into index.html during dev builds
- restart node on server changes (nodemon?)

src -> dev -> prod

build html from jade files
copy all js, html, css and ico files from client to prod
copy all client/assets files to prod
copy all js files from server to prod
copy node_modules to prod
inject project and bower css and js into index.html 

problems:
1. jade files needs to get compiled and copied to prod.  If we delete a 
jade file, the corresponding html file needs to go away.

### Prod Goals
combine cdnify, bower pruning and concat/minify

> stuff to cdn-ify goes outside of wiredp / inject blocks
  
----------------

- [ ] optimize images (imagemin, with grunt-newer)

- [ ] bower preen

- [x] pre concat
  - [x] preload angular html templates (grunt-angular-templates - ngtemplates)

- [x] concatenate (concat driven by usemin): 
  - [x] js
  - [x] css

- [ ] post concat?
  - [ ] postcss
    - [ ] remove unused css (uncss)
    - [x] add browser prefixes (autoprefixer)
    - [x] minify css (cssnano)

- [x] pre uglify
  - [x] fix angular dependency injections to be minify safe (ngannotate)

- [ ] minify:
  - [x] js (uglify)
  - [ ] css (cssmin)

- [ ] version static assets (grunt-rev)

- [x] replace references to assets with their minified versions (usemin: concat, uglify, cssmin, grunt-rev)

- [X] post usemin
  - [x] use cdn versions of google libs (cdnify)

- [ ] minify index.html? (grunt-htmlmin)

- [ ] push to gear
