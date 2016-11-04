'use strict';

const fs = require('fs');
const path = require('path');
const commander = require('commander-plus');
const colors = require('colors/safe');
const EXP = require('exp-sdk');

var configPath = path.join(path.resolve(getUserHome()), '.exp-cli');

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

function login(options) {
  return getCredentials().then(credentials => {
      credentials.host = options.host;

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

function start(options) {
  return Promise.resolve()
    .then(() => {
      if (fs.existsSync(configPath)) return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    })
    .then(config => {
      if (config && config.auth) return authenticate(config);

      return login(options);
    });
}

function logout() {
  fs.unlinkSync(configPath);
}

function stop(sdk) {
  if (sdk) return sdk.stop();

  EXP.stop();
}

module.exports.start = start;
module.exports.stop = stop;
module.exports.logout = logout;
