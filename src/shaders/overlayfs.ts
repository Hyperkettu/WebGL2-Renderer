
export const prefix = 'overlayFS';

export const overlayFsSrc = 
`#version 300 es

precision highp float;

uniform sampler2D atlasTexture;

in vec2 uvs;
in vec4 color;

out vec4 outColor;

void main() {
	vec4 imageColor = texture(atlasTexture, uvs.st).rgba;
	outColor = vec4(imageColor.rgb * color.rgb, imageColor.a * color.a);
}
`;