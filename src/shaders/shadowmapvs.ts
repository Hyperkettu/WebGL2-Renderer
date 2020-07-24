
export const prefix = 'shadowMapVS';

export const shadowMapVsSrc =
`#version 300 es

layout(location = 0) in vec3 position;
layout(location = 2) in vec2 texCoords;


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

out vec4 positionW;
out vec2 uvs; 

void main() {
    uvs = texCoords;
    positionW = world * vec4(position, 1.0f);
    gl_Position = projection * view * positionW;
}
`;

