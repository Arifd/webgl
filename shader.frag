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
uniform float noise3_distance_from_noise2;
uniform float u_smoothstep_value_A;
uniform float u_smoothstep_value_B;
uniform float u_distortion_amount;// = 1.0;
uniform float u_distortion_amount_2;// = 1.0;
uniform float u_blue;

out vec4 outColour;

// Define a colour pallete to apply to the fire
// https://www.schemecolor.com
////////////////////////////////////////////////////////////////
const int COLOUR_ARRAY_LENGTH = 7; 
const vec3 colourArray[COLOUR_ARRAY_LENGTH] = vec3[COLOUR_ARRAY_LENGTH](
                                      vec3(0.0, 0.0, 0.0),
                                      vec3(128.0, 17.0, 0.0),
                                      vec3(182.0, 34.0, 3.0),
                                      vec3(215.0, 53.0, 2.0),
                                      vec3(252.0, 100.0, 0.0),
                                      vec3(255.0, 117.0, 0.0),
                                      vec3(250.0, 192.0, 0.0)
                                    );

//  Function from Iñigo Quiles, modified by Arif Driessen
//  www.iquilezles.org/www/articles/functions/functions.htm
float cubicPulse( float c, float w, float p, float x ){
    x = abs(x - c);
    x /= w;
    return max(0.0,1.0 - pow(x,p) * (3.0-2.0*x));
}

//  Function from Iñigo Quiles
//  www.iquilezles.org/www/articles/functions/functions.htm
float parabola( float x, float k ){
    return pow( 4.0*x*(1.0-x), k );
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
  // side chain: take a copy of noise, to add back in later as another layer of colour/detail on top.
  float sideChainNoise = smoothstep(0.9,1.0,n);

  // create gradient map
  float g = mix(1.0,0.0, uv.y) * cubicPulse(0.5, 0.5, 25.0, uv.x); // our gradient
  // create 2nd gradient for sideChainNoise
  float g2 = mix(1.0,0.0, uv.y) * parabola(uv.x, 1.0);
  
  // now pull it into the negative so fire (nose texture) will be pulled into (subtracted by) the gradient
  g -= 1.0;
  g2 -= 1.0;

  // add noise to gradient
  float ng = n + g;

  // filter sideChainNoise by the gradient (and allow it to rise a little higher)
  sideChainNoise *= max(0.0, ng + g2);

  // apply ng as grayscale to final output colour
  
  // interpolating in a lookup table:
  // find out where we should be ideally. (floatily).
  float ngIndex = max(0.0,ng) * float(COLOUR_ARRAY_LENGTH);
  // get the lower and upper bounds
  float ngIndexLower = floor(ngIndex);
  float ngIndexFract = fract(ngIndex);
  // mix the lower bound index with the next, by the fract amount.
  vec3 colour = mix(colourArray[int(ngIndexLower)], colourArray[int(ngIndexLower)+1], vec3(ngIndexFract));

  // basic colour table lookup (for cartoon effect)
  //vec3 colour = colourArray[int(floor(max(0.0,ng) * float(COLOUR_ARRAY_LENGTH)))];
  
  // because lookup table is in RGB 0 - 255, we need to normalise to 0 - 1.
  // this can be completely optimised out by pre-applying it to the lookup table, but for now, it's only one operation.
  colour *= vec3(0.00392156862); // this is the equivalent of divide by 255.

  // debug: check where X pulls into the negative 
  // if (ng < 0.0) colour = vec3(-1.0 * ng,0.0,0.0);
  
  // finally add your sideChainNoise back in, as pure white
  colour += vec3(sideChainNoise);

  // send to output buffer
  outColour = vec4(colour,1.0);
}