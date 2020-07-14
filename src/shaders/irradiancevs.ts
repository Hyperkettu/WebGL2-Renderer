
export const prefix = 'irradianceVS';

export const irradianceVsSrc =

`#version 300 es

layout(location = 0) in vec3 position;

layout(std140) uniform MatricesPerFrame {
	mat4 projection;
	mat4 view;
};

out vec3 positionW;

void main() {
	positionW = position;
	gl_Position = projection * view * vec4(positionW, 1.0);
}
`;

