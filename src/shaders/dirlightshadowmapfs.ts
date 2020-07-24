
export const prefix = 'dirLightShadowMapFS';

export const shadowMapFsSrc =

`#version 300 es

precision highp float;

uniform sampler2D albedoMap;

in vec2 uvs;

void main() {
    vec4 color = texture(albedoMap, uvs.st);

    if(color.a == 0.0f) {
        discard;
    }
}
`;



