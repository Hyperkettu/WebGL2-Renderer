
export const prefix = 'overlayMaskFS';

export const overlayFsSrc = 
`#version 300 es

precision highp float;

uniform sampler2D atlasTexture;
uniform sampler2D mask;

in vec2 uvs;
in vec4 color;

out vec4 outColor;

void main() {
    vec4 imageColor = texture(atlasTexture, uvs.st).rgba;
    float maskAlpha = texture(mask, uvs.st).a;
	outColor = vec4(imageColor.rgb * color.rgb, imageColor.a * color.a * maskAlpha);
}
`;