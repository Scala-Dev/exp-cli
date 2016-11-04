'use strict';

const path = require('path');
const commander = require('commander-plus');
const colors = require('colors/safe');

const auth = require('../auth');
const diff = require('./diff');
const upload = require('./upload');


module.exports = function (options) {

  function getAppPath() {
    return new Promise(resolve => {
        if (options.app) return resolve(options.app);
        // prompt for app path
        commander.promptSingleLine(colors.cyan('Enter path to app: '), path => resolve(path));
      });
  }

  function getApp(exp) {
    return getAppPath()
      .then(path => exp.findContent({ path, limit: 1, subtype: 'scala:content:app' }))
      .then(apps => apps[0]);
  }

  function deploy(exp, parent, cwd, ctx) {
    return parent.getChildren({ appContent: 'only' }).then(children => {
      return diff.getFilesToUpload(cwd, children)
        .then(files => {
          // upload files
          return Promise.all(files.map(file => {
            return upload.uploadFile(exp, parent, file)
              .then(res => {
                ctx.uploadCount++;
                return res;
              });
          }));
        })
        .then(() => diff.getFoldersToUpload(cwd, children))
        .then(folders => {
          // create new folders
          return Promise.all(folders.map(folder => {
            return upload.createFolder(exp, parent, folder)
              .then(response => exp.getContent(response.uuid))
              .then(remote => {
                return deploy(exp, remote, path.join(cwd, folder.name), ctx);
              });
          }));
        })
        .then(() => diff.getFoldersToSync(cwd, children))
        .then(folders => {
          // sync existing folder
          return Promise.all(folders.map(folderToSync => {
            return deploy(exp, folderToSync.remote, path.join(cwd, folderToSync.name), ctx);
          }));
        });
    });
  }

  return auth.start(options)
    .then(exp => {
      return getApp(exp).then(app => {
        if (!app) throw 'App not found.'; //TODO create app

        const deployContext = { uploadCount: 0 };

        return deploy(exp, app, path.resolve('./'), deployContext).then(() => deployContext);
      });
    })
    .then(deployContext => {
      console.log(`Uploaded ${ deployContext.uploadCount } files`);
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });

};
