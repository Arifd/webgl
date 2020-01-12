///////////////////////////////////////////////////
// This WebGL library is homebrewed by Arif Driessen
// taking MAJOR inspiration from these excellent tutorial sources:
// Indigo Code
// https://www.youtube.com/watch?v=kB0ZVUrI4Aw
// https://github.com/sessamekesh/IndigoCS-webgl-tutorials
// SketchpunkLabs
// https://www.youtube.com/watch?v=J9NC6Zf2uk4&list=PLMinhigDWz6emRKVkVIEAaePW7vtIkaIF&index=2
// https://github.com/sketchpunk/FunWithWebGL2
// WebGL2Fundamentals
// https://webglfundamentals.org/
////////////////////////////////////////////////////
"use strict";
// global helper function to load shader strings from files
async function fileShaderSrc(URL)
{
  // load shader string from file
  let fragmentShaderString = "";
  await fetch(URL).then(response => response.text()).then(data => fragmentShaderString = data);
  return fragmentShaderString;
}
////////////////////////////////////////////////
// global helper function to load image textures
////////////////////////////////////////////////
// Usage if used for a single image:
// let image = loadImage('imageURL.jpg', () =>
//   {
//     // Now that the image has loaded copy it to the texture.
//     let texture = gl.createTexture();
//     gl.bindTexture(gl.TEXTURE_2D, texture);
//     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
//     gl.generateMipmap(gl.TEXTURE_2D);
//     //gl.bindTexture(gl.TEXTURE_2D, null);
//   });
////////////////////////////////////////////////
function loadImage(url, callback = null) {
  let image = new Image();
  image.src = url;
  image.onload = callback;
  return image;
}
function loadImages(urls, callback)
{
  let images = [];
  let imagesToLoad = urls.length;
 
  // Called each time an image finished loading.
  let onImageLoad = function()
  {
    --imagesToLoad;
    // If all the images are loaded call the callback.
    if (imagesToLoad == 0) callback(images);
  };
 
  for (let i = 0; i < imagesToLoad; ++i)
  {
    let image = loadImage(urls[i], onImageLoad);
    images.push(image);
  }
}

class GLInstance
{
  constructor(canvasID)
  {
    this.canvas = document.getElementById(canvasID);
    this.gl = this.canvas.getContext("webgl2");
    if(!this.gl){ console.error("WebGL context is not available."); return null; }

    //...................................................
    //Setup GL, Set all the default configurations we need.
    this.gl.clearColor(0.75, 0.85, 0.8, 1.0);   //Set clear color
    this.setSize();
    this.clearCanvas();
  }

  //...................................................
  //Methods

  //Set the size of the canvas html element and the rendering view port
  setSize()
  {
    let realToCSSPixels = window.devicePixelRatio;

    // Lookup the size the browser is displaying the canvas in CSS pixels
    // and compute a size needed to make our drawingbuffer match it in
    // device pixels.
    let displayWidth  = Math.floor(this.canvas.clientWidth  * realToCSSPixels);
    let displayHeight = Math.floor(this.canvas.clientHeight * realToCSSPixels);
    
    // Check if the this.canvas is not the same size.
    if (this.canvas.width  !== displayWidth || this.canvas.height !== displayHeight)
    {
      // Make the this.canvas the same size
      this.canvas.width  = displayWidth;
      this.canvas.height = displayHeight;
    }
    //when updating the canvas size, must reset the viewport of the canvas 
    //else the resolution webgl renders at will not change
    this.gl.viewport(0,0,this.canvas.width,this.canvas.height); 
    return this;
  }

