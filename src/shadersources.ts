import { PointLight } from './pointlight';

export function GetPbrSrc(hasNormalMap: boolean, hasRoughnessMap: boolean, hasMetallicMap: boolean, hasAoMap: boolean, hasDisplacementMap: boolean, hasEmissionMap: boolean, morphedMesh?: boolean) {
	
	let pbrVsSrc = morphedMesh ? 
	`#version 300 es
	
	precision highp float;

	layout(location = 0) in vec3 position1;
	layout(location = 1) in vec3 position2;
	layout(location = 2) in vec3 normal1;
	layout(location = 3) in vec3 normal2;
	layout(location = 4) in vec2 texCoords;
	layout(location = 5) in vec3 tangent1;
	layout(location = 6) in vec3 tangent2;

	layout (std140) uniform MatricesPerFrame {
		mat4 projection;
		mat4 view;
	};

	layout (std140) uniform PerObject {
		mat4 world;
		highp float displacementFactor;
		highp float pointLightIndex;
	};

	layout (std140) uniform Data {
		vec4 dataVec1;
		vec4 dataVec2;
		bool value;
	};

	${hasDisplacementMap ? 'uniform sampler2D displacementMap;' : ''}
	
	out vec2 uvs;
	out vec3 positionW;
	out vec3 normalW;
	out mat3 TBN;

	void main() {

		float weight = clamp(dataVec1.x, 0.0f, 1.0f);

		vec3 position = weight * position1 + (1.0f - weight) * position2;
		vec3 normal = weight * normal1 + (1.0f - weight) * normal2;
		vec3 tangent = weight * tangent1 + (1.0f - weight) * tangent2;
		tangent = tangent - dot(tangent, normal) * normal; // Gram-Schmidt

		uvs = texCoords;
    	positionW = (world * vec4(position, 1.0f)).xyz;
    	mat3 normalMatrix = transpose(inverse(mat3(world)));
		normalW = normalize(normalMatrix * normal);

    	vec3 T = normalize(mat3(world) * tangent);
    	// Gram-Schmidt
    	T = normalize(T - dot(T, normalW) * normalW);
    	vec3 B = cross(normalW, T);
		TBN = mat3(T, B, normalW);

		${hasDisplacementMap ?
		'float displacement = displacementFactor * texture(displacementMap, uvs).r;' +
		'positionW = positionW + displacement * normalW;' : ''}

		gl_Position = projection * view * vec4(positionW, 1.0f);
	}
	` :

 		`#version 300 es

		precision highp float;

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

		${hasDisplacementMap ? 'uniform sampler2D displacementMap;' : ''}

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

			${hasDisplacementMap ?
			'float displacement = displacementFactor * texture(displacementMap, uvs).r;' +
			'positionW = positionW + displacement * normalW;' : ''
		}

			gl_Position = projection * view * vec4(positionW, 1.0f);

    	}
`;

	const pbrFsSrc =

		`#version 300 es

		precision highp float;

		${PointLight.NUM_LIGHTS > 0 ? `#define NUM_LIGHTS ${ PointLight.NUM_LIGHTS}`: ''}

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

		uniform sampler2D albedoMap;
		${ hasNormalMap ? 'uniform sampler2D normalMap;' : ''}
		${ hasAoMap ? 'uniform sampler2D aoMap;' : ''}
		${ hasMetallicMap ? 'uniform sampler2D metallicMap;' : ''}
		${ hasRoughnessMap ? 'uniform sampler2D roughnessMap;' : ''}
		${ hasEmissionMap ? 'uniform sampler2D emissionMap;' : ''}

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

			vec4 albedoWithAlpha = texture(albedoMap, uvs.st).rgba;
			vec3 albedo = albedoWithAlpha.rgb;
			${hasAoMap ? 'float ao = texture(aoMap, uvs.st).r;' : 'float ao = 1.0f;'}
			${hasMetallicMap ? 'float metallic = texture(metallicMap, uvs.st).r;' : 'float metallic = 0.0f;'}
			${hasRoughnessMap ? 'float roughness = texture(roughnessMap, uvs.st).r;' : 'float roughness = 0.0f;'}
			${hasNormalMap ?
			'vec3 N = (2.0 * texture(normalMap, uvs.st) - 1.0).rgb;' +
			'N = normalize(TBN * N);' :
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

			outColor.a = albedoWithAlpha.a;

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
	vec3 prefilteredColor = EnvRemap(textureLod(prefilterMap, R, roughness * MAX_REFLECTION_LOD).rgb);
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

	return { pbrVsSrc, pbrFsSrc };

}

export const fillScreenVsSrc =

	`#version 300 es

layout(location = 0) in vec3 position;
layout(location = 1) in vec2 texCoords;

out vec2 uvs;

void main()
{
	uvs = texCoords;
	gl_Position = vec4(position, 1.0);
}
`;

export const fillScreenFsSrc =

	`#version 300 es

precision highp float;

	in vec2 uvs;

out vec4 outColor;

uniform sampler2D screenTexture;

void main() {
	outColor = texture(screenTexture, uvs);
}
`;

export const brdfFsSrc =

	`#version 300 es

precision highp float;

	in vec2 uvs;

out vec2 color;

const float PI = 3.14159265359;

float RadicalInverse_VdC(uint bits) {
	bits = (bits << 16u) | (bits >> 16u);
	bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
	bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
	bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
	bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
	return float(bits) * 2.3283064365386963e-10; // / 0x100000000
}

vec2 Hammersley(uint i, uint N) {
	return vec2(float(i) / float(N), RadicalInverse_VdC(i));
}

vec3 ImportanceSampleGGX(vec2 Xi, vec3 N, float roughness) {
	float a = roughness * roughness;

	float phi = 2.0 * PI * Xi.x;
	float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a * a - 1.0) * Xi.y));
	float sinTheta = sqrt(1.0 - cosTheta * cosTheta);

	// from spherical coordinates to cartesian coordinates - halfway vector
	vec3 H;
	H.x = cos(phi) * sinTheta;
	H.y = sin(phi) * sinTheta;
	H.z = cosTheta;

	// from tangent-space H vector to world-space sample vector
	vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
	vec3 tangent = normalize(cross(up, N));
	vec3 bitangent = cross(N, tangent);

	vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;
	return normalize(sampleVec);
}

float GeometrySchlickGGX(float NdotV, float roughness) {
	// note that we use a different k for IBL
	float a = roughness;
	float k = (a * a) / 2.0;

	float nom = NdotV;
	float denom = NdotV * (1.0 - k) + k;

	return nom / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
{
	float NdotV = max(dot(N, V), 0.0);
	float NdotL = max(dot(N, L), 0.0);
	float ggx2 = GeometrySchlickGGX(NdotV, roughness);
	float ggx1 = GeometrySchlickGGX(NdotL, roughness);

	return ggx1 * ggx2;
}

vec2 IntegrateBRDF(float NdotV, float roughness) {
	vec3 V;
	V.x = sqrt(1.0 - NdotV * NdotV);
	V.y = 0.0;
	V.z = NdotV;

	float A = 0.0;
	float B = 0.0;

	vec3 N = vec3(0.0, 0.0, 1.0);

	const uint SAMPLE_COUNT = 1024u;
	for (uint i = 0u; i < SAMPLE_COUNT; ++i)
	{
		// generates a sample vector that's biased towards the
		// preferred alignment direction (importance sampling).
		vec2 Xi = Hammersley(i, SAMPLE_COUNT);
		vec3 H = ImportanceSampleGGX(Xi, N, roughness);
		vec3 L = normalize(2.0 * dot(V, H) * H - V);

		float NdotL = max(L.z, 0.0);
		float NdotH = max(H.z, 0.0);
		float VdotH = max(dot(V, H), 0.0);

		if (NdotL > 0.0) {
			float G = GeometrySmith(N, V, L, roughness);
			float G_Vis = (G * VdotH) / (NdotH * NdotV);
			float Fc = pow(1.0 - VdotH, 5.0);

			A += (1.0 - Fc) * G_Vis;
			B += Fc * G_Vis;
		}
	}
	A /= float(SAMPLE_COUNT);
	B /= float(SAMPLE_COUNT);
	return vec2(A, B);
}

void main() {
	vec2 integratedBRDF = IntegrateBRDF(uvs.x, uvs.y);
	color = integratedBRDF;
}
`;

export const skyboxVsSrc =
	`#version 300 es

layout(location = 0) in vec3 position;
out vec3 uvs;

layout(std140) uniform MatricesPerFrame {
	mat4 projection;
	mat4 view;
};

void main() {
	// no world transform so that the cube moves along with the viever
	mat4 viewSkybox = mat4(mat3(view));
	vec4 pos = projection * viewSkybox * vec4(position, 1.0);
	// move the skybox depth to far plane z = w/w = 1
	gl_Position = pos.xyww;
	uvs = position;
}
`;

export const skyboxFsSrc =
	`#version 300 es

precision highp float;

layout(std140) uniform Data {
	vec4 dataVec1;
	vec4 dataVec2;
	bool value;
};


in vec3 uvs;

layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 bloomColor;

uniform samplerCube skybox;

void main()	{
	float intensity = dataVec1.r;
	vec3 color = texture(skybox, uvs).rgb * intensity;
	outColor = vec4(color, 1.0f);

	float luma = dot(outColor.rgb, vec3(0.2126f, 0.7152f, 0.0722f));
	if (luma > 1.0f) {
		bloomColor = vec4(outColor.rgb, 1.0f);
	} else {
		bloomColor = vec4(0.0f, 0.0f, 0.0f, 1.0f);
	}
}
`;

export const irradianceVsSrc =

	`#version 300 es

layout(location = 0) in vec3 position;

layout(std140) uniform MatricesPerFrame {
	mat4 projection;
	mat4 view;
};

out vec3 positionW;

void main() {
	positionW = position;
	gl_Position = projection * view * vec4(positionW, 1.0);
}
`;

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

export const prefilterVsSrc =

	`#version 300 es

layout(location = 0) in vec3 position;

layout(std140) uniform MatricesPerFrame {
	mat4 projection;
	mat4 view;
};

out vec3 positionW;

void main() {
	positionW = position;
	gl_Position = projection * view * vec4(positionW, 1.0);
}
`;

export const prefilterFsSrc =

	`#version 300 es

precision highp float;

	in vec3 positionW;

out vec4 outColor;

uniform samplerCube envMap;

layout(std140) uniform Data {
	vec4 dataVec1;
	vec4 dataVec2;
	bool value;
};

float PI = 3.14159265359f;

float DistributionGGX(vec3 N, vec3 H, float roughness) {

	float a = roughness * roughness;
	float a2 = a * a;
	float NdotH = max(dot(N, H), 0.0);
	float NdotH2 = NdotH * NdotH;

	float nom = a2;
	float denom = (NdotH2 * (a2 - 1.0) + 1.0);
	denom = PI * denom * denom;

	return nom / denom;
}

float RadicalInverse_VdC(uint bits) {

	bits = (bits << 16u) | (bits >> 16u);
	bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
	bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
	bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
	bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
	return float(bits) * 2.3283064365386963e-10; // / 0x100000000
}

vec2 Hammersley(uint i, uint N) {
	return vec2(float(i) / float(N), RadicalInverse_VdC(i));
}

vec3 ImportanceSampleGGX(vec2 Xi, vec3 N, float roughness) {

	float a = roughness * roughness;

	float phi = 2.0 * PI * Xi.x;
	float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a * a - 1.0) * Xi.y));
	float sinTheta = sqrt(1.0 - cosTheta * cosTheta);

	// from spherical coordinates to cartesian coordinates - halfway vector
	vec3 H;
	H.x = cos(phi) * sinTheta;
	H.y = sin(phi) * sinTheta;
	H.z = cosTheta;

	// from tangent-space H vector to world-space sample vector
	vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
	vec3 tangent = normalize(cross(up, N));
	vec3 bitangent = cross(N, tangent);

	vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;
	return normalize(sampleVec);
}


void main() {

	float roughness = dataVec1.r; // roughness stored in red
	float skyboxIntensity = dataVec1.g;

	vec3 N = normalize(positionW);

	// make the simplyfying assumption that V equals R equals the normal
	vec3 R = N;
	vec3 V = R;

	const uint SAMPLE_COUNT = 1024u;
	vec3 prefilteredColor = vec3(0.0);
	float totalWeight = 0.0;

	for (uint i = 0u; i < SAMPLE_COUNT; ++i) {

		// generates a sample vector that's biased towards the preferred alignment direction (importance sampling).
		vec2 Xi = Hammersley(i, SAMPLE_COUNT);
		vec3 H = ImportanceSampleGGX(Xi, N, roughness);
		vec3 L = normalize(2.0 * dot(V, H) * H - V);

		float NdotL = max(dot(N, L), 0.0);
		if (NdotL > 0.0) {
			// sample from the environment's mip level based on roughness/pdf
			float D = DistributionGGX(N, H, roughness);
			float NdotH = max(dot(N, H), 0.0);
			float HdotV = max(dot(H, V), 0.0);
			float pdf = D * NdotH / (4.0 * HdotV) + 0.0001;

			float resolution = 512.0; // resolution of source cubemap (per face)
			float saTexel = 4.0 * PI / (6.0 * resolution * resolution);
			float saSample = 1.0 / (float(SAMPLE_COUNT) * pdf + 0.0001);

			float mipLevel = roughness == 0.0 ? 0.0 : 0.5 * log2(saSample / saTexel);

			prefilteredColor += textureLod(envMap, L, mipLevel).rgb * skyboxIntensity * NdotL;
			totalWeight += NdotL;
		}
	}
	prefilteredColor = prefilteredColor / totalWeight;

	outColor = vec4(prefilteredColor, 1.0);
}
`;

export const inversionFsSrc =

	`#version 300 es

precision highp float;

uniform sampler2D screenHdrBuffer;

	in vec2 uvs;

out vec4 outColor;

void main() {
	outColor = vec4(vec3(1.0 - texture(screenHdrBuffer, uvs)), 1.0f);
}
`;

export const tonemappingFsSrc =

	`#version 300 es

precision highp float;

uniform sampler2D screenHdrBuffer;
uniform int enableToneMapping;
uniform int enableGammaCorrection;

layout(std140) uniform Data {
	vec4 dataVec1;
	vec4 dataVec2;
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

export const grayScaleFsSrc =

	`#version 300 es

precision highp float;

uniform sampler2D screenHdrBuffer;

	in vec2 uvs;

out vec4 outColor;

void main() {
	vec3 color = texture(screenHdrBuffer, uvs).rgb;
	float grayScale = dot(color, vec3(0.2126f, 0.7152f, 0.0722f));
	outColor = vec4(grayScale, grayScale, grayScale, 1.0f) * vec4(0.0f, 0.3f, 0.0f, 1.0f);
}

`;

export const bloomFsSrc =

	`#version 300 es

precision highp float;

uniform sampler2D screenHdrBuffer;
uniform sampler2D bloomTexture;

	in vec2 uvs;

out vec4 outColor;

void main() {
	vec3 color = texture(screenHdrBuffer, uvs).rgb;
	vec3 bloomColor = texture(bloomTexture, uvs).rgb;
	color += bloomColor;
	outColor = vec4(color, 1.0f);
}

`;

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

export const sharpEdgesFsSrc =

	`#version 300 es

precision highp float;

uniform sampler2D screenHdrBuffer;

		in vec2 uvs;

out vec4 outColor;

const float offset = 1.0 / 800.0;

void main() {

	vec2 offsets[9] = vec2[](
		vec2(-offset, offset), // top-left
		vec2(0.0f, offset), // top-center
		vec2(offset, offset), // top-right
		vec2(-offset, 0.0f),   // center-left
		vec2(0.0f, 0.0f),   // center-center
		vec2(offset, 0.0f),   // center-right
		vec2(-offset, -offset), // bottom-left
		vec2(0.0f, -offset), // bottom-center
		vec2(offset, -offset)  // bottom-right
	);

	float kernel[9] = float[](
		-1.0f, -1.0f, -1.0f,
		-1.0f, 9.0f, -1.0f,
		-1.0f, -1.0f, -1.0f
	);

	vec3 colors[9];
	for (int i = 0; i < 9; i++) {
		colors[i] = vec3(texture(screenHdrBuffer, uvs.st + offsets[i]));
	}
	vec3 color = vec3(0.0f);
	for (int i = 0; i < 9; i++)
	color += colors[i] * kernel[i];

	outColor = vec4(color, 1.0);
}
`;

export const visualizeDepthFsSrc =

	`#version 300 es

precision highp float;

uniform sampler2D screenTexture;

layout(std140) uniform Data {
	vec4 dataVec1;
	vec4 dataVec2;
	bool value;
};

		in vec2 uvs;

out vec4 outColor;

float LinearizeDepth(float depth, float near, float far) {
	float z = depth * 2.0 - 1.0; // transform to normalized device coordinates
	return (2.0 * near * far) / (far + near - z * (far - near));
}

void main() {

	bool isPerspective = value;
	float near = dataVec1.r;
	float far = dataVec1.g;

	float depth = texture(screenTexture, uvs).r;
	if (isPerspective) {
		depth = LinearizeDepth(depth, near, far) / far;
	}
	outColor = vec4(vec3(depth), 1.0f);
}
`;

export const shadowMapVsSrc =
	`#version 300 es

layout(location = 0) in vec3 position;

layout(std140) uniform MatricesPerFrame {
	mat4 projection;
	mat4 view;
};

layout(std140) uniform PerObject {
	mat4 world;
	float displacementFactor;
	float pointLightIndex;
};

out vec4 positionW;

void main() {
	positionW = world * vec4(position, 1.0f);
	gl_Position = projection * view * positionW;
}
`;

export const shadowMapFsSrc =

	`#version 300 es

precision highp float;

layout(std140) uniform Data {
	vec4 dataVec1;
	vec4 dataVec2;
	bool value;
};

	in vec4 positionW;

void main() {

	vec3 lightPosition = dataVec1.rgb;
	float near = dataVec2.r;
	float far = dataVec2.g;

	float distance = length(positionW.xyz - lightPosition);
	gl_FragDepth = (distance - near) / (far - near);
}
`;


export const skyboxDepthFsSrc =
	`#version 300 es

precision highp float;

		in vec3 uvs;

layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 bloomColor;

layout(std140) uniform Data {
	vec4 dataVec1;
	vec4 dataVec2;
	bool value;
};

uniform samplerCube skybox;

float LinearizeDepth(float depth, float near, float far) {
	float z = depth * 2.0 - 1.0; // transform to normalized device coordinates
	return (2.0 * near * far) / (far + near - z * (far - near));
}

void main()	{

	float near = dataVec1.r;
	float far = dataVec1.g;

	float depth = texture(skybox, uvs).r;
	depth = LinearizeDepth(depth, near, far) / far;
	outColor = vec4(depth, depth, depth, 1.0f);

	bloomColor = outColor;
}
`;

export function getVisualizeNormalsShaderSource(normalMap: boolean) {

	const visualizeNormalsFsSrc =
	`#version 300 es

	precision highp float;

	in vec2 uvs;
	in vec3 positionW;
	in vec3 normalW;
	in mat3 TBN;

	${ normalMap ?
		'uniform sampler2D normalMap;' :
		''}

	layout(location = 0) out vec4 outColor;
	layout(location = 1) out vec4 bloomColor;

	void main() {

	${ normalMap ?
			'vec3 N = (2.0 * texture(normalMap, uvs.st) - 1.0).rgb;' +
			'N = normalize(TBN * N);' :
			'vec3 N = normalize(normalW);'}

		outColor = vec4(N, 1.0f);
		bloomColor = vec4(uvs.st, 1.0f, 1.0f);
	}`;

	return visualizeNormalsFsSrc;
}


export const visualizeNormalMapsTerrainFsSrc =
	`#version 300 es

	precision highp float;
	precision highp sampler2DArray;

	in vec2 uvs;
	in vec3 positionW;
	in vec3 normalW;
	in mat3 TBN;

	uniform sampler2DArray normals;
	uniform sampler2D blendMap;

	layout(std140) uniform Data {
	vec4 dataVec1;
	vec4 dataVec2;
	bool value;
};

	layout(location = 0) out vec4 outColor;
	layout(location = 1) out vec4 bloomColor;

	void main() {

			float tileScale = dataVec1.r;
			vec4 blend = texture(blendMap, uvs.st).rgba;
			vec2 tiledUvs = tileScale * uvs.st;

			vec3 N1 = (2.0 * texture(normals, vec3(tiledUvs.st, 0.0f)) - 1.0).rgb;
			N1 = normalize(TBN * N1);
			vec3 N2 = (2.0 * texture(normals, vec3(tiledUvs.st, 1.0f)) - 1.0).rgb;
			N2 = normalize(TBN * N2);
			vec3 N3 = (2.0 * texture(normals, vec3(tiledUvs.st, 2.0f)) - 1.0).rgb;
			N3 = normalize(TBN * N3);
			vec3 N4 = (2.0 * texture(normals, vec3(tiledUvs.st, 3.0f)) - 1.0).rgb;
			N4 = normalize(TBN * N4);
			vec3 N5 = (2.0 * texture(normals, vec3(tiledUvs.st, 4.0f)) - 1.0).rgb;
			N5 = normalize(TBN * N5);

			vec3 N = mix(N1, N2, blend.r);
			N = normalize(N);
			N = mix(N, N3, blend.g);
			N = normalize(N);
			N = mix(N, N4, blend.b);
			N = normalize(N);
			N = mix(N, N5, blend.a);
			N = normalize(N);

		outColor = vec4(N, 1.0f);
		bloomColor = vec4(uvs.st, 1.0f, 1.0f);
	}`;

export function GetTerrainSrc(hasNormalMap: boolean, hasRoughnessMap: boolean, hasMetallicMap: boolean, hasAoMap: boolean, hasDisplacementMap: boolean, hasEmissionMap: boolean) {

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
		uniform sampler2DArray normals;
		uniform sampler2DArray aos;
		uniform sampler2DArray roughnesses;
		uniform sampler2DArray metallics;

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

			float ao = texture(aos, vec3(tiledUvs.st, 0.0f)).r;
			float ao2 = texture(aos, vec3(tiledUvs.st, 1.0f)).r;
			float ao3 = texture(aos, vec3(tiledUvs.st, 2.0f)).r;
			float ao4 = texture(aos, vec3(tiledUvs.st, 3.0f)).r;
			float ao5 = texture(aos, vec3(tiledUvs.st, 4.0f)).r;

			ao = mix(ao, ao2, blend.r);
			ao = mix(ao, ao3, blend.g);
			ao = mix(ao, ao4, blend.b);
			ao = mix(ao, ao5, blend.a);

			float roughness = texture(roughnesses, vec3(tiledUvs.st, 0.0f)).r;
			float roughness2 = texture(roughnesses, vec3(tiledUvs.st, 1.0f)).r;
			float roughness3 = texture(roughnesses, vec3(tiledUvs.st, 2.0f)).r;
			float roughness4 = texture(roughnesses, vec3(tiledUvs.st, 3.0f)).r;
			float roughness5 = texture(roughnesses, vec3(tiledUvs.st, 4.0f)).r;

			roughness = mix(roughness, roughness2, blend.r);
			roughness = mix(roughness, roughness3, blend.g);
			roughness = mix(roughness, roughness4, blend.b);
			roughness = mix(roughness, roughness5, blend.a);

			float metallic = texture(metallics, vec3(tiledUvs.st, 0.0f)).r;
			float metallic2 = texture(metallics, vec3(tiledUvs.st, 1.0f)).r;
			float metallic3 = texture(metallics, vec3(tiledUvs.st, 2.0f)).r;
			float metallic4 = texture(metallics, vec3(tiledUvs.st, 3.0f)).r;
			float metallic5 = texture(metallics, vec3(tiledUvs.st, 4.0f)).r;

			metallic = mix(metallic, metallic2, blend.r);
			metallic = mix(metallic, metallic3, blend.g);
			metallic = mix(metallic, metallic4, blend.b);
			metallic = mix(metallic, metallic5, blend.a);

			vec3 N1 = (2.0 * texture(normals, vec3(tiledUvs.st, 0.0f)) - 1.0).rgb;
			N1 = normalize(TBN * N1);
			vec3 N2 = (2.0 * texture(normals, vec3(tiledUvs.st, 1.0f)) - 1.0).rgb;
			N2 = normalize(TBN * N2);
			vec3 N3 = (2.0 * texture(normals, vec3(tiledUvs.st, 2.0f)) - 1.0).rgb;
			N3 = normalize(TBN * N3);
			vec3 N4 = (2.0 * texture(normals, vec3(tiledUvs.st, 3.0f)) - 1.0).rgb;
			N4 = normalize(TBN * N4);
			vec3 N5 = (2.0 * texture(normals, vec3(tiledUvs.st, 4.0f)) - 1.0).rgb;
			N5 = normalize(TBN * N5);

			vec3 N = mix(N1, N2, blend.r);
			N = normalize(N);
			N = mix(N, N3, blend.g);
			N = normalize(N);
			N = mix(N, N4, blend.b);
			N = normalize(N);
			N = mix(N, N5, blend.a);
			N = normalize(N);

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

export const particleUpdateVsSrc =

	`#version 300 es

	precision highp float;

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 velocity;
layout(location = 2) in float age;
layout(location = 3) in float life;


	struct ParticleData {
		vec3 gravity;
		float deltaTime;
		vec3 origin;
		float padding;
		vec2 angleLimits;
		vec2 speedLimits;

	};

	layout(std140) uniform Particle {
		ParticleData particleData;
};

uniform sampler2D noiseTexture;

out vec3 positionW;
out vec3 velocityW;
out float currentAge;
out float currentLife;

const float PI = 3.141592653f;

void main() {

	if(age >= life) {

    	ivec2 noiseCoord = ivec2(gl_VertexID % 512, gl_VertexID / 512);
    	vec3 rand = texelFetch(noiseTexture, noiseCoord, 0).rgb;

		float minAngle = particleData.angleLimits.x;
		float maxAngle = particleData.angleLimits.y;

		float theta = minAngle + rand.r * (maxAngle - minAngle);
		float phi = rand.g * (2.0f * PI);
		float x = sin(theta) * cos(phi);
		float y = sin(theta) * sin(phi);
		float z = cos(theta);

		positionW = particleData.origin;
		currentAge = 0.0f;
		currentLife = life;
		velocityW = vec3(x, y, z) * (particleData.speedLimits.x + rand.b * (particleData.speedLimits.y - particleData.speedLimits.x));;  //vec3(5.0f, 5.0f, 5.0f) * 3.0f;

	} else {
		positionW = position + velocity * particleData.deltaTime;
		velocityW = velocity + particleData.gravity * particleData.deltaTime;
		currentAge = age + particleData.deltaTime;
		currentLife = life;
	}

}

`;

export const particleUpdateFsSrc =
	`#version 300 es

precision highp float;

void main() {}
`;

export const billboardParticleVsSrc =
	`#version 300 es

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

	// per instance
	layout(location = 0) in vec3 particlePosition;
	layout(location = 1) in vec3 velocity;
	layout(location = 2) in float age;
	layout(location = 3) in float life;

	// per vertex
	layout(location = 4) in vec3 position;
	layout(location = 5) in vec2 texCoords;
	layout(location = 6) in vec2 size;

	layout (std140) uniform MatricesPerFrame {
   		mat4 projection;
    	mat4 view;
	};

	layout(std140) uniform Lights {
		${PointLight.NUM_LIGHTS > 0 ? 'PointLight pointLights[NUM_LIGHTS]' : ''}
		DirLight dirLight;

		vec3 eyePositionW;
	};

	const vec3 worldUp = vec3(0.0f, 1.0f, 0.0f);

	out vec2 uvs;
	out float currentLife;
	out float currentAge;


	mat4 billboardWorld(vec3 eyePosition, vec3 particlePosition) {
		vec3 forward = normalize(eyePosition - particlePosition);
		vec3 right = cross(worldUp, forward);
		vec3 up = cross(forward, right);
		return mat4(vec4(right, 0.0f), vec4(up, 0.0f), vec4(forward, 0.0f), vec4(particlePosition, 1.0f));
	}

	mat4 billboard(mat4 view, vec3 particlePosition) {
		mat3 invView = transpose(mat3(view));
		return mat4(
			vec4(invView[0], 0.0f),
			vec4(invView[1], 0.0f),
			vec4(invView[2], 0.0f),
			vec4(particlePosition, 1.0f)
			);

	}

	mat3 scale(vec2 particleSize) {
		return mat3(vec3(particleSize.x, 0.0f, 0.0f),
					vec3(0.0f, particleSize.y, 0.0f),
					vec3(0.0f, 0.0f, 1.0f));

	}

	void main() {
		mat4 world = billboardWorld(eyePositionW, particlePosition);
		mat4 billboardMatrix = billboard(view, particlePosition);
		gl_Position = projection * view * billboardMatrix * vec4(scale(size) * position, 1.0f);
		uvs = texCoords;
		currentAge = age;
		currentLife = life;
	}
`;

export const billboardParticleFsSrc =
	`#version 300 es

precision highp float;

in vec2 uvs;
in float currentLife;
in float currentAge;

layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 bloomColor;

uniform sampler2D particleTexture;

void main() {
	outColor = vec4(texture(particleTexture, uvs.st).rgb, 1.0f - (currentAge / currentLife));
	float luma = dot(outColor.rgb, vec3(0.2126f, 0.7152f, 0.0722f));
	if (luma > 1.0f) {
		bloomColor = vec4(outColor.rgb, 1.0);
	} else {
		bloomColor = vec4(0.0, 0.0, 0.0, 1.0);
	}
}

`;

export const overlayVsSrc = 
`#version 300 es

precision highp float;

layout(location = 0) in vec2 position;
layout(location = 1) in vec2 textureCoords;
layout(location = 2) in vec4 colorAlpha;
layout(location = 3) in vec4 transformColumn1;
layout(location = 4) in vec4 transformColumn2;
layout(location = 5) in vec4 transformColumn3;

layout(std140) uniform OverlayMatrices {
	mat4 ortho;
	mat4 view;
};

out vec2 uvs;
out vec4 color;

mat3 generateModelMatrix(vec4 col1, vec4 col2, vec4 col3) {
	return mat3(
		vec3(col1),
		vec3(col2),
		vec3(col3)
	);
}

void main() {
	uvs = textureCoords;
	color = colorAlpha;
	mat3 model = generateModelMatrix(transformColumn1, transformColumn2,transformColumn3);
	gl_Position = ortho * view * vec4((model * vec3(position.xy, 1.0f)).xy, 0.0f, 1.0f);
}
`;

export const overlayFsSrc = 
`#version 300 es

precision highp float;

uniform sampler2D atlasTexture;

in vec2 uvs;
in vec4 color;

out vec4 outColor;

void main() {
	vec4 imageColor = texture(atlasTexture, uvs.st).rgba;
	outColor = vec4(imageColor.rgb * color.rgb, imageColor.a * color.a);
}
`;