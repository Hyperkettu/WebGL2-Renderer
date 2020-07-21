
export const prefix = 'lineVS';

export const lineVsSrc =

`#version 300 es

precision highp float;

layout(location = 0) in vec3 position;

layout(std140) uniform MatricesPerFrame {
	mat4 projection;
	mat4 view;
	mat4 lightSpaceMatrix;
};

layout(std140) uniform PerObject {
	mat4 world;
	float displacementFactor;
	float pointLightIndex;
};

void main() {
	gl_Position = projection * view * world * vec4(position, 1.0);
}
`;

