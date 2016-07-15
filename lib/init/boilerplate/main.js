'use strict';

function load () {
  console.log('App is now loading.');
  return exp.getCurrentDevice().then(function (device) {
    document.getElementById('name').textContent = device.name;
  });
}

function play () {
  console.log('App is now playing.');
}


function unload () {
  // clean up any mess we made
}
