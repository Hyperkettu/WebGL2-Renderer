
export const prefix = 'irradianceFS';

export const irradianceFsSrc =

`#version 300 es

precision highp float;

layout(std140) uniform Data {
	vec4 dataVec1;
	vec4 dataVec2;
	bool value;
};

in vec3 positionW;

out vec4 outColor;

uniform samplerCube environmentMap;

const float PI = 3.14159265359;

void main() {

	vec3 N = normalize(positionW);

	float skyboxIntensity = dataVec1.r;

	vec3 irradiance = vec3(0.0f);

	// tangent space calculation from origin point
	vec3 up = vec3(0.0f, 1.0f, 0.0f);
	vec3 right = cross(up, N);
	up = cross(N, right);

	float sampleDelta = 0.025f;
	float nrSamples = 0.0f;
	for (float phi = 0.0f; phi < 2.0f * PI; phi += sampleDelta)
	{
		for (float theta = 0.0f; theta < 0.5f * PI; theta += sampleDelta)
		{
			// spherical to cartesian (in tangent space)
			vec3 tangentSample = vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta));
			// tangent space to world
			vec3 sampleVec = tangentSample.x * right + tangentSample.y * up + tangentSample.z * N;

			irradiance += texture(environmentMap, sampleVec).rgb * skyboxIntensity * cos(theta) * sin(theta);
			nrSamples++;
		}
	}
	irradiance = PI * irradiance * (1.0 / float(nrSamples));

	outColor = vec4(irradiance, 1.0);
}
`;
