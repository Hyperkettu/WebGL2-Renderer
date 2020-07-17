
export const prefix = 'dirLightShadowMapVS';

export const shadowMapVsSrc =
`#version 300 es

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
    vec4 positionW = world * vec4(position, 1.0f);
    gl_Position = projection * view * positionW;
}
`;

