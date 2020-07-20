
export const prefix = 'billboardFS';

export const billboardFsSrc =
`#version 300 es

precision highp float;

in vec2 uvs;
in vec4 dirLightSpacePositionW;
in vec3 positionW;
in vec3 normalW;
in mat3 TBN;

uniform sampler2D albedoMap;

layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 bloomColor;

void main() {
    vec4 color = texture(albedoMap, uvs.st);
    outColor = color;

    if(outColor.a == 0.0f) {
        discard;
    }

    bloomColor = vec4(0.0f, 0.0f, 0.0f, 0.0f);
}
`;