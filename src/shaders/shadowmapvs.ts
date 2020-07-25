import { src } from "gulp";

export const prefix = 'shadowMapVS';

export function getVsSrc(hasDisplacementMap: boolean) {

const shadowMapVsSrc =
`#version 300 es

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
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

${hasDisplacementMap ? 'uniform sampler2D displacementMap;' : ''}

out vec4 positionW;
out vec2 uvs; 

void main() {
    uvs = texCoords;
    positionW = world * vec4(position, 1.0f);

    ${hasDisplacementMap ? 
    'mat3 normalMatrix = transpose(inverse(mat3(world)));' +
    'vec3 normalW = normalMatrix * normal;' +    
    'float displacement = displacementFactor * texture(displacementMap, uvs).r;' +
    'positionW.xyz = positionW.xyz + displacement * normalW;' : ''}

    gl_Position = projection * view * positionW;
}
`;

    return shadowMapVsSrc;
}