  // Clear the buffer
  clearCanvas(){ this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT); return this; }

  createProgram(vShaderString,fShaderString,doValidate = false)
  { // helper functions
    // function domShaderSrc(elmID)
    // {
    //   let elm = document.getElementById(elmID);
    //   if(!elm || elm.text == ""){ console.log(elmID + " shader not found or no text."); return null; }
      
    //   return elm.text;
    // }
    
    function compileShader(context,src,type)
    {
      let shader = context.gl.createShader(type);
      context.gl.shaderSource(shader,src);
      context.gl.compileShader(shader);

      //Get Error data if shader failed compiling
      if(!context.gl.getShaderParameter(shader, context.gl.COMPILE_STATUS)){
        console.error("Error compiling shader : " + src, context.gl.getShaderInfoLog(shader));
        context.gl.deleteShader(shader);
        return null;
      }

      return shader;
    }
    // end: helper functions
    //...................................................
    //SHADER STEPS
    // 1. load fragment shader strings (already passed in as arguments to this function)
    // 2. Compile text and validate
    let vShader   = compileShader(this,vShaderString,this.gl.VERTEX_SHADER);
    let fShader   = compileShader(this,fShaderString,this.gl.FRAGMENT_SHADER);

    //Link shaders together
    let prog = this.gl.createProgram();
    this.gl.attachShader(prog,vShader);
    this.gl.attachShader(prog,fShader);
    this.gl.linkProgram(prog);

    //Check if successful
    if(!this.gl.getProgramParameter(prog, this.gl.LINK_STATUS)){
      console.error("Error creating shader program.",this.gl.getProgramInfoLog(prog));
      this.gl.deleteProgram(prog); return null;
    }

    //Only do this for additional debugging.
    if(doValidate){
      this.gl.validateProgram(prog);
      if(!this.gl.getProgramParameter(prog,this.gl.VALIDATE_STATUS)){
        console.error("Error validating program", this.gl.getProgramInfoLog(prog));
        this.gl.deleteProgram(prog); return null;
      }
    }
    
    //Can delete the shaders since the program has been made.
    this.gl.detachShader(prog,vShader); //TODO, detaching might cause issues on some browsers, Might only need to delete.
    this.gl.detachShader(prog,fShader);
    this.gl.deleteShader(fShader);
    this.gl.deleteShader(vShader);

    return prog;
  }

  //Create and fill our Array buffer.
  createArrayBuffer(floatAry,isStatic = false)
  {
    var buf = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER,buf);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, floatAry, (isStatic)? this.gl.STATIC_DRAW : this.gl.DYNAMIC_DRAW );
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null);
    return buf;
  }

  //...................................................
  //Setters - Getters
  get_uniform_locations_from_shader_string(program, shaderString) // does this function need to exist inside GLInstance? Shouldn't it be a global function for all instances?
    {
      // create an array that contains all declarations of uniforms
      let enitreDeclaration = shaderString.match(/uniform ([^\s]+) ([^\s!(; )]+)/g);
      // extract the 3rd word of every object in the array (which will be the variable name)
      let uniformVariables = [];
      for (let i = 0; i < enitreDeclaration.length; ++i)
      {
        let extractedLine = enitreDeclaration[i].match(/uniform ([^\s]+) ([^\s!(; )]+)/);
        uniformVariables.push(extractedLine[2])
      }
      // create an object that holds the UniformLocations to their variable names and return it
      let u_pointSizeUniformLocation = this.gl.getUniformLocation(program,"u_pointSize");
      let uniformLocations = {};
      for (let i = 0; i < uniformVariables.length; ++i)
        uniformLocations[uniformVariables[i]] = this.gl.getUniformLocation(program, uniformVariables[i]);
      return uniformLocations;
    }
}

///////////////////////////////////////////////////////////////

/*
NOTES:
Tutorial on how to control FPS :: http://codetheory.in/controlling-the-frame-rate-with-requestanimationframe/

EXAMPLE:
rloop = new RenderLoop(dt => console.log(rloop.fps + " " + dt), 10).start();
*/

class RenderLoop{
  constructor(callback,fps = 0){
    let oThis = this;
    this.msLastFrame = null;  //The time in Miliseconds of the last frame.
    this.callBack = callback; //What function to call for each frame
    this.isActive = false;    //Control the On/Off state of the render loop
    this.fps = 0;       //Save the value of how fast the loop is going.

    if(fps > 0)
    { //Build a run method that limits the framerate
      this.msFpsLimit = 1000/fps; //Calc how many milliseconds per frame in one second of time.
      
      this.run = function()
      {
        //Calculate Deltatime between frames and the FPS currently.
        let msCurrent = performance.now(),
          msDelta   = (msCurrent - oThis.msLastFrame),
          deltaTime = msDelta / 1000.0;   //What fraction of a single second is the delta time
        
        if(msDelta >= oThis.msFpsLimit){ //Now execute frame since the time has elapsed.
          oThis.fps     = Math.floor(1/deltaTime);
          oThis.msLastFrame = msCurrent;
          oThis.callBack(deltaTime);
        }

        if(oThis.isActive) window.requestAnimationFrame(oThis.run);
      }
    }
    else
    { //Else build a run method thats optimised as much as possible.
      this.run = function()
      {
        //Calculate Deltatime between frames and the FPS currently.
        let msCurrent = performance.now(),  //Gives you the whole number of how many milliseconds since the dawn of time :)
          deltaTime = (msCurrent - oThis.msLastFrame) / 1000.0; //ms between frames, Then / by 1 second to get the fraction of a second.

        //Now execute frame since the time has elapsed.
        oThis.fps     = Math.floor(1/deltaTime); //Time it took to generate one frame, divide 1 by that to get how many frames in one second.
        oThis.msLastFrame = msCurrent;

        oThis.callBack(deltaTime);
        if(oThis.isActive) window.requestAnimationFrame(oThis.run);
      }
    }
  }

  start(){
    this.isActive = true;
    this.msLastFrame = performance.now();
    window.requestAnimationFrame(this.run);
    return this;
  }

  stop(){ this.isActive = false; }
}