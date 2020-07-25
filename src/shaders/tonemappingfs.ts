
export const prefix = 'toneMappingFS';

export const tonemappingFsSrc =

`#version 300 es

precision highp float;

uniform sampler2D screenHdrBuffer;
uniform int enableToneMapping;
uniform int enableGammaCorrection;

layout(std140) uniform Data {
vec4 dataVec1;
vec4 dataVec2;
vec4 dataVec3;
bool value;
};


in vec2 uvs;

out vec4 outColor;

mat4 brighten( float brightness )
{
return mat4( 1.0f, 0.0f, 0.0f, 0.0f,
             0.0f, 1.0f, 0.0f, 0.0f,
             0.0f, 0.0f, 1.0f, 0.0f,
             brightness, brightness, brightness, 1.0f );
}

mat4 addContrast( float contrast )
{
float t = ( 1.0f - contrast ) / 2.0f;

return mat4( contrast, 0.0f, 0.0f, 0.0f,
             0.0f, contrast, 0.0f, 0.0f,
             0.0f, 0.0f, contrast, 0.0f,
             t, t, t, 1.0f );

}

mat4 saturate( float saturation )
{
vec3 luminance = vec3( 0.3086f, 0.6094f, 0.0820f );

float invSaturation = 1.0f - saturation;

vec3 red = vec3( luminance.x * invSaturation );
red+= vec3( saturation, 0, 0 );

vec3 green = vec3( luminance.y * invSaturation );
green += vec3( 0, saturation, 0 );

vec3 blue = vec3( luminance.z * invSaturation );
blue += vec3( 0, 0, saturation );

return mat4( red,     0.0f,
             green,   0.0f,
             blue,    0.0f,
             0.0f, 0.0f, 0.0f, 1.0f );
}

vec3 linearToneMapping(vec3 color) {
float exposure = 1.0f;
color = clamp(exposure * color, 0.0f, 1.0f);
if (enableGammaCorrection == 1) {
    color = pow(color, vec3(1.0f / 2.2f));
}
return color;
}

vec3 simpleReinhardToneMapping(vec3 color) {
float exposure = 1.5;
color *= exposure / (1. + color / exposure);
if (enableGammaCorrection == 1) {
    color = pow(color, vec3(1.0f / 2.2f));
}
return color;
}

vec3 lumaBasedReinhardToneMapping(vec3 color) {
float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
float toneMappedLuma = luma / (1.0f + luma);
color *= toneMappedLuma / luma;
if (enableGammaCorrection == 1) {
    color = pow(color, vec3(1.0f / 2.2f));
}
return color;
}

vec3 whitePreservingLumaBasedReinhardToneMapping(vec3 color) {
float white = 2.0f;
float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
float toneMappedLuma = luma * (1.0f + luma / (white * white)) / (1.0f + luma);
color *= toneMappedLuma / luma;
if (enableGammaCorrection == 1) {
    color = pow(color, vec3(1.0f/2.2f));
}
return color;
}

vec3 RomBinDaHouseToneMapping(vec3 color) {
color = exp(-1.0f / (2.72 * color + 0.15));
if (enableGammaCorrection == 1) {
    color = pow(color, vec3(1.0f / 2.2f));
}
return color;
}

vec3 filmicToneMapping(vec3 color) {
color = max(vec3(0.0f), color - vec3(0.004f));
color = (color * (6.2f * color + 0.5f)) / (color * (6.2f * color + 1.7f) + 0.06f);
return color;
}

vec3 Uncharted2ToneMapping(vec3 color) {
float A = 0.15f;
float B = 0.50f;
float C = 0.10f;
float D = 0.20f;
float E = 0.02f;
float F = 0.30f;
float W = 11.2f;
float exposure = 2.0f;
color *= exposure;
color = ((color * (A * color + C * B) + D * E) / (color * (A * color + B) + D * F)) - E / F;
float white = ((W * (A * W + C * B) + D * E) / (W * (A * W + B) + D * F)) - E / F;
color /= white;

if (enableGammaCorrection == 1) {
    color = pow(color, vec3(1.0f / 2.2f));
}
return color;
}

vec3 Simple(vec3 color) {

color = color / (vec3(1.0f) + color);
if (enableGammaCorrection == 1) {
    color = pow(color, vec3(1.0f / 2.2f));
}
return color;
}

vec3 MyToneMap(vec3 color) {

float white = 2.0f;
float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
float toneMappedLuma = luma * (1.0f + luma / (white * white)) / (1.0f + luma);
color *= toneMappedLuma / luma;

if (enableGammaCorrection == 1) {
    color = pow(color, vec3(1.0f/2.2f));
}

return color;
}



void main() {

vec3 color = texture(screenHdrBuffer, uvs).rgb;

if (enableToneMapping > 0) {

    if (enableToneMapping == 1) {
        color = linearToneMapping(color);
    } else if (enableToneMapping == 2) {
        color = simpleReinhardToneMapping(color);
    } else if (enableToneMapping == 3) {
        color = lumaBasedReinhardToneMapping(color);
    } else if (enableToneMapping == 4) {
        color = whitePreservingLumaBasedReinhardToneMapping(color);
    } else if (enableToneMapping == 5) {
        color = RomBinDaHouseToneMapping(color);
    } else if (enableToneMapping == 6) {
        color = filmicToneMapping(color);
    } else if (enableToneMapping == 7) {
        color = Uncharted2ToneMapping(color);
    } else if(enableToneMapping == 8) {
        color = Simple(color);
    } else if(enableToneMapping == 9) {
        color = MyToneMap(color);
    }

    float saturation = dataVec1.r;
    float contrast = dataVec1.g;
    float brightness = dataVec1.b;

    color = (brighten(brightness) * addContrast(contrast) * saturate(saturation) * vec4(color, 1.0f)).rgb;


} else {
    if (enableGammaCorrection == 1) {
        color = pow(color, vec3(1.0f / 2.2f));
    }
}

outColor = vec4(color, 1.0f);
}
`;

