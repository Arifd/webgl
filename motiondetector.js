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

  // create webcam stream
  var video      = document.createElement('video');
  video.width    = 430;  // 430
  video.height   = 360; // 360
  //video.autoplay = true;
  var canvas = document.createElement('canvas');
  canvas.width = video.width;
  canvas.height = video.height;
  var canvasFinal = document.createElement('canvas');
  canvasFinal.width = video.width;
  canvasFinal.height = video.height;
  // local copy of canvas.width/height for speed
  var canvasWidth = canvas.width;
  var canvasHeight = canvas.height;
  //document.body.appendChild(canvasFinal);
  motionDetectorOutput = canvasFinal;   // global variable is set here

  var ctx = canvas.getContext('2d');
  // mirror the image
  ctx.translate(canvasWidth, 0);
  ctx.scale(-1, 1);

  var ctxFinal = canvasFinal.getContext('2d');
  var localStream = null;

  // md = motion detector, hm = heatmap
  var imgData = null;
  var imgDataPrev = [];
  var version = 0;
  
  var feedbackData = new Uint8ClampedArray(canvasWidth * canvasHeight * 4); // this will store a feedback loop of previous iterations

  // this will hold the image to be sent to GPU
  var webcamImage = new Image();

  function success(stream) {
    localStream = stream;
    // Create a new object URL to use as the video's source.
    video.srcObject = stream
    video.play();

    // Setup GPU to receieve a texture (doing it here to minimize unnecesary gl calls during render loop)   
    let webcamTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + 1);
    gl.bindTexture(gl.TEXTURE_2D, webcamTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

    function fastAbs(value) {
    // funky bitwise, equal Math.abs
    return (value ^ (value >> 31)) - (value >> 31);
  }

  function threshold(value) {
    return (value > 0x30) ? 0xFF : 0; // threshold was 0x15
  }

function difference(target, data1, data2) {
    // blend mode difference
    // error checking
    //if (data1.length != data2.length) return null;
    var i = 0;
    const iteratorLength = data1.length;
    while (i < iteratorLength) {
      let diff = fastAbs(data1[i] - data2[i]); // only need to work on one channel
      target.data[i] = data1[i] == 0 ? 0 : diff * 5;
      target.data[4 * i + 1] = data1[4 * i + 1] == 0 ? 0 : fastAbs(data1[4 * i + 1] - data2[4 * i + 1]);
      target.data[4 * i + 2] = data1[4 * i + 2] == 0 ? 0 : fastAbs(data1[4 * i + 2] - data2[4 * i + 2]);
      target.data[4 * i + 3] = 0xFF;
      i += 4;
    }
  }

  function differenceAccuracy(target, data1, data2) {
    // no error checking
    //if (data1.length != data2.length) return null;
    var i = 0;
    const rows = target.width * 12; // there are 4 channels for every pixel in with. but because I want the pixels to shift up THREE rows at a time, we multiply by 2 * 4
    const iteratorLength = data1.length * 0.25;
    while (i < iteratorLength) {
      let ii = 4 * i;
      ///// with rgb averaging
      var average1 = (data1[ii] + data1[ii + 1] + data1[ii + 2]) / 3;
      var average2 = (data2[ii] + data2[ii + 1] + data2[ii + 2]) / 3;
      var diff = threshold(fastAbs(average1 - average2));

      //if(diff)
      {
        feedbackData[ii]     = fastAbs(feedbackData[(ii    ) + rows] * 0.85 + diff);
        feedbackData[ii + 1] = fastAbs(feedbackData[(ii + 1) + rows] * 0.85 + diff);
        feedbackData[ii + 2] = fastAbs(feedbackData[(ii + 2) + rows] * 0.85 + diff);
        feedbackData[ii + 3] =  0xFF;      
      }

      target.data[ii]     = feedbackData[4*i];
      target.data[ii + 1] = feedbackData[4*i+1];
      target.data[ii + 2] = feedbackData[4*i+2];
      target.data[ii + 3] = 0xFF;
      ++i;
    }
  }

  function snapshot() {
    if (localStream) {
      // canvasWidth = video.offsetWidth;
      // canvasHeight = video.offsetHeight;
      // canvasFinal.width = video.offsetWidth;
      // canvasFinal.height = video.offsetHeight;

      ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);

      // Must capture image data in new instance as it is a live reference.
      // Use alternative live referneces to prevent messed up data.
      imgDataPrev[version] = ctx.getImageData(0, 0, canvasWidth, canvasHeight); 
      //let feedbackData = imgDataPrev[version].data;

      version = (version == 0) ? 1 : 0;
      
      imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

      //faster difference function taken from: https://github.com/ReallyGood/js-motion-detection/blob/master/js/app.js
      differenceAccuracy(imgData, imgData.data, imgDataPrev[version].data);
      //imgData = Sobel(imgData).toImageData();


      ctxFinal.putImageData(imgData, 0, 0);

      // SEND TO FINAL DESTINATION/OUTPUT (IN THIS CASE, GPU)
      setTimeout(updateGPU);
    }
  }
  
  function updateGPU()
  {
    // make an image from the canvas and send it out asap.
      webcamImage.src = motionDetectorOutput.toDataURL();
      webcamImage.onload = () => gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, webcamImage);
  }

  function init_() {
    if (navigator.getUserMedia) { 
      navigator.getUserMedia({video:true}, success, (error) => console.error(error));
    } else { 
      console.error('Your browser does not support getUserMedia');
    }
    window.setInterval(snapshot, 32 * 3);
  }

  return {
    init: init_
  };
})();

MotionDetector.init();