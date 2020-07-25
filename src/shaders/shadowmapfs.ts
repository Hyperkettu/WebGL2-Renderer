
export const prefix = 'shadowMapFS';

export const shadowMapFsSrc =

`#version 300 es

precision highp float;

layout(std140) uniform Data {
	vec4 dataVec1;
	vec4 dataVec2;
	bool value;
};

uniform sampler2D albedoMap;

in vec4 positionW;
in vec2 uvs;

void main() {

	vec3 lightPosition = dataVec1.rgb;
	float near = dataVec2.r;
	float far = dataVec2.g;

	float distance = length(positionW.xyz - lightPosition);

	vec4 color = texture(albedoMap, uvs.st);

	if(color.a != 0.0f) {
		gl_FragDepth = (distance - near) / (far - near);
	} else {
		discard;
	}
}
`;



