import { commonPbrSource }  from './pbr-common';
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
			${PointLight.NUM_LIGHTS > 0 ? 'PointLight pointLights[NUM_LIGHTS];' : ''}
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

		${ commonPbrSource }

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
`;

	return { vsSrc, fsSrc };

}

