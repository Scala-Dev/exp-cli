'use strict';

const request = require('request');
const fs = require('fs');

function uploadFile(exp, parent, file) {
  const formData = {
    parent: parent.uuid,
    file: {
      value: fs.createReadStream(file.path),
      options: {
        filename: file.name
      }
    }
  };

  return new Promise((resolve, reject) => {
    request.post({
        url: ` ${ exp.auth.api.host }/api/content`,
        headers: {
          'authorization': `Bearer ${ exp.auth.token }`
        },
        formData: formData
      }, function (err) {
        if (err) {
          console.error('Upload failed: ', err);
          return reject(err);
        }

        console.log(`Uploaded file: ${ file.path }`);
        resolve();
      });
  });

}

function createFolder(exp, parent, folder) {
  return exp.post('/api/content', { parent: parent.uuid, name: folder.name, subtype: 'scala:content:folder' })
    .then(res => {
      console.log(`Created folder: ${ folder.path }`);
      return res;
    });
}

function createApp(exp, parent, appName) {
  return exp.post('/api/content', { parent: parent.uuid, name: appName, subtype: 'scala:content:app' })
    .then(res => {
      console.log(`Created app: ${ appName }`);
      return res;
    });
}



module.exports.uploadFile = uploadFile;
module.exports.createFolder = createFolder;
