
export const prefix = 'skyboxFS';

export const skyboxFsSrc =
`#version 300 es

precision highp float;

layout(std140) uniform Data {
vec4 dataVec1;
vec4 dataVec2;
bool value;
};


in vec3 uvs;

layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 bloomColor;

uniform samplerCube skybox;

void main()	{
float intensity = dataVec1.r;
vec3 color = texture(skybox, uvs).rgb * intensity;
outColor = vec4(color, 1.0f);

float luma = dot(outColor.rgb, vec3(0.2126f, 0.7152f, 0.0722f));
if (luma > 1.0f) {
    bloomColor = vec4(outColor.rgb, 1.0f);
} else {
    bloomColor = vec4(0.0f, 0.0f, 0.0f, 1.0f);
}
}
`;


