
export const commonPbrSource = 

`
float CalcPointLightShadowFactor(PointLight light, vec3 positionWorld, samplerCube pointLightShadowMap) {

	vec3 offsets[20] = vec3[](
		vec3(1, 1, 1), vec3(1, -1, 1), vec3(-1, -1, 1), vec3(-1, 1, 1),
		vec3(1, 1, -1), vec3(1, -1, -1), vec3(-1, -1, -1), vec3(-1, 1, -1),
		vec3(1, 1, 0), vec3(1, -1, 0), vec3(-1, -1, 0), vec3(-1, 1, 0),
		vec3(1, 0, 1), vec3(-1, 0, 1), vec3(1, 0, -1), vec3(-1, 0, -1),
		vec3(0, 1, 1), vec3(0, -1, 1), vec3(0, -1, -1), vec3(0, 1, -1)
	);

	float shadow = 0.0;
	float bias = 0.1f;
	int samples = 20;

	vec3 dirToLight = light.position - positionWorld;
	float normalBias = (1.0f - (dot(dirToLight, normalW) / length(dirToLight))) * 0.1f;
	vec3 normalBiasPosition = positionWorld + normalW * normalBias;
	vec3 dirFromLight = normalBiasPosition - light.position;
	float distanceToLight = length(dirFromLight);
	float currentDistanceToLight = (distanceToLight - light.near) / (light.radius - light.near);

	float diskRadius = 0.05f;
	for (int i = 0; i < samples; ++i) {
		float closestDepth = texture(pointLightShadowMap, dirFromLight + offsets[i] * diskRadius).r;

		if (currentDistanceToLight - bias > closestDepth) {
			shadow += 1.0f;
		}
	}
	shadow /= float(samples);
	return 1.0f - shadow;
}

`;