import { PointLight } from '../pointlight';

export const prefix = 'billboardParticleVS';

export const billboardParticleVsSrc =
`#version 300 es

#define NUM_LIGHTS ${ PointLight.NUM_LIGHTS}

struct PointLight {
    vec3 color;
    float colorPadding;
    vec3 position;
    float positionPadding;
    float near;
    float radius;
    float intensity;
    float padding;
};

struct DirLight {
    vec3 color;
    float intensity;
    vec3 direction;
    float directionPadding;
};

// per instance
layout(location = 0) in vec3 particlePosition;
layout(location = 1) in vec3 velocity;
layout(location = 2) in float age;
layout(location = 3) in float life;

// per vertex
layout(location = 4) in vec3 position;
layout(location = 5) in vec2 texCoords;
layout(location = 6) in vec2 size;

layout (std140) uniform MatricesPerFrame {
    mat4 projection;
    mat4 view;
};

layout(std140) uniform Lights {
    ${PointLight.NUM_LIGHTS > 0 ? 'PointLight pointLights[NUM_LIGHTS]' : ''}
    DirLight dirLight;

    vec3 eyePositionW;
};

const vec3 worldUp = vec3(0.0f, 1.0f, 0.0f);

out vec2 uvs;
out float currentLife;
out float currentAge;


mat4 billboardWorld(vec3 eyePosition, vec3 particlePosition) {
    vec3 forward = normalize(eyePosition - particlePosition);
    vec3 right = cross(worldUp, forward);
    vec3 up = cross(forward, right);
    return mat4(vec4(right, 0.0f), vec4(up, 0.0f), vec4(forward, 0.0f), vec4(particlePosition, 1.0f));
}

mat4 billboard(mat4 view, vec3 particlePosition) {
    mat3 invView = transpose(mat3(view));
    return mat4(
        vec4(invView[0], 0.0f),
        vec4(invView[1], 0.0f),
        vec4(invView[2], 0.0f),
        vec4(particlePosition, 1.0f)
        );

}

mat3 scale(vec2 particleSize) {
    return mat3(vec3(particleSize.x, 0.0f, 0.0f),
                vec3(0.0f, particleSize.y, 0.0f),
                vec3(0.0f, 0.0f, 1.0f));

}

void main() {
    mat4 world = billboardWorld(eyePositionW, particlePosition);
    mat4 billboardMatrix = billboard(view, particlePosition);
    gl_Position = projection * view * billboardMatrix * vec4(scale(size) * position, 1.0f);
    uvs = texCoords;
    currentAge = age;
    currentLife = life;
}
`;