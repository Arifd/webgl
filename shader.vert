#version 300 es
precision highp float;
in vec2 a_vertPosition;
in vec2 a_texCoord;
uniform float u_pointSize;
uniform float u_deltaTime;
uniform float u_noise1_move_speed;
uniform float u_noise2_move_speed;
uniform float u_noise3_move_speed;

out vec2 v_texCoord;
out vec2 v_uv_anim;
out vec2 v_uv_anim_2;
out vec2 v_uv_anim_3;

void main()
{
  gl_PointSize = u_pointSize;
  
  v_uv_anim.x = (a_vertPosition.x + (u_deltaTime * u_noise1_move_speed) * 0.025) * 0.25 + 0.65;
  v_uv_anim.y = (a_vertPosition.y - (u_deltaTime * u_noise1_move_speed)) * 0.25;

  v_uv_anim_2.x = (a_vertPosition.x - (u_deltaTime * u_noise2_move_speed * 0.125)) * 0.25 + 0.65;
  v_uv_anim_2.y = (a_vertPosition.y - (u_deltaTime * u_noise2_move_speed)) * 0.25 + 0.65;

  v_uv_anim_3.x = (a_vertPosition.x + (u_deltaTime * u_noise3_move_speed * 0.125)) * 0.25 + 0.65;
  v_uv_anim_3.y = (a_vertPosition.y - (u_deltaTime * u_noise3_move_speed)) * 0.25 + 0.65;

  v_texCoord = a_texCoord;
  gl_Position = vec4(a_vertPosition, 0.0, 1.0);
}