
export const prefix = 'skyboxVS';

export const skyboxVsSrc =
`#version 300 es

layout(location = 0) in vec3 position;
out vec3 uvs;

layout(std140) uniform MatricesPerFrame {
	mat4 projection;
	mat4 view;
	mat4 lightSpaceMatrix;
};

void main() {
	// no world transform so that the cube moves along with the viever
	mat4 viewSkybox = mat4(mat3(view));
	vec4 pos = projection * viewSkybox * vec4(position, 1.0);
	// move the skybox depth to far plane z = w/w = 1
	gl_Position = pos.xyww;
	uvs = position;
}
`;