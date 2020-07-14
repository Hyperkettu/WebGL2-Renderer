
export const prefix = 'fillScreenFS';

export const fillScreenFsSrc =

`#version 300 es

precision highp float;

in vec2 uvs;

out vec4 outColor;

uniform sampler2D screenTexture;

void main() {
	outColor = texture(screenTexture, uvs);
}
`;