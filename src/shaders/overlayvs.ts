
export const prefix = 'overlayVS';

export const overlayVsSrc = 
`#version 300 es

precision highp float;

layout(location = 0) in vec2 position;
layout(location = 1) in vec3 textureCoords;
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
out float hasMask;

mat3 generateModelMatrix(vec4 col1, vec4 col2, vec4 col3) {
	return mat3(
		vec3(col1),
		vec3(col2),
		vec3(col3)
	);
}

void main() {
	uvs = textureCoords.st;
	hasMask = textureCoords.p;
	color = colorAlpha;
	mat3 model = generateModelMatrix(transformColumn1, transformColumn2, transformColumn3);
	gl_Position = ortho * view * vec4((model * vec3(position.xy, 1.0f)).xy, 0.0f, 1.0f);
}
`;