
export const prefix = 'grayScaleFS';

export const grayScaleFsSrc =

`#version 300 es

precision highp float;

uniform sampler2D screenHdrBuffer;

in vec2 uvs;

out vec4 outColor;

void main() {
vec3 color = texture(screenHdrBuffer, uvs).rgb;
float grayScale = dot(color, vec3(0.2126f, 0.7152f, 0.0722f));
outColor = vec4(grayScale, grayScale, grayScale, 1.0f) * vec4(0.0f, 0.3f, 0.0f, 1.0f);
}

`;