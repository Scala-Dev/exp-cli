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
        commander.prompt(colors.cyan('Enter path to app:') + ' ', path => resolve(path));
      });
  }

  function getApp(exp, path) {
    return exp.findContent({ path, limit: 1, subtype: 'scala:content:app' })
      .then(apps => apps[0])
      .then(app => {
        if (!app) return createApp(exp, path);

        return app;
      });
  }

  function confirmCreateApp() {
    return new Promise((resolve, reject) => {
        // confirm create app
        commander.confirm(colors.cyan('App not found. Do you want to create it?') + ' ', ok => {
          if (ok) return resolve();
          reject('Deploy cancelled.');
        });
      });
  }

  function createApp(exp, path) {
    return confirmCreateApp().then(() => {
      return upload.createApp(exp, path);
    });
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
      return getAppPath().then(path => {
        if (path.endsWith('/')) path = path.substring(0, path.length - 1);
        if (!path.startsWith('/')) path = `/${ exp.auth.identity.organization }/${ path }`;

        return getApp(exp, path);
      })
      .then(app => {
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
