#version 300 es 
precision highp float; // high precision seems to fix snoise on some phones

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_frameCount;

out vec4 outColour;

// Optimized Ashima Simplex noise2D by @makio64 https://www.shadertoy.com/view/4sdGD8
// Original shader : https://github.com/ashima/webgl-noise/blob/master/src/noise2D.glsl
// snoise return a value between 0 & 1
// v5 fixed diagonal from abje comment
/*lowp*/ vec3 permute(in /*lowp*/ vec3 x) { return mod( x*x*34.+x, 289.); }
/*lowp*/ float snoise(in /*lowp*/ vec2 v) {
  /*lowp*/ vec2 i = floor((v.x+v.y)*.36602540378443 + v),
      x0 = (i.x+i.y)*.211324865405187 + v - i;
  /*lowp*/ float s = step(x0.x,x0.y);
  /*lowp*/ vec2 j = vec2(1.0-s,s),
      x1 = x0 - j + .211324865405187, 
      x3 = x0 - .577350269189626; 
  i = mod(i,289.);
  /*lowp*/ vec3 p = permute( permute( i.y + vec3(0, j.y, 1 ))+ i.x + vec3(0, j.x, 1 )   ),
       m = max( .5 - vec3(dot(x0,x0), dot(x1,x1), dot(x3,x3)), 0.),
       x = fract(p * .024390243902439) * 2. - 1.,
       h = abs(x) - .5,
      a0 = x - floor(x + .5);
  return .5 + 65. * dot( pow(m,vec3(4.))*(- 0.85373472095314*( a0*a0 + h*h )+1.79284291400159 ), a0 * vec3(x0.x,x1.x,x3.x) + h * vec3(x0.y,x1.y,x3.y));
}

void main() {
  vec2 st = gl_FragCoord.xy/u_resolution;

  st.y -= u_frameCount / 100.0;
  // st.x += sin(u_frameCount/10.0) / 100.0;

  float c = 0.0;

  c = snoise(st * 6.0);

  vec3 colour = vec3(c);
  //vec3 colour = vec3(smoothstep(0.0,1.0, pow(c,2.0)),smoothstep(0.0,1.0,pow(c,8.0)), 0.0);

  outColour = vec4(colour,1.0);
}
