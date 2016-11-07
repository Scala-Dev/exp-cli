'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function md5(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);

    stream.on('data', data => {
      hash.update(data, 'utf8');
    });

    stream.on('error', err => {
      reject(err);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });
  });
}

function getContentToDelete(localDirectory, remotes) {
  const names = fs.readdirSync(localDirectory);

  return Promise.resolve(remotes.filter(content => names.every(name => name !== content.document.name)));
}

function getFilesToUpload(localDirectory, remotes) {
  const names = fs.readdirSync(localDirectory);

  const promises = names.filter(name => {
      return fs.statSync(path.join(localDirectory, name)).isFile();
    })
    .map(name => {
      return md5(path.join(localDirectory, name)).then(hash => { return { hash, name, path: path.join(localDirectory, name) }; });
    });

  return Promise.all(promises).then(files => {
    return files.filter(file => {
      const match = remotes.find(remote => remote.document.name === file.name);

      if (!match) {
        console.log(`Local file added: ${ file.path }`);
        return true;
      } else if (!match.document.properties || file.hash !== match.document.properties.md5) {
        console.log(`Local file changed: ${ file.path }`);
        return true;
      }

      return false;
    });
  });
}

function getFoldersToUpload(localDirectory, remotes) {
  const names = fs.readdirSync(localDirectory);

  const folders = names.filter(name => {
      return fs.statSync(path.join(localDirectory, name)).isDirectory();
    })
    .map(name => { return { name, path: path.join(localDirectory, name) }; });

  return folders.filter(folder => {
    const exists = remotes.some(remote => remote.document.name === folder.name);

    if (!exists) {
      console.log(`Local folder added: ${ folder.path }`);
      return true;
    }

    return false;
  });
}

function getFoldersToSync(localDirectory, remotes) {
  const names = fs.readdirSync(localDirectory);

  const folders = names.filter(name => {
      return fs.statSync(path.join(localDirectory, name)).isDirectory();
    })
    .map(name => { return { name, path: path.join(localDirectory, name) }; });

  return folders.filter(folder => {
    const match = remotes.find(remote => remote.document.name === folder.name);

    if (match) {
      folder.remote = match;
      return true;
    }

    return false;
  });
}

module.exports.getContentToDelete = getContentToDelete;
module.exports.getFilesToUpload = getFilesToUpload;
module.exports.getFoldersToUpload = getFoldersToUpload;
module.exports.getFoldersToSync = getFoldersToSync;
