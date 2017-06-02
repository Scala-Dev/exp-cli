'use strict';

var express = require('express');
var url = require('url');
var path = require('path');
var watch = require('watch');
var socketIo = require('socket.io');
var http = require('http');
var open = require('open');
var httpProxy = require('http-proxy');

module.exports = {
  start : function (options) {
    var app = express();
    var server = http.Server(app);
    var updateServer = http.createServer((req, res) => {
      res.writeHead(500);
      res.end();
    });
    var io = socketIo(updateServer);

    var proxy = httpProxy.createProxyServer({
      target: options.host,
      ws: true,
      secure: false,
      changeOrigin: true,
      xfwd: true
    });


    // Proxy to the loader.
    app.get('/player/apps/23a31727-9578-4e22-9452-03fc7a0f9862/*', function (req, res) {
      res.sendFile(req.path.split('/').slice(4).join('/'), { root: __dirname + '/loader' });
    });

    // Proxy to the app.
    app.get('/player/apps/6be5bd3d-14dc-4a4d-a26a-a96c6538e062/*', function (req, res) {
      res.sendFile(req.path.split('/').slice(4).join('/'), { root: path.resolve(options.path) });
    });

    app.get('/', function (req, res) {
      res.redirect('/player');
    });

    app.get('', function (req, res) {
      res.redirect('/player');
    });


    // Proxy to the player.
    app.use(function (req, res) {
      proxy.web(req, res);
    });

    server.on('upgrade', function (req, socket, head) {
      proxy.ws(req, socket, head);
    });

    // Start the server.
    server.listen(options.port);
    updateServer.listen(options.port + 1);

    // Open in browser.
    open('http://localhost:' + options.port + '/player', options.browser);

    // Send refresh event down socket.
    watch.createMonitor(options.path, function (monitor) {
      monitor.on('changed', function () { io.emit('refresh'); });
    });
  }
};
