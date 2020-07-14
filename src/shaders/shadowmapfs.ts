
export const prefix = 'shadowMapFS';

export const shadowMapFsSrc =

	`#version 300 es

precision highp float;

layout(std140) uniform Data {
	vec4 dataVec1;
	vec4 dataVec2;
	bool value;
};

in vec4 positionW;

void main() {

	vec3 lightPosition = dataVec1.rgb;
	float near = dataVec2.r;
	float far = dataVec2.g;

	float distance = length(positionW.xyz - lightPosition);
	gl_FragDepth = (distance - near) / (far - near);
}
`;



