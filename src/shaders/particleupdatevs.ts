
export const prefix = 'particleUpdateVS';

export const particleUpdateVsSrc =

`#version 300 es

precision highp float;

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 velocity;
layout(location = 2) in float age;
layout(location = 3) in float life;


struct ParticleData {
    vec3 gravity;
    float deltaTime;
    vec3 origin;
    float padding;
    vec2 angleLimits;
    vec2 speedLimits;

};

layout(std140) uniform Particle {
    ParticleData particleData;
};

uniform sampler2D noiseTexture;

out vec3 positionW;
out vec3 velocityW;
out float currentAge;
out float currentLife;

const float PI = 3.141592653f;

void main() {

if(age >= life) {

    ivec2 noiseCoord = ivec2(gl_VertexID % 512, gl_VertexID / 512);
    vec3 rand = texelFetch(noiseTexture, noiseCoord, 0).rgb;

    float minAngle = particleData.angleLimits.x;
    float maxAngle = particleData.angleLimits.y;

    float theta = minAngle + rand.r * (maxAngle - minAngle);
    float phi = rand.g * (2.0f * PI);
    float x = sin(theta) * cos(phi);
    float y = sin(theta) * sin(phi);
    float z = cos(theta);

    positionW = particleData.origin;
    currentAge = 0.0f;
    currentLife = life;
    velocityW = vec3(x, y, z) * (particleData.speedLimits.x + rand.b * (particleData.speedLimits.y - particleData.speedLimits.x));;  //vec3(5.0f, 5.0f, 5.0f) * 3.0f;

} else {
    positionW = position + velocity * particleData.deltaTime;
    velocityW = velocity + particleData.gravity * particleData.deltaTime;
    currentAge = age + particleData.deltaTime;
    currentLife = life;
}

}
`;