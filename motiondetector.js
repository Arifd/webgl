/*********************************************************************
*  Heavily modified by Arif Driessen, combing:
*  - https://github.com/jasonmayes/JS-Motion-Detection/
*  - https://github.com/ReallyGood/js-motion-detection/
*********************************************************************/

// Global variable that holds the output
var motionDetectorOutput;

// Cross browser support to fetch the correct getUserMedia object.
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia
  || navigator.mozGetUserMedia || navigator.msGetUserMedia;

// Cross browser support for window.URL.
window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;


var MotionDetector = (function() {
  var alpha = 0.5;
  var version = 0;
  var greyScale = false;

  // create webcam stream
  var video      = document.createElement('video');
  video.width    = 430;
  video.height   = 360;
  //video.autoplay = true;
  var canvas = document.createElement('canvas');
  canvas.width = video.width;
  canvas.height = video.height;
  var canvasFinal = document.createElement('canvas');
  canvasFinal.width = video.width;
  canvasFinal.height = video.height;
  //document.body.appendChild(canvasFinal);
  motionDetectorOutput = canvasFinal;   // global variable is set here

  var ctx = canvas.getContext('2d');
  // mirror the image
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);


  var ctxFinal = canvasFinal.getContext('2d');
  var localStream = null;
  var imgData = null;
  var imgDataPrev = [];
 
  function success(stream) {
    localStream = stream;
    // Create a new object URL to use as the video's source.
    video.srcObject = stream
    video.play();
  }

  function handleError(error) {
    console.error(error);
  }

    function fastAbs(value) {
    // funky bitwise, equal Math.abs
    return (value ^ (value >> 31)) - (value >> 31);
  }

  function threshold(value) {
    return (value > 0x15) ? 0xFF : 0;
  }

  function difference(target, data1, data2) {
    // blend mode difference
    if (data1.length != data2.length) return null;
    var i = 0;
    while (i < (data1.length * 0.25)) {
      target[4 * i] = data1[4 * i] == 0 ? 0 : fastAbs(data1[4 * i] - data2[4 * i]);
      target[4 * i + 1] = target[4 * i]; //data1[4 * i + 1] == 0 ? 0 : fastAbs(data1[4 * i + 1] - data2[4 * i + 1]);
      target[4 * i + 2] = target[4 * i]; //data1[4 * i + 2] == 0 ? 0 : fastAbs(data1[4 * i + 2] - data2[4 * i + 2]);
      target[4 * i + 3] = 0xFF;
      ++i;
    }
  }

  function differenceAccuracy(target, data1, data2) {
    if (data1.length != data2.length) return null;
    var i = 0;
    while (i < (data1.length * 0.25)) {
      var average1 = (data1[4 * i] + data1[4 * i + 1] + data1[4 * i + 2]) / 3;
      var average2 = (data2[4 * i] + data2[4 * i + 1] + data2[4 * i + 2]) / 3;
      var diff = threshold(fastAbs(average1 - average2));
      target[4 * i] = diff;
      target[4 * i + 1] = diff;
      target[4 * i + 2] = diff;
      target[4 * i + 3] = 0xFF;
      ++i;
    }
  }

  function snapshot() {
    if (localStream) {
      // canvas.width = video.offsetWidth;
      // canvas.height = video.offsetHeight;
      // canvasFinal.width = video.offsetWidth;
      // canvasFinal.height = video.offsetHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Must capture image data in new instance as it is a live reference.
      // Use alternative live referneces to prevent messed up data.
      imgDataPrev[version] = ctx.getImageData(0, 0, canvas.width, canvas.height);
      version = (version == 0) ? 1 : 0;

      imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      //faster difference function taken from: https://github.com/ReallyGood/js-motion-detection/blob/master/js/app.js
      differenceAccuracy(imgData.data, imgData.data, imgDataPrev[version].data);
      
      ctxFinal.putImageData(imgData, 0, 0);
    }
  }
  
  function init_() {
    if (navigator.getUserMedia) { 
      navigator.getUserMedia({video:true}, success, handleError);
    } else { 
      console.error('Your browser does not support getUserMedia');
    }
    window.setInterval(snapshot, 100);
  }

  return {
    init: init_
  };
})();

MotionDetector.init();