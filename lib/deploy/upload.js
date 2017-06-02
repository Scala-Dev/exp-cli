'use strict';

const request = require('request');
const fs = require('fs');
const path = require('path');

// set global connection pool settings
const http = require('http');
http.globalAgent.keepAlive = true;
http.globalAgent.options.keepAlive = true;
http.globalAgent.maxSockets = 200;

const https = require('https');
https.globalAgent.keepAlive = true;
https.globalAgent.options.keepAlive = true;
https.globalAgent.maxSockets = 200;

function upload(exp, data) {
  return new Promise((resolve, reject) => {
    request.post({
        url: ` ${ exp._sdk.options.host }/api/content`,
        headers: {
          'authorization': `Bearer ${ exp.auth.token }`
        },
        formData: data
      }, (err, response, body) => {
        if (err) {
          reject({ code: 'network.error', message: err.toString() });
        } else if ( response.statusCode >= 400 ) {
          if (response.headers['content-type'] === 'application/json') {
            reject(JSON.parse(body));
          } else {
            reject({ code: 'unknown.error', message: body.toString() });
          }
        } else {
          resolve(JSON.parse(body));
        }
      });
  })
  .then(res => exp.getContent(res.uuid));
}

function uploadFile(exp, parent, file) {
  const data = {
    parent: parent.uuid,
    file: {
      value: fs.createReadStream(file.path),
      options: {
        filename: file.name
      }
    }
  };

  return upload(exp, data).then(res => {
      console.log(`Uploaded file to: ${ res.document.path }`);
      return res;
    })
    .catch(err => {
      console.error(`Upload file ${file.name} failed: `, err);
      throw err;
    });
}

function uploadApp(exp, parent, name) {
  const data = {
    parent: parent.uuid,
    subtype: 'scala:content:app',
    name,
    file: {
      value: fs.createReadStream(path.resolve('./index.html')),
      options: {
        filename: 'index.html'
      }
    }
  };

  return upload(exp, data).then(res => {
      console.log(`Created app: ${ res.document.path }`);
      return res;
    })
    .catch(err => {
      console.error('Upload app failed: ', err);
      throw err;
    });
}

function createFolder(exp, parent, folder) {
  return exp.post('/api/content', { parent: parent.uuid, name: folder.name, subtype: 'scala:content:folder' })
    .then(res => {
      console.log(`Created remote folder: ${ res.path }`);
      return exp.getContent(res.uuid);
    });
}

function getOrCreateFolder(exp, parent, folder) {
  return parent.getChildren().then(children => {
      return children.find(child => folder.name === child.document.name);
    })
    .then(child => {
      if (child) return child;

      return createFolder(exp, parent, folder);
    });
}

function createApp(exp, appPath) {
  const tokens = appPath.split(/\//).filter(token => token);

  if (tokens.length < 2) throw new Error('Absolute path is not valid.');

  if (exp.auth.identity.organization !== tokens[0]) throw new Error('Absolute path does not match current organization.');

  const name = tokens[tokens.length - 1];

  if (tokens.length === 2) {
    return uploadApp(exp, { uuid: 'root' }, name);
  }

  const folders = tokens.slice(1, tokens.length - 1);

  return exp.getContent('root').then(root => {
    return folders.reduce((promise, folder) => {
      return promise.then(parent => getOrCreateFolder(exp, parent, { name: folder }));
    }, Promise.resolve(root));
  }).then(parent => {
    return uploadApp(exp, parent, name);
  });

}


module.exports.uploadFile = uploadFile;
module.exports.createFolder = createFolder;
module.exports.createApp = createApp;
