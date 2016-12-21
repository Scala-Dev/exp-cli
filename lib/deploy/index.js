'use strict';

const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');

const auth = require('../auth');
const diff = require('./diff');
const upload = require('./upload');

const utils = require('../utils');


module.exports = function (options) {

  function getAppPath() {
    if (options.app) return Promise.resolve(options.app);

    return utils.prompt(colors.cyan('Enter path to app: '));
  }

  function getApp(exp, path, ctx) {
    return exp.findContent({ path, limit: 1, subtype: 'scala:content:app' })
      .then(apps => apps[0])
      .then(app => {
        if (!app) return createApp(exp, path, ctx);

        return app;
      });
  }

  function deleteContent(exp, content) {
    return exp.delete(`/api/content/${ content.uuid }`)
      .then(res => {
        console.log(`Deleted remote content: ${ content.document.path }`);
        return res;
      });
  }

  function confirmCreateApp() {
    return utils.confirm(colors.cyan('The app does not exist. Do you want to create it? (y/N) '), { default: 'N' })
      .then(ok => {
        if (!ok) throw new Error('Deploy cancelled.');
      });
  }

  function createApp(exp, path, ctx) {
    return confirmCreateApp().then(() => {
      return upload.createApp(exp, path).then(res => {
        ctx.uploadCount++;
        return res;
      });
    });
  }

  function deploy(exp, parent, cwd, ctx) {
    return parent.getChildren({ appContent: 'only' }).then(children => {
      return diff.getContentToDelete(cwd, children)
        .then(content => {
          // delete content
          return Promise.all(content.map(item => {
            return deleteContent(exp, item)
              .then(res => {
                ctx.deleteCount++;
                return res;
              });
          }));
        })
        .then(() => diff.getFilesToUpload(cwd, children))
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
          // create new folders, one level at a time
          return folders.reduce((promise, folder) => {
            return promise.then(() => {
              return upload.createFolder(exp, parent, folder)
                .then(remote => {
                  return deploy(exp, remote, path.join(cwd, folder.name), ctx);
                });
            });
          }, Promise.resolve());
        })
        .then(() => diff.getFoldersToSync(cwd, children))
        .then(folders => {
          // sync existing folder, one level at a time
          return folders.reduce((promise, folderToSync) => {
            return promise.then(() => {
              return deploy(exp, folderToSync.remote, path.join(cwd, folderToSync.name), ctx);
            });
          }, Promise.resolve());
        });
    });
  }

  return Promise.resolve().then(() => {
      if (!fs.existsSync(path.resolve('./index.html'))) throw new Error('No index.html file.  An app must include an index.html file at the root.');
    })
    .then(() => auth.start(options))
    .then(exp => {
      const deployContext = { uploadCount: 0, deleteCount: 0 };
      return getAppPath().then(path => {
        if (path.endsWith('/')) path = path.substring(0, path.length - 1);
        if (!path.startsWith('/')) path = `/${ exp.auth.identity.organization }/${ path }`;

        return getApp(exp, path, deployContext);
      })
      .then(app => {
        return deploy(exp, app, path.resolve('./'), deployContext).then(() => deployContext);
      });
    })
    .then(deployContext => {
      console.log(`Uploaded ${ deployContext.uploadCount } files`);
      process.exit(0);
    })
    .catch(err => {
      if (err.message) err = err.message;
      console.error(err);
      process.exit(1);
    });

};
