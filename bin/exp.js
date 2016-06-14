#!/usr/bin/env node

var commander = require('commander');
var path = require('path');
var devPlayer = require('../lib/dev-player');
var init = require('../lib/init');

commander.version('0.0.5')

commander.command('play')
  .description('launch a player app in your local browser on a player')
  .option('-p, --port [port]', 'the port to run on (8899)', parseInt)
  .option('-e, --host [host]', 'the player host (https://player.goexp.io)')
  .action(function (env) {
    var options = {};
    options.path = './';
    options.host = env.host || 'https://player.goexp.io';
    options.port = env.port || 8899;
    devPlayer.start(options);
  });

commander.command('init')
  .description('create a player app in the current working directory')
  .action(init);

commander.command('*', '',  { isDefault: true, noHelp: true })
  .action(function () {
    commander.help();
  });

commander.parse(process.argv);

if (!process.argv.slice(2).length) {  
  commander.help();
}
