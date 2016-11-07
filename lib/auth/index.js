'use strict';

const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');
const EXP = require('exp-sdk');

const utils = require('../utils');

const configPath = path.join(path.resolve(getUserHome()), '.exp-cli');


function getUserHome() {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

function getCredentials(options) {
  return utils.prompt(colors.cyan('Enter Username: ')).then(username => {
      return utils.password(colors.cyan('Enter Password: ')).then(password => {
        return utils.prompt(colors.cyan('Enter Organization: ')).then(organization => {
          return { username, password, organization, host: options.host, enableNetwork: false };
        });
      });
    });
}

function login(options) {
  return getCredentials(options).then(credentials => {
      const exp = EXP.start(credentials);

      return exp.getAuth()
        .then(auth => fs.writeFileSync(configPath, JSON.stringify({ auth }), { mode: '600' }))
        .then(() => exp)
        .catch(err => {
          if (err.message) err = err.message;
          console.error(err);

          return login(options);
        });
    });
}

function authenticate(options, config) {
  const exp = EXP.start({ auth: config.auth, host: options.host, enableNetwork: false });

  return exp.getContent('root')
    .then(() => exp)
    .catch(err => {
      if (err.message) err = err.message;
      console.error(err);

      return login(options);
    });
}

function start(options) {
  return Promise.resolve()
    .then(() => {
      if (fs.existsSync(configPath)) return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    })
    .then(config => {
      if (config && config.auth) return authenticate(options, config);

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
