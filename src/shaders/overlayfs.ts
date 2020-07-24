
export const prefix = 'overlayFS';

export const overlayFsSrc = 
`#version 300 es

precision highp float;

uniform sampler2D atlasTexture;
uniform sampler2D mask;

in vec2 uvs;
in vec4 color;
in float hasMask;

out vec4 outColor;

void main() {

	vec4 imageColor = texture(atlasTexture, uvs.st).rgba;

	if(hasMask == 1.0f) {
		vec4 maskColor = texture(mask, uvs.st).rgba;
		outColor = vec4(imageColor.rgb * color.rgb, imageColor.a * color.a * maskColor.a);
		
		if(outColor.a == 0.0f) {
			discard;
		}

	} else {
		outColor = vec4(imageColor.rgb * color.rgb, imageColor.a * color.a);
	}
}
`;