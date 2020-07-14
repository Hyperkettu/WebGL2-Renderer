
export const prefix = 'bloomFS';

export const bloomFsSrc =

`#version 300 es

precision highp float;

uniform sampler2D screenHdrBuffer;
uniform sampler2D bloomTexture;

in vec2 uvs;

out vec4 outColor;

void main() {
vec3 color = texture(screenHdrBuffer, uvs).rgb;
vec3 bloomColor = texture(bloomTexture, uvs).rgb;
color += bloomColor;
outColor = vec4(color, 1.0f);
}

`;

