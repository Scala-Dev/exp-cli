'use strict';

var fs = require('fs');
var path = require('path');
var files = ['index.html', 'style.css', 'main.js', 'manifest.json'];

module.exports = function () {
  files.forEach(function (filename) {
    var source = path.join(__dirname, 'boilerplate', filename);
    var target = path.join(path.resolve('./'), filename);
    var stats;
    try {
      stats = fs.statSync(target);
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        fs.createReadStream(source).pipe(fs.createWriteStream(target));
        console.log('Created file: ' + target);
      } else {
        console.log('Unknown error trying to create file: ' + target);
      }
      return;
    }
    console.log('Skipping file: ' + target + ' (file already exists)');
    return;
  });
};
