'use strict';

var fs = require('fs');
var path = require('path');
var commander = require('commander-plus');
var colors = require('colors/safe');
var EXP = require('exp-sdk');


module.exports = function () {

  var configPath = path.join(path.resolve(getUserHome()), '.exp-cli.json');

  function getUserHome() {
    return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
  }

  function getCredentials() {
    return new Promise(resolve => {
        // prompt for login
        commander.promptSingleLine(colors.cyan('Enter Username: '), username => {
          commander.password(colors.cyan('Enter Password: '), password => {
            commander.promptSingleLine(colors.cyan('Enter Organization: '), organization => {
              resolve({ username, password, organization, enableNetwork: false });
            });
          });
        });
      });
  }

  function login() {
    return getCredentials().then(credentials => {
        var exp = EXP.start(credentials);

        return exp.getAuth()
          .then(auth => fs.writeFileSync(configPath, JSON.stringify({ auth })))
          .then(() => exp)
          .catch(err => { console.log(err); return login(); });
      });
  }

  function authenticate(config) {
    var exp = EXP.start({ auth: config.auth });

    return exp.getContent('root')
      .then(() => exp)
      .catch(err => { console.log(err); return login(); });
  }

  function getAppPath() {
    return new Promise(resolve => {
        // prompt for app path
        commander.promptSingleLine(colors.cyan('Enter path to app: '), path => {
          resolve(path);
        });
      });
  }



  Promise.resolve()
    .then(() => {
      if (fs.existsSync(configPath)) return require(configPath);
    })
    .then(config => {
      if (config && config.auth) return authenticate(config);
    
      return login();
    })
    .then(exp => {
      return getAppPath().then(path => {
        return exp.findContent({ path, limit: 1, subtype: 'scala:content:app' })
          .then(apps => apps[0])
          .then(app => { 
            if (!app || app.document.path !== path) throw 'App not found.';

            console.log('clearing app', app);
            // delete all children
            return app.getChildren().then(children => {
              console.log(children);

              return Promise.all(children.map(child => {
                console.log('child', child.document.name);
                if (child.document.name !== 'index.html') {
                  console.log('deleting', child.uuid);
                  return exp.delete('/api/content/' + child.uuid);
                }

              }));
            })
            .then(() => {
              // upload all of the new files
              console.log('ready to upload');
            });

          });
      });
    })
    .catch(err => console.log(err))
    .then(() => EXP.stop());
};
