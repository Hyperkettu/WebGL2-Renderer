
export const prefix = 'visualizeDepthCubemapFS';

export const cubemapDepthFsSrc =
`#version 300 es

precision highp float;

in vec3 uvs;

layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 bloomColor;

layout(std140) uniform Data {
vec4 dataVec1;
vec4 dataVec2;
vec4 dataVec3;
bool value;
};

uniform samplerCube skybox;

float LinearizeDepth(float depth, float near, float far) {
float z = depth * 2.0 - 1.0; // transform to normalized device coordinates
return (2.0 * near * far) / (far + near - z * (far - near));
}

void main()	{

float near = dataVec1.r;
float far = dataVec1.g;

float depth = texture(skybox, uvs).r;
//depth = LinearizeDepth(depth, near, far) / far;
outColor = vec4(1.0f - depth, 1.0f - depth, 1.0f - depth, 1.0f);

bloomColor = outColor;
}
`;
