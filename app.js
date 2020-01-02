// https://www.youtube.com/watch?v=kB0ZVUrI4Aw&list=PLjcVFFANLS5zH_PeKC6I8p0Pt1hzph_rt

"use strict";

let vertexShaderString =
`
precision lowp float;
attribute vec2 vertPosition;

void main()
{
  gl_Position = vec4(vertPosition, 0.0, 1.0);
}
`;

let fragmentShaderString = "";

async function initWebGL()
{
  // load shader string from file
  await fetch('shader.frag').then(response => response.text()).then(data => fragmentShaderString = data);
 
  let canvas = document.getElementById('maincanvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let gl = canvas.getContext('webgl');

  gl.clearColor(0.75, 0.85, 0.8, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let vertexShader = gl.createShader(gl.VERTEX_SHADER);
  let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

  gl.shaderSource(vertexShader, vertexShaderString);
  gl.shaderSource(fragmentShader, fragmentShaderString);

  function compileShader(shader)
  {
    gl.compileShader(shader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
      console.error('error compiling shader', gl.getShaderInfoLog(shader));
  }

  compileShader(vertexShader);
  compileShader(fragmentShader);

  let program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    console.error('error linking program', gl.getProgramInfoLog(program));

  gl.validateProgram(program);
  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS))
      console.error('error validating program', gl.getProgramInfoLog(program));

  // ---------------------------------------

  //
  // setup and send buffer
  //

  // Create a buffer
  let quadVertices = // X,Y positions
  [
            // First triangle:
             1.0,  1.0,
            -1.0,  1.0,
            -1.0, -1.0,
            // Second triangle:
            -1.0, -1.0,
             1.0, -1.0,
             1.0,  1.0
  ];

  // send the buffer to the GPU
  let vertexBufferObject = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject); 
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadVertices), gl.STATIC_DRAW);

  // tell the GPU how the buffer's structured and where to point its attribute variables
  let positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
  gl.vertexAttribPointer(
    positionAttribLocation, // Attribute location
    2, // number of elements per attribute
    gl.FLOAT, // type of elements
    gl.FALSE, // is data normalised?
    2 * Float32Array.BYTES_PER_ELEMENT, // size of an individual vertex
    0 // offset from the begining of a single vertex
  );
  gl.enableVertexAttribArray(positionAttribLocation);

  //-------------------------------------------

  //
  // communicate uniform variables to the GPU
  //

  // Uniforms are bound to  program, so we have to tell OpenGL state machine which program is active
  gl.useProgram(program);

  // get pointers
  let iTimeUniformLocation = gl.getUniformLocation(program, 'iTime');
  let iResolutionUniformLocation = gl.getUniformLocation(program, 'iResolution');

  // // use the appropriate function to send datatype data
  // // more info: https://stackoverflow.com/questions/31049910/setting-uniforms-in-webgl
  gl.uniform1f(iTimeUniformLocation, 0.0);
  gl.uniform3fv(iResolutionUniformLocation, [canvas.width, canvas.height, 1]);


  //
  // Main render loop
  //
  let fakeTime = 0;
  function draw()
  {
    gl.uniform1f(iTimeUniformLocation, fakeTime);

    gl.drawArrays(gl.TRIANGLES, 0, 6); // draw type, how many to skip, number of vertices
    fakeTime += 0.01;
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
  

};

