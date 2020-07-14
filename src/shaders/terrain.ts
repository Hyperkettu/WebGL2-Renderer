import { PointLight } from '../pointlight';

export const prefixVS = 'terrainVS';
export const prefixFS = 'terrainFS';

export function getTerrainSrc(hasNormalMap: boolean, hasRoughnessMap: boolean, hasMetallicMap: boolean, hasAoMap: boolean, hasDisplacementMap: boolean, hasEmissionMap: boolean) {

	const vsSrc =

		`#version 300 es

		precision highp float;
		precision highp sampler2DArray;


		layout(location = 0) in vec3 position;
		layout(location = 1) in vec3 normal;
		layout(location = 2) in vec2 texCoords;
		layout(location = 3) in vec3 tangent;

		layout (std140) uniform MatricesPerFrame {
   			mat4 projection;
    		mat4 view;
		};

		layout (std140) uniform PerObject {
			highp mat4 world;
			highp float displacementFactor;
			highp float pointLightIndex;
		};

		layout(std140) uniform Data {
			vec4 dataVec1;
			vec4 dataVec2;
			bool value;
		};

		${hasDisplacementMap ? 'uniform sampler2DArray displacements;' : ''}
		${hasDisplacementMap ? 'uniform sampler2D blendMap;' : ''}

		out vec2 uvs;
		out vec3 positionW;
		out vec3 normalW;
		out mat3 TBN;

    	void main() {
			uvs = texCoords;
    		positionW = (world * vec4(position, 1.0f)).xyz;
    		mat3 normalMatrix = transpose(inverse(mat3(world)));
			normalW = normalize(normalMatrix * normal);

    		vec3 T = normalize(mat3(world) * tangent);
    		// Gram-Schmidt
    		T = normalize(T - dot(T, normalW) * normalW);
    		vec3 B = cross(normalW, T);
			TBN = mat3(T, B, normalW);

			float tileScale = dataVec1.r;
			vec2 tiledUvs = uvs.st * tileScale;

			${hasDisplacementMap ?
			'vec4 blend = texture(blendMap, uvs.st).rgba;' +
			'float disp = texture(displacements, vec3(tiledUvs, 0.0f)).r;' +
			'float disp2 = texture(displacements, vec3(tiledUvs, 1.0f)).r;' +
			'float disp3 = texture(displacements, vec3(tiledUvs, 2.0f)).r;' +
			'float disp4 = texture(displacements, vec3(tiledUvs, 3.0f)).r;' +
			'float disp5 = texture(displacements, vec3(tiledUvs, 4.0f)).r;' +
			'disp = mix(disp, disp2, blend.r);' +
			'disp = mix(disp, disp3, blend.g);' +
			'disp = mix(disp, disp4, blend.b);' +
			'disp = mix(disp, disp5, blend.a);' +
			'float displacement = displacementFactor * disp;' +
			'positionW = positionW + displacement * normalW;' : ''
		}

			gl_Position = projection * view * vec4(positionW, 1.0f);

    	}
`;

	const fsSrc =

		`#version 300 es

		precision highp float;
		precision highp sampler2DArray;

		#define NUM_LIGHTS ${ PointLight.NUM_LIGHTS}

		struct PointLight {
			vec3 color;
			float colorPadding;
			vec3 position;
			float positionPadding;
			float near;
			float radius;
			float intensity;
			float padding;
		};

		struct DirLight {
			vec3 color;
			float intensity;
			vec3 direction;
			float directionPadding;
		};

		${ hasEmissionMap ? 'uniform sampler2D emissionMap;' : ''}

		uniform sampler2D blendMap;
		uniform sampler2DArray albedos;
		${hasNormalMap ? 'uniform sampler2DArray normals;' : ''}
		${hasAoMap ? 'uniform sampler2DArray aos;' : ''}
		${hasRoughnessMap ? 'uniform sampler2DArray roughnesses;' : ''}
		${hasMetallicMap ? 'uniform sampler2DArray metallics;' : ''}

		uniform sampler2D brdfLUT;
		uniform samplerCube irradianceMap;
		uniform samplerCube prefilterMap;

		${ 1 <= PointLight.NUM_LIGHTS ? `uniform samplerCube pointLightShadowMap${1};` : ''}
		${ 2 <= PointLight.NUM_LIGHTS ? `uniform samplerCube pointLightShadowMap${2};` : ''}
		${ 3 <= PointLight.NUM_LIGHTS ? `uniform samplerCube pointLightShadowMap${3};` : ''}
		${ 4 <= PointLight.NUM_LIGHTS ? `uniform samplerCube pointLightShadowMap${4};` : ''}
		${ 5 <= PointLight.NUM_LIGHTS ? `uniform samplerCube pointLightShadowMap${5};` : ''}

		layout(std140) uniform Lights {
			${PointLight.NUM_LIGHTS > 0 ? 'PointLight pointLights[NUM_LIGHTS]' : ''}
			DirLight dirLight;

			vec3 eyePositionW;
		};

		layout (std140) uniform PerObject {
			highp mat4 world;
			highp float displacementFactor;
			highp float pointLightIndex;
		};

		layout(std140) uniform Data {
			vec4 dataVec1;
			vec4 dataVec2;
			bool value;
		};

		in vec2 uvs;
		in vec3 positionW;
		in vec3 normalW;
		in mat3 TBN;

		layout(location = 0) out vec4 outColor;
		layout(location = 1) out vec4 bloomColor;


		const float PI = 3.14159265359f;

		float CalcPointLightShadowFactor(PointLight light, vec3 positionWorld, samplerCube pointLightShadowMap);
		float DistributionGGX(vec3 N, vec3 H, float roughness);
		float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness);
		float GeometrySchlickGGX(float NdotV, float roughness);
		vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness);
		vec3 fresnelSchlick(float cosTheta, vec3 F0);
		vec3 CalcDirLight(DirLight light, vec3 N, vec3 V, vec3 F0, vec3 albedo, float roughness, float metallic);
		vec3 CalcPointLight(PointLight light, vec3 N, vec3 V, vec3 F0, vec3 albedo, float roughness, float metallic, samplerCube pointLightShadowMap);
		vec3 mon2lin(vec3 x);
		vec3 EnvRemap(vec3 color);
		vec4 ogl_pbr(vec3 N, vec3 albedo, float roughness, float metallic, float ao);

		void main() {

			float tileScale = dataVec1.r;
			vec2 tiledUvs = uvs.st * tileScale;

			vec4 blend = texture(blendMap, uvs.st).rgba;

			vec4 albedo1WithAlpha = texture(albedos, vec3(tiledUvs.st, 0.0f)).rgba;
			vec4 albedo2WithAlpha = texture(albedos, vec3(tiledUvs.st, 1.0f)).rgba;
			vec4 albedo3WithAlpha = texture(albedos, vec3(tiledUvs.st, 2.0f)).rgba;
			vec4 albedo4WithAlpha = texture(albedos, vec3(tiledUvs.st, 3.0f)).rgba;
			vec4 albedo5WithAlpha = texture(albedos, vec3(tiledUvs.st, 4.0f)).rgba;

			vec3 albedo = mix(albedo1WithAlpha.rgb, albedo2WithAlpha.rgb, blend.r);
			albedo = mix(albedo, albedo3WithAlpha.rgb, blend.g);
			albedo = mix(albedo, albedo4WithAlpha.rgb, blend.b);
			albedo = mix(albedo, albedo5WithAlpha.rgb, blend.a);

			float alpha = mix(albedo1WithAlpha.a, albedo2WithAlpha.a, blend.r);
			alpha = mix(alpha, albedo3WithAlpha.a, blend.g);
			alpha = mix(alpha, albedo4WithAlpha.a, blend.b);
			alpha = mix(alpha, albedo5WithAlpha.a, blend.a);

			${hasAoMap ? 'float ao = texture(aos, vec3(tiledUvs.st, 0.0f)).r;' +
			'float ao2 = texture(aos, vec3(tiledUvs.st, 1.0f)).r;' +
			'float ao3 = texture(aos, vec3(tiledUvs.st, 2.0f)).r;' +
			'float ao4 = texture(aos, vec3(tiledUvs.st, 3.0f)).r;' +
			'float ao5 = texture(aos, vec3(tiledUvs.st, 4.0f)).r;' +

			'ao = mix(ao, ao2, blend.r);' +
			'ao = mix(ao, ao3, blend.g);' +
			'ao = mix(ao, ao4, blend.b);' +
			'ao = mix(ao, ao5, blend.a);'

			: 'float ao = 1.0f;'}

			${hasRoughnessMap ? 'float roughness = texture(roughnesses, vec3(tiledUvs.st, 0.0f)).r;' +
			'float roughness2 = texture(roughnesses, vec3(tiledUvs.st, 1.0f)).r;' +
			'float roughness3 = texture(roughnesses, vec3(tiledUvs.st, 2.0f)).r;' +
			'float roughness4 = texture(roughnesses, vec3(tiledUvs.st, 3.0f)).r;' +
			'float roughness5 = texture(roughnesses, vec3(tiledUvs.st, 4.0f)).r;' +

			'roughness = mix(roughness, roughness2, blend.r);' +
			'roughness = mix(roughness, roughness3, blend.g);' +
			'roughness = mix(roughness, roughness4, blend.b);' +
			'roughness = mix(roughness, roughness5, blend.a);'

			: 'float roughness = 0.5f;' }

			${hasMetallicMap ? 'float metallic = texture(metallics, vec3(tiledUvs.st, 0.0f)).r;' +
			'float metallic2 = texture(metallics, vec3(tiledUvs.st, 1.0f)).r;' +
			'float metallic3 = texture(metallics, vec3(tiledUvs.st, 2.0f)).r;' +
			'float metallic4 = texture(metallics, vec3(tiledUvs.st, 3.0f)).r;' +
			'float metallic5 = texture(metallics, vec3(tiledUvs.st, 4.0f)).r;' +

			'metallic = mix(metallic, metallic2, blend.r);' +
			'metallic = mix(metallic, metallic3, blend.g);' +
			'metallic = mix(metallic, metallic4, blend.b);' +
			'metallic = mix(metallic, metallic5, blend.a);' : 

			'float metallic = 0.0f;'}

			${hasNormalMap ? 'vec3 N1 = (2.0 * texture(normals, vec3(tiledUvs.st, 0.0f)) - 1.0).rgb;' +
			'N1 = normalize(TBN * N1);' +
			'vec3 N2 = (2.0 * texture(normals, vec3(tiledUvs.st, 1.0f)) - 1.0).rgb;' +
			'N2 = normalize(TBN * N2);' +
			'vec3 N3 = (2.0 * texture(normals, vec3(tiledUvs.st, 2.0f)) - 1.0).rgb;' +
			'N3 = normalize(TBN * N3);' +
			'vec3 N4 = (2.0 * texture(normals, vec3(tiledUvs.st, 3.0f)) - 1.0).rgb;' +
			'N4 = normalize(TBN * N4);' +
			'vec3 N5 = (2.0 * texture(normals, vec3(tiledUvs.st, 4.0f)) - 1.0).rgb;' +
			'N5 = normalize(TBN * N5);' +

			'vec3 N = mix(N1, N2, blend.r);' +
			'N = normalize(N);' +
			'N = mix(N, N3, blend.g);' +
			'N = normalize(N);' +
			'N = mix(N, N4, blend.b);' +
			'N = normalize(N);' +
			'N = mix(N, N5, blend.a);' +
			'N = normalize(N);' :

			'vec3 N = normalize(normalW);'}

			outColor = ogl_pbr(N, albedo, roughness, metallic, ao);

			${hasEmissionMap ?
			'vec3 emission = texture(emissionMap, uvs).rgb;' +
			'int index = int(clamp(pointLightIndex, 0.0f, 4.0f));' +
			'if(index == 0) {' +
			`	${0 < PointLight.NUM_LIGHTS ? 'outColor.rgb += emission * pointLights[0].color * pointLights[0].intensity;' : ''}` +
			'} else if(index == 1) {' +
			`	${1 < PointLight.NUM_LIGHTS ? 'outColor.rgb += emission * pointLights[1].color * pointLights[1].intensity;' : ''}` +
			'} else if(index == 2) {' +
			`	${2 < PointLight.NUM_LIGHTS ? 'outColor.rgb += emission * pointLights[2].color * pointLights[2].intensity;' : ''}` +
			'} else if (index == 3) {' +
			`	${3 < PointLight.NUM_LIGHTS ? 'outColor.rgb += emission * pointLights[3].color * pointLights[3].intensity;' : ''}` +
			'} else if (index == 4) {' +
			`	${4 < PointLight.NUM_LIGHTS ? 'outColor.rgb += emission * pointLights[4].color * pointLights[4].intensity;' : ''}` +
			'} else { outColor.rgb += vec3(pointLightIndex, 1.0f, 1.0f); }' : ''
		}

			outColor.a = alpha;

			float luma = dot(outColor.rgb, vec3(0.2126f, 0.7152f, 0.0722f));
			if (luma > 1.0f) {
				bloomColor = vec4(outColor.rgb, 1.0);
			} else {
				bloomColor = vec4(0.0, 0.0, 0.0, 1.0);
			}
		}

float LinearizeDepth(float depth) {
	float z = depth * 2.0 - 1.0; // transform to normalized device coordinates
	return (2.0 * 1.0 * 30.0) / (30.0 + 1.0 - z * (30.0 - 1.0));
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
	float bias = 0.05f;
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

vec3 mon2lin(vec3 x) {
	return vec3(pow(x[0], 2.2), pow(x[1], 2.2), pow(x[2], 2.2));
}

vec3 EnvRemap(vec3 color) {
	return pow(2.0 * color, vec3(2.2f));
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
	vec3 prefilteredColor = textureLod(prefilterMap, R, roughness * MAX_REFLECTION_LOD).rgb;
	vec2 brdf = texture(brdfLUT, vec2(max(dot(N, V), 0.0f), roughness)).rg;
	vec3 specular = prefilteredColor * (F * brdf.x + brdf.y);

	vec3 ambient = (kD * diffuse + specular) * ao;

	vec3 color = ambient + Lo;
	return vec4(color, 1.0f);
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



float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
	float NdotV = max(dot(N, V), 0.0f);
	float NdotL = max(dot(N, L), 0.0f);
	float ggx2 = GeometrySchlickGGX(NdotV, roughness);
	float ggx1 = GeometrySchlickGGX(NdotL, roughness);

	return ggx1 * ggx2;
}

float GeometrySchlickGGX(float NdotV, float roughness) {
	float r = (roughness + 1.0f);
	float k = (r * r) / 8.0f;

	float nom = NdotV;
	float denom = NdotV * (1.0f - k) + k;

	return nom / denom;
}

vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
	return F0 + (max(vec3(1.0f - roughness), F0) - F0) * pow(1.0f - cosTheta, 5.0f);
}

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
	return F0 + (1.0f - F0) * pow(1.0f - cosTheta, 5.0f);
}
`;

	return { vsSrc, fsSrc };

}

