import { commonPbrSource } from './pbr-common';
import { PointLight } from '../pointlight';

export const prefixVS = 'pbrMorphedVS';
export const prefixFS = 'pbrMorphedFS';

export function getPbrSrc(hasNormalMap: boolean, hasRoughnessMap: boolean, hasMetallicMap: boolean, hasAoMap: boolean, hasDisplacementMap: boolean, hasEmissionMap: boolean) {
	
let vsSrc = 

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
	mat4 lightSpaceMatrix;
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
out vec4 dirLightSpacePositionW;
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

	dirLightSpacePositionW = lightSpaceMatrix * vec4(positionW, 1.0f);

    gl_Position = projection * view * vec4(positionW, 1.0f);
}
`;

const fsSrc =

		`#version 300 es

		precision highp float;

		${PointLight.NUM_LIGHTS > 0 ? `#define NUM_LIGHTS ${ PointLight.NUM_LIGHTS} `: ''}

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

		uniform sampler2D dirLightShadowMap;

		uniform sampler2D brdfLUT;
		uniform samplerCube irradianceMap;
		uniform samplerCube prefilterMap;

		${ 1 <= PointLight.NUM_LIGHTS ? `uniform samplerCube pointLightShadowMap${1};` : ''}
		${ 2 <= PointLight.NUM_LIGHTS ? `uniform samplerCube pointLightShadowMap${2};` : ''}
		${ 3 <= PointLight.NUM_LIGHTS ? `uniform samplerCube pointLightShadowMap${3};` : ''}
		${ 4 <= PointLight.NUM_LIGHTS ? `uniform samplerCube pointLightShadowMap${4};` : ''}
		${ 5 <= PointLight.NUM_LIGHTS ? `uniform samplerCube pointLightShadowMap${5};` : ''}

		layout(std140) uniform Lights {
			${PointLight.NUM_LIGHTS > 0 ? 'PointLight pointLights[NUM_LIGHTS];' : ''}
			DirLight dirLight;

			vec3 eyePositionW;
		};

		layout (std140) uniform PerObject {
			highp mat4 world;
			highp float displacementFactor;
			highp float pointLightIndex;
		};

		in vec2 uvs;
		in vec4 dirLightSpacePositionW;

		in vec3 positionW;
		in vec3 normalW;
		in mat3 TBN;

		layout(location = 0) out vec4 outColor;
		layout(location = 1) out vec4 bloomColor;


		const float PI = 3.14159265359f;

		${commonPbrSource}

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
`;

	return { vsSrc, fsSrc };

}