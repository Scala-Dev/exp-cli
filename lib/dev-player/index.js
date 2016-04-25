'use strict';

var express = require('express');
var proxy = require('express-http-proxy');
var url = require('url');
var path = require('path');
var watch = require('watch');
var socketIo = require('socket.io');
var http = require('http');
var open = require('open');

module.exports = {
  start : function (options) {
    var app = express();  
    var server = require('http').Server(app);
    var socket;
    var io = socketIo(server);
    
    // Proxy to the loader.
    app.get('/apps/23a31727-9578-4e22-9452-03fc7a0f9862/*', function (req, res) {
      res.sendFile(req.path.split('/').slice(3).join('/'), { root: __dirname + '/loader' });
    });
   
    // Proxy to the app.
    app.get('/apps/6be5bd3d-14dc-4a4d-a26a-a96c6538e062/*', function (req, res) {
      res.sendFile(req.path.split('/').slice(3).join('/'), { root: path.resolve(options.path) });
    });
    
    // Proxy to the player.
    app.use(proxy('https://player-develop.exp.scala.com', { 
      forwardPath: function (req, res) { 
        return url.parse(req.url).path; 
      }
    }));
    
    // Start the server.
    server.listen(options.port);

    // Open in browser.
    open('http://localhost:' + options.port);
    
    // Send refresh event down socket.
    watch.createMonitor(options.path, function (monitor) {
      monitor.on('changed', function () { io.emit('refresh'); });
    });
  }
};
