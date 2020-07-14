
export const prefix = 'billboardParticleFS';

export const billboardParticleFsSrc =

`#version 300 es

precision highp float;

in vec2 uvs;
in float currentLife;
in float currentAge;

layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 bloomColor;

uniform sampler2D particleTexture;

void main() {
	outColor = vec4(texture(particleTexture, uvs.st).rgb, 1.0f - (currentAge / currentLife));
	float luma = dot(outColor.rgb, vec3(0.2126f, 0.7152f, 0.0722f));
	if (luma > 1.0f) {
		bloomColor = vec4(outColor.rgb, 1.0);
	} else {
		bloomColor = vec4(0.0, 0.0, 0.0, 1.0);
	}
}
`;