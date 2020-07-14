
export const prefix = 'visualizeNormalsFS';

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
