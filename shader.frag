#version 300 es 
precision highp float; // high precision seems to fix snoise on some phones

uniform vec2 u_resolution;
uniform float u_deltaTime;

in vec2 v_texCoord;
in vec2 v_uv_anim;
in vec2 v_uv_anim_2;
in vec2 v_uv_anim_3;
uniform sampler2D u_texture;
uniform sampler2D u_texture2;

uniform float u_noise1_move_speed;// = 0.5;
uniform float u_noise2_move_speed;// = 0.725;
uniform float u_noise3_move_speed;
uniform float u_noise1_octave;// = 4.3;
uniform float u_noise2_octave;// = 5.0;
uniform float u_distortion_amount;// = 1.0;
uniform float u_distortion_amount_2;// = 1.0;

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

  //  Function from Iñigo Quiles
//  www.iquilezles.org/www/articles/functions/functions.htm
float parabola( float x, float k ){
    return pow( 4.0*x*(1.0-x), k );
}

void main() {
  vec2 uv = gl_FragCoord.xy/u_resolution;
  // vec2 st = uv;
  // vec2 st2 = uv;
  // vec2 st3 = uv;

  // Create noise map

  float n = 0.0; // our noise variable

  // st.y -= u_deltaTime * u_noise1_move_speed;
  // st2.y -= u_deltaTime * u_noise2_move_speed;
  // st3.y -= u_deltaTime * u_noise3_move_speed;
  //st.x += sin(u_deltaTime/10.0) * 4.5; // wind simulation

  // modulate one noise by another changing at a different speed
  // snoise outputs 0 - 1, therefore we * 2.0 - 1.0 to balance 
  // n = snoise(st * u_noise1_octave + ((snoise(st2 * u_noise2_octave) * 2.0 - 1.0)) * u_distortion_amount);
  // n *= 0.5; // compensate for the layering of noise
  
  //n = texture(u_texture, st + texture(u_texture, st2 * u_distortion_amount).r).g;

  float mod1 = texture(u_texture, v_uv_anim_2).g * u_distortion_amount;
  float mod2 = texture(u_texture, v_uv_anim_3).b * u_distortion_amount_2;

  vec2 noiseCoords = vec2(v_uv_anim.y + mod1,
                          v_uv_anim.x + mod2);
   // st.y += mod1;
  // st.x += mod2;
  n = smoothstep(0.3,0.7,texture(u_texture, noiseCoords).r);
  // create gradient map

  float g = 0.0; // our gradient variable

  const float gradientHeightLimiter = 0.2;//0.45;
  g = mix(1.0, 0.0, uv.y + gradientHeightLimiter); // * parabola(uv.x,2.285);
  
  // add noise to gradient
  float ng = n;// * g * 2.0;  // no gradient for now. need to figure it out

  // display result

  vec3 colour = vec3(ng);
  // colour *= mix(vec3(1.0,1.0,0.0), vec3(1.0,0.0,0.0), uv.y);
  // colour *= vec3(1.0, // red
  //               clamp(smoothstep(0.0,1.0,ng),0.0,0.5),  // green
  //               0.0);                             // blue


  // outColour = vec4(vec3(texture(u_texture, v_texCoord).r), 1.0); // display textures
  // outColour = vec4(vec3(g),1.0);
   outColour = vec4(colour,1.0);
  // outColour = vec4(vec3(texture(u_texture, v_uv_anim).r),1.0); 
}