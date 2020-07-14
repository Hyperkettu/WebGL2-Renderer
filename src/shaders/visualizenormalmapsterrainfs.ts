
export const prefix = 'visualizeTerrainNormalMapsFS';

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

