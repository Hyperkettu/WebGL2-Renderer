
export const prefix = 'visualizeDepthFS';

export const visualizeDepthFsSrc =

`#version 300 es

precision highp float;

uniform sampler2D screenTexture;

layout(std140) uniform Data {
vec4 dataVec1;
vec4 dataVec2;
bool value;
};

    in vec2 uvs;

out vec4 outColor;

float LinearizeDepth(float depth, float near, float far) {
float z = depth * 2.0 - 1.0; // transform to normalized device coordinates
return (2.0 * near * far) / (far + near - z * (far - near));
}

void main() {

bool isPerspective = value;
float near = dataVec1.r;
float far = dataVec1.g;

float depth = texture(screenTexture, uvs).r;
if (isPerspective) {
    depth = LinearizeDepth(depth, near, far) / far;
}
outColor = vec4(vec3(depth), 1.0f);
}
`;
