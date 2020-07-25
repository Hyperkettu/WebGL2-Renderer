
export const prefix = 'gaussianBlurFS';

export const gaussianBlurFsSrc =

`#version 300 es

precision highp float;

uniform sampler2D screenHdrBuffer;

layout(std140) uniform Data {
vec4 dataVec1;
vec4 dataVec2;
vec4 dataVec3;
bool value;
};

in vec2 uvs;

out vec4 outColor;

const float weight[5] = float[](0.227027f, 0.1945946f, 0.1216216f, 0.054054f, 0.016216f);

void main() {

    bool horizontal = value;
    float mip = dataVec1.r;
    ivec2 size = textureSize(screenHdrBuffer, (int(mip)));
    vec2 offset =  vec2(1.0f / (float(size.x)), 1.0f / (float(size.y)));
    vec3 result = textureLod(screenHdrBuffer, uvs, mip).rgb * weight[0];

    if (horizontal) {

    for (int i = 1; i < 5; ++i) {
        result += textureLod(screenHdrBuffer, uvs + vec2(offset.x * (float(i)), 0.0f), mip).rgb * weight[i];
        result += textureLod(screenHdrBuffer, uvs - vec2(offset.x * (float(i)), 0.0f), mip).rgb * weight[i];
    }
    } else {

        for (int i = 1; i < 5; ++i) {
            result += textureLod(screenHdrBuffer, uvs + vec2(0.0f, offset.y * (float(i))), mip).rgb * weight[i];
            result += textureLod(screenHdrBuffer, uvs - vec2(0.0f, offset.y * (float(i))), mip).rgb * weight[i];
        }
    }
    outColor = vec4(result, 1.0);
}
`;

