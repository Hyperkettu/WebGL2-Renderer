
export const prefix = 'gaussianBlurFS';

export const gaussianBlurFsSrc =

`#version 300 es

precision highp float;

uniform sampler2D screenHdrBuffer;

layout(std140) uniform Data {
vec4 dataVec1;
vec4 dataVec2;
bool value;
};

in vec2 uvs;

out vec4 outColor;

const float weight[5] = float[](0.227027f, 0.1945946f, 0.1216216f, 0.054054f, 0.016216f);

void main() {
bool horizontal = value;
ivec2 size = textureSize(screenHdrBuffer, 0);
vec2 offset = vec2(1.0f / 2048.0f); // vec2(1.0f / ((float) size.x), 1.0f / ((float) size.y));
vec3 result = texture(screenHdrBuffer, uvs).rgb * weight[0];

if (horizontal) {

    for (int i = 1; i < 5; ++i) {
        result += texture(screenHdrBuffer, uvs + vec2(offset.x * (float(i)), 0.0f)).rgb * weight[i];
        result += texture(screenHdrBuffer, uvs - vec2(offset.x * (float(i)), 0.0f)).rgb * weight[i];
    }
} else {

    for (int i = 1; i < 5; ++i) {
        result += texture(screenHdrBuffer, uvs + vec2(0.0f, offset.y * (float(i)))).rgb * weight[i];
        result += texture(screenHdrBuffer, uvs - vec2(0.0f, offset.y * (float(i)))).rgb * weight[i];
    }
}
outColor = vec4(result, 1.0);
}
`;

