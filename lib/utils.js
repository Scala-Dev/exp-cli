'use strict';

const promptly = require('promptly');

function confirm(message, opts) {
  return new Promise((resolve, reject) => {
      promptly.confirm(message, opts, (err, value) => {
        if (err) return reject(err);
        resolve(value);
      });
    });
}

function prompt(message, opts) {
  return new Promise((resolve, reject) => {
      promptly.prompt(message, opts, (err, value) => {
        if (err) return reject(err);
        resolve(value);
      });
    });
}

function password(message, opts) {
  return new Promise((resolve, reject) => {
      promptly.password(message, opts, (err, value) => {
        if (err) return reject(err);
        resolve(value);
      });
    });
}

module.exports.confirm = confirm;
module.exports.prompt = prompt;
module.exports.password = password;
