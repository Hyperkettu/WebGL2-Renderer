
export const prefix = 'lineFS';

export const lineFsSrc =

`#version 300 es

precision highp float;

layout(std140) uniform Data {
    vec4 dataVec1;
    vec4 dataVec2;
    vec4 dataVec3;
    bool value;

};

layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 bloomColor;

void main() {
    outColor = dataVec1;
    bloomColor = vec4(0.0f, 0.0f, 0.0f, 0.0f);
}
`;


