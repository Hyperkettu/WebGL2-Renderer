
export const prefix = 'inversionFS';

export const inversionFsSrc =

`#version 300 es

precision highp float;

uniform sampler2D screenHdrBuffer;

in vec2 uvs;

out vec4 outColor;

void main() {
outColor = vec4(vec3(1.0 - texture(screenHdrBuffer, uvs)), 1.0f);
}
`;

