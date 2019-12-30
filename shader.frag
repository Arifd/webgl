precision lowp float;
uniform vec3 iResolution;
uniform float iTime;

vec3 COLOR1 = vec3(0.0, 0.0, 0.3);
vec3 COLOR2 = vec3(0.5, 0.0, 0.0);
float BLOCK_WIDTH = 0.01;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  // Normalized pixel coordinates (from 0 to 1)
  vec2 uv = fragCoord.xy / iResolution.xy;
  
  vec3 final_color = vec3(1.0);
  vec3 bg_color = vec3(0.0);
  vec3 wave_color = vec3(0.0);

  // rainbow
  vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
  
  bg_color = col;
  
  // To create the waves
  float wave_width = 0.01;
  uv  = -1.0 + 2.0 * uv;
  uv.x += 0.1;
  for(float i = 0.0; i < 10.0; i++) {
    
    uv.x += (0.07 * sin(uv.y + i/7.0 + iTime ));
    wave_width = abs(1.0 / (150.0 * uv.x));
    wave_color += vec3(wave_width * 1.9, wave_width, wave_width * 1.5);
  }
  
  final_color = bg_color + wave_color;
  
  
  fragColor = vec4(final_color, 1.0);
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}