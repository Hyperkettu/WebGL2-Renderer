
import { PointLight } from '../pointlight';

export const commonPbrSource = 

`
vec3 mon2lin(vec3 x) {
	return vec3(pow(x[0], 2.2f), pow(x[1], 2.2f), pow(x[2], 2.2f));
}

vec3 EnvRemap(vec3 color) {
	return pow(2.0 * color, vec3(2.2f));
}

float DistributionGGX(vec3 N, vec3 H, float roughness) {
	float a = roughness * roughness;
	float a2 = a * a;
	float NdotH = max(dot(N, H), 0.0f);
	float NdotH2 = NdotH * NdotH;

	float nom = a2;
	float denom = (NdotH2 * (a2 - 1.0f) + 1.0f);
	denom = PI * denom * denom;

	return nom / denom;
}

float GeometrySchlickGGX(float NdotV, float roughness) {
	float r = (roughness + 1.0f);
	float k = (r * r) / 8.0f;

	float nom = NdotV;
	float denom = NdotV * (1.0f - k) + k;

	return nom / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
	float NdotV = max(dot(N, V), 0.0f);
	float NdotL = max(dot(N, L), 0.0f);
	float ggx2 = GeometrySchlickGGX(NdotV, roughness);
	float ggx1 = GeometrySchlickGGX(NdotL, roughness);

	return ggx1 * ggx2;
}

vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
	return F0 + (max(vec3(1.0f - roughness), F0) - F0) * pow(1.0f - cosTheta, 5.0f);
}

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
	return F0 + (1.0f - F0) * pow(1.0f - cosTheta, 5.0f);
}

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

vec3 CalcPointLight(PointLight light, vec3 N, vec3 V, vec3 F0, vec3 albedo, float roughness, float metallic, samplerCube pointLightShadowMap) {
	// calculate per-light radiance
	vec3 L = light.position - positionW;
	float distance = length(L);
	L = normalize(L);
	vec3 H = normalize(V + L);
	float falloff = (pow(clamp(1.0f - pow(distance / light.radius, 4.0f), 0.0f, 1.0f), 2.0f)) / (distance + 1.0f);
	vec3 radiance = light.color * light.intensity * falloff; //(1.0f / (pointLightAttenuation.x * distance * distance + pointLightAttenuation.y * distance + pointLightAttenuation.z));

	// Cook-Torrance BRDF
	float NDF = DistributionGGX(N, H, roughness);
	float G = GeometrySmith(N, V, L, roughness);
	vec3 F = fresnelSchlick(max(dot(H, V), 0.0f), F0);

	vec3 nominator = NDF * G * F;
	float denominator = 4.0f * max(dot(N, V), 0.0f) * max(dot(N, L), 0.0f) + 0.001f; // 0.001 to prevent divide by zero.
	vec3 specular = nominator / denominator;

	// kS is equal to Fresnel
	vec3 kS = F;
	// for energy conservation, the diffuse and specular light can't
	// be above 1.0 (unless the surface emits light); to preserve this
	// relationship the diffuse component (kD) should equal 1.0 - kS.
	vec3 kD = vec3(1.0f) - kS;
	// multiply kD by the inverse metalness such that only non-metals
	// have diffuse lighting, or a linear blend if partly metal (pure metals
	// have no diffuse light).
	kD *= 1.0f - metallic;

	// scale light by NdotL
	float NdotL = max(dot(N, L), 0.0f);

	float shadowFactor = CalcPointLightShadowFactor(light, positionW, pointLightShadowMap);

	// add to outgoing radiance Lo
	return shadowFactor * (kD * albedo / PI + specular) * radiance * NdotL; // note that we already multiplied the BRDF by the Fresnel (kS) so we won't multiply by kS again
}

// Calculates the color when using a directional light.
vec3 CalcDirLight(DirLight dirLight, vec3 N, vec3 V, vec3 F0, vec3 albedo, float roughness, float metallic) {
	// calculate per-light radiance
	vec3 L = normalize(-dirLight.direction);
	vec3 H = normalize(V + L);
	vec3 radiance = dirLight.color * dirLight.intensity;

	// Cook-Torrance BRDF
	float NDF = DistributionGGX(N, H, roughness);
	float G = GeometrySmith(N, V, L, roughness);
	vec3 F = fresnelSchlick(max(dot(H, V), 0.0f), F0);

	vec3 nominator = NDF * G * F;
	float denominator = 4.0f * max(dot(N, V), 0.0f) * max(dot(N, L), 0.0f) + 0.001f; // 0.001 to prevent divide by zero.
	vec3 specular = nominator / denominator;

	// kS is equal to Fresnel
	vec3 kS = F;
	// for energy conservation, the diffuse and specular light can't
	// be above 1.0 (unless the surface emits light); to preserve this
	// relationship the diffuse component (kD) should equal 1.0 - kS.
	vec3 kD = vec3(1.0f) - kS;
	// multiply kD by the inverse metalness such that only non-metals
	// have diffuse lighting, or a linear blend if partly metal (pure metals
	// have no diffuse light).
	kD *= 1.0f - metallic;

	// scale light by NdotL
	float NdotL = max(dot(N, L), 0.0f);

	// add to outgoing radiance Lo
	return (kD * albedo / PI + specular) * radiance * NdotL; // note that we already multiplied the BRDF by the Fresnel (kS) so we won't multiply by kS again
}

vec4 ogl_pbr(vec3 N, vec3 albedo, float roughness, float metallic, float ao) {

	albedo = mon2lin(albedo);

	vec3 V = normalize(eyePositionW - positionW);
	vec3 R = reflect(-V, N);

	// calculate reflectance at normal incidence; if dia-electric (like plastic) use F0
	// of 0.04 and if it's a metal, use the albedo color as F0 (metallic workflow)
	vec3 F0 = vec3(0.04f);
	F0 = mix(F0, albedo, metallic);

	// calculate sun
	vec3 Lo = CalcDirLight(dirLight, N, V, F0, albedo, roughness, metallic);

	${
		1 <= PointLight.NUM_LIGHTS ?
			'Lo += CalcPointLight(pointLights[0], N, V, F0, albedo, roughness, metallic, pointLightShadowMap1);' : ''
		}

	${
		2 <= PointLight.NUM_LIGHTS ?
			'Lo += CalcPointLight(pointLights[1], N, V, F0, albedo, roughness, metallic, pointLightShadowMap2);' : ''
		}

	${
		3 <= PointLight.NUM_LIGHTS ?
			'Lo += CalcPointLight(pointLights[2], N, V, F0, albedo, roughness, metallic, pointLightShadowMap3);' : ''
		}

	${
		4 <= PointLight.NUM_LIGHTS ?
			'Lo += CalcPointLight(pointLights[3], N, V, F0, albedo, roughness, metallic, pointLightShadowMap4);' : ''
		}

	${
		5 <= PointLight.NUM_LIGHTS ?
			'Lo += CalcPointLight(pointLights[4], N, V, F0, albedo, roughness, metallic, pointLightShadowMap5);' : ''
		}

	// ambient lighting (we now use IBL as the ambient term)
	vec3 F = fresnelSchlickRoughness(max(dot(N, V), 0.0f), F0, roughness);

	vec3 kS = F;
	vec3 kD = 1.0f - kS;
	kD *= 1.0f - metallic;

	vec3 irradiance = texture(irradianceMap, N).rgb;
	vec3 diffuse = irradiance * albedo;

	// sample both the pre-filter map and the BRDF lut and combine them together as per the Split-Sum approximation to get the IBL specular part.
	const float MAX_REFLECTION_LOD = 5.0f;
	vec3 prefilteredColor = EnvRemap(textureLod(prefilterMap, R, roughness * MAX_REFLECTION_LOD).rgb);
	vec2 brdf = texture(brdfLUT, vec2(max(dot(N, V), 0.0f), roughness)).rg;
	vec3 specular = prefilteredColor * (F * brdf.x + brdf.y);

	vec3 ambient = (kD * diffuse + specular) * ao;

	vec3 color = ambient + Lo;
	return vec4(color, 1.0f);
}

`;