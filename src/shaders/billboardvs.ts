
export const prefix = 'billboardVS';

export const billboardVsSrc =
`#version 300 es

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec2 texCoords;
layout(location = 3) in vec3 tangent;

layout (std140) uniform MatricesPerFrame {
 	mat4 projection;
	mat4 view;
	mat4 lightSpaceMatrix;
};

layout (std140) uniform PerObject {
		highp mat4 world;
		highp float displacementFactor;
		highp float pointLightIndex;
};

mat4 billboard(mat4 view, vec3 position) {
    mat3 invView = transpose(mat3(view));
    return mat4(
        vec4(invView[0], 0.0f),
        vec4(invView[1], 0.0f),
        vec4(invView[2], 0.0f),
        vec4(position, 1.0f)
        );
}

out vec2 uvs;
out vec4 dirLightSpacePositionW;
out vec3 positionW;
out vec3 normalW;
out mat3 TBN;

void main() {
    vec3 billboardPosition = world[3].xyz;
    mat4 billboardMatrix = billboard(view, billboardPosition);

    mat3 normalMatrix = transpose(inverse(mat3(billboardMatrix)));
    normalW = normalize(normalMatrix * normal);

    vec3 T = normalize(mat3(billboardMatrix) * tangent);
    // Gram-Schmidt
    T = normalize(T - dot(T, normalW) * normalW);
    vec3 B = cross(normalW, T);
	TBN = mat3(T, B, normalW);

    positionW = (billboardMatrix * vec4(position, 1.0f)).xyz;
	dirLightSpacePositionW = lightSpaceMatrix * vec4(positionW, 1.0f);

    gl_Position = projection * view * vec4(positionW, 1.0f);
    uvs = texCoords;
}
`;