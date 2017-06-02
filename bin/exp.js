#!/usr/bin/env node

var commander = require('commander');
var devPlayer = require('../lib/dev-player');
var init = require('../lib/init');
var deploy = require('../lib/deploy');
var auth = require('../lib/auth');

commander.version('5.0.0');

commander.command('play')
  .description('launch a player app in your local browser on a player')
  .option('-p, --port [port]', 'the port to run on (8899)', parseInt)
  .option('-e, --host [host]', 'the remote host (https://eagle.goexp.io)')
  .option('-b, --browser [browser name]', 'the non-default browser name to launch')
  .action(function (env) {
    var options = {};
    options.path = './';
    options.host = env.host || 'https://eagle.goexp.io';
    options.port = env.port || 8899;
    options.browser = env.browser || '';
    devPlayer.start(options);
  });

commander.command('init')
  .description('create a player app in the current working directory')
  .action(init);

commander.command('deploy')
  .description('deploy a player app to your organization')
  .option('-a, --app [app]', 'the remote path of the app to deploy')
  .option('-H, --host [host]', 'the remote host (https://eagle.goexp.io)')
  .action(function (env) {
    var options = {};
    options.host = env.host || 'https://eagle.goexp.io';
    options.app = env.app;
    deploy(options);
  });

commander.command('logout')
  .description('remove any temporary credentials')
  .action(auth.logout);

commander.command('*', '',  { isDefault: true, noHelp: true })
  .action(function () {
    commander.help();
  });

commander.parse(process.argv);

if (!process.argv.slice(2).length) {
  commander.help();
}
