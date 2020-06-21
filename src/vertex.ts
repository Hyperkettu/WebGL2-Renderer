import { vec3, vec4, vec2 } from 'gl-matrix';
import { verify } from 'crypto';

export type PositionVertexType = Vertex | ScreenVertex | PositionVertex;
export type NormalVertexType = Vertex;
export type TexVertexType = Vertex | ScreenVertex;
export type TangentVertexType = Vertex;
export type GeneralVertexType = PositionVertexType & NormalVertexType & TexVertexType & TangentVertexType;

export class VertexBase {
	constructor() {}
}

export class Vertex extends VertexBase {

	constructor() {
		super();
	}

	position: vec3;
	normal: vec3;
	textureCoords: vec2;
	tangent: vec3;
}

export class MorphVertex extends VertexBase {
	constructor() {
		super();
	}
	positionWeight: vec4;
	position2Weight: vec4;
}

export class ScreenVertex {
	constructor() { }

	position: vec3;
	textureCoords: vec2;
}

export class PositionVertex {
	constructor() { }

	position: vec3;
}

export class ParticleVertex {
	constructor() { }

	position: vec3;
	velocity: vec3;
	age: number;
	life: number;
}

export class RenderParticleVertex {
	constructor() { }

	position: vec3;
	texCoords: vec2;
	size: vec2;
}

export function toFloat32Array<VertexType>(vertices: VertexType[]) {
	const array: number[] = [];

		const verts = (vertices as unknown) as Vertex[];

		for (let index = 0; index < verts.length; index++) {
			array.push(verts[index].position[0]);
			array.push(verts[index].position[1]);
			array.push(verts[index].position[2]);

			array.push(verts[index].normal[0]);
			array.push(verts[index].normal[1]);
			array.push(verts[index].normal[2]);

			array.push(verts[index].textureCoords[0]);
			array.push(verts[index].textureCoords[1]);

			array.push(verts[index].tangent[0]);
			array.push(verts[index].tangent[1]);
			array.push(verts[index].tangent[2]);
		}
	if(vertices instanceof MorphVertex) {
		/*const verts = (vertices as unknown) as MorphVertex[];
		for (let index = 0; index < verts.length; index++) {
			array.push(verts[index].position[0]);
			array.push(verts[index].position[1]);
			array.push(verts[index].position[2]);

			array.push(verts[index].normal[0]);
			array.push(verts[index].normal[1]);
			array.push(verts[index].normal[2]);

			array.push(verts[index].textureCoords[0]);
			array.push(verts[index].textureCoords[1]);

			array.push(verts[index].tangent[0]);
			array.push(verts[index].tangent[1]);
			array.push(verts[index].tangent[2]);*
		}*/
	}

	return new Float32Array(array);
}

export function screenVertexToFloat32Array(vertices: ScreenVertex[]) {
	const array: number[] = [];

	for (let index = 0; index < vertices.length; index++) {
		array.push(vertices[index].position[0]);
		array.push(vertices[index].position[1]);
		array.push(vertices[index].position[2]);

		array.push(vertices[index].textureCoords[0]);
		array.push(vertices[index].textureCoords[1]);
	}

	return new Float32Array(array);
}

export function positionVertexToFloat32Array(vertices: PositionVertex[]) {
	const array: number[] = [];

	for (let index = 0; index < vertices.length; index++) {
		array.push(vertices[index].position[0]);
		array.push(vertices[index].position[1]);
		array.push(vertices[index].position[2]);
	}

	return new Float32Array(array);
}

export function particleVertexToFloat32Array(vertices: ParticleVertex[]) {
	const array: number[] = [];

	for (let index = 0; index < vertices.length; index++) {
		array.push(vertices[index].position[0]);
		array.push(vertices[index].position[1]);
		array.push(vertices[index].position[2]);

		array.push(vertices[index].velocity[0]);
		array.push(vertices[index].velocity[1]);
		array.push(vertices[index].velocity[2]);

		array.push(vertices[index].age);
		array.push(vertices[index].life);
	}

	return new Float32Array(array);
}

export function renderParticleToFloat32Array(vertices: RenderParticleVertex[]) {
	const array: number[] = [];

	for (let index = 0; index < vertices.length; index++) {
		array.push(vertices[index].position[0]);
		array.push(vertices[index].position[1]);
		array.push(vertices[index].position[2]);

		array.push(vertices[index].texCoords[0]);
		array.push(vertices[index].texCoords[1]);

		array.push(vertices[index].size[0]);
		array.push(vertices[index].size[1]);

	}

	return new Float32Array(array);
}