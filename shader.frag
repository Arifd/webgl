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
uniform float u_smoothstep_value_A;
uniform float u_smoothstep_value_B;
uniform float u_distortion_amount;// = 1.0;
uniform float u_distortion_amount_2;// = 1.0;
uniform float u_blue;

out vec4 outColour;

//  Function from Iñigo Quiles, modified by Arif Driessen
//  www.iquilezles.org/www/articles/functions/functions.htm
float cubicPulse( float c, float w, float p, float x ){
    x = abs(x - c);
    x /= w;
    return max(0.0,1.0 - pow(x,p) * (3.0-2.0*x));
}

void main() {
  vec2 uv = gl_FragCoord.xy/u_resolution;

  // modulate one noise by two others moving up at different speeds
  float mod1 = (texture(u_texture, v_uv_anim_2).b * 2.0 - 1.0) * u_distortion_amount;
  float mod2 = (texture(u_texture, v_uv_anim_3).g * 2.0 - 1.0) * u_distortion_amount;

  vec2 noiseCoords = vec2(v_uv_anim.y + mod1,
                          v_uv_anim.x - mod2);

  // create a final noise texture (by distorting noise with more layers of noise)
  float n = smoothstep(u_smoothstep_value_A,u_smoothstep_value_B,texture(u_texture, noiseCoords).r);
  // side chain: take a copy of noise, to add back in as another layer of colour later.
  float sideChainNoise = smoothstep(0.9,1.0,n) * 3.0;

  // create gradient map
  float g = mix(1.0,0.0, uv.y) * cubicPulse(0.5, 0.5, 25.0, uv.x); // our gradient
  
  // now pull it into the negative so fire (nose texture) will be pulled into (subtracted by) the gradient
  g -= 0.8;

  // add noise to gradient
  float ng = n + g;

  // filter sideChainNoise by the gradient (and allow it to rise a little higher)
  sideChainNoise *= g + 0.25;

  // apply as grayscale to final output colour
  vec3 colour = vec3(ng);
  // debug: check where the gradient pulls into the negative 
  // if (g < 0.0) colour = vec3(-1.0 * g,0.0,0.0);

  // convert from grayscale to fire colours
  colour *= mix(vec3(1.0,0.0,0.0), vec3(1.0,1.0,0.0), max(0.0,pow(ng,3.0))); // blue was 0.05
  
  // add your sideChainNoise back in, as pure white
  colour += vec3(sideChainNoise);

  // send to output buffer
  outColour = vec4(colour,1.0);
}