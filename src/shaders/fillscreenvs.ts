
export const prefix = 'fillScreenVS';

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

