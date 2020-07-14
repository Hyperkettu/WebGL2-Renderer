
export const prefix = 'sharpEdgeFS';

export const sharpEdgesFsSrc =

`#version 300 es

precision highp float;

uniform sampler2D screenHdrBuffer;

in vec2 uvs;

out vec4 outColor;

const float offset = 1.0 / 800.0;

void main() {

vec2 offsets[9] = vec2[](
    vec2(-offset, offset), // top-left
    vec2(0.0f, offset), // top-center
    vec2(offset, offset), // top-right
    vec2(-offset, 0.0f),   // center-left
    vec2(0.0f, 0.0f),   // center-center
    vec2(offset, 0.0f),   // center-right
    vec2(-offset, -offset), // bottom-left
    vec2(0.0f, -offset), // bottom-center
    vec2(offset, -offset)  // bottom-right
);

float kernel[9] = float[](
    -1.0f, -1.0f, -1.0f,
    -1.0f, 9.0f, -1.0f,
    -1.0f, -1.0f, -1.0f
);

vec3 colors[9];
for (int i = 0; i < 9; i++) {
    colors[i] = vec3(texture(screenHdrBuffer, uvs.st + offsets[i]));
}
vec3 color = vec3(0.0f);
for (int i = 0; i < 9; i++)
color += colors[i] * kernel[i];

outColor = vec4(color, 1.0);
}
`;


