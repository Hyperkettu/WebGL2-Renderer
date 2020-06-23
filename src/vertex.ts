import { vec3, vec4, vec2, mat3 } from 'gl-matrix';
import { verify } from 'crypto';
import { VertexDataType } from './vertexbuffer';

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
	position1: vec3;
	position2: vec3;
	normal1: vec3;
	normal2: vec3;
	textureCoords: vec2;
	tangent1: vec3;
	tangent2: vec3;
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

export class SpriteVertex extends VertexBase {
	constructor() {
		super();
	}

	position: vec2;
	textureCoord: vec2;
	tintColorAlpha: vec4;
	transformColumn1: vec4;
	transformColumn2: vec4;
	transformColumn3: vec4;
}

export function morphVertexToFloat32Array(vertices: MorphVertex[]) {
	const array: number[] = [];

	for (let index = 0; index < vertices.length; index++) {
		array.push(vertices[index].position1[0]);
		array.push(vertices[index].position1[1]);
		array.push(vertices[index].position1[2]);

		array.push(vertices[index].position2[0]);
		array.push(vertices[index].position2[1]);
		array.push(vertices[index].position2[2]);

		array.push(vertices[index].normal1[0]);
		array.push(vertices[index].normal1[1]);
		array.push(vertices[index].normal1[2]);

		array.push(vertices[index].normal2[0]);
		array.push(vertices[index].normal2[1]);
		array.push(vertices[index].normal2[2]);

		array.push(vertices[index].textureCoords[0]);
		array.push(vertices[index].textureCoords[1]);

		array.push(vertices[index].tangent1[0]);
		array.push(vertices[index].tangent1[1]);
		array.push(vertices[index].tangent1[2]);

		array.push(vertices[index].tangent2[0]);
		array.push(vertices[index].tangent2[1]);
		array.push(vertices[index].tangent2[2]);

	}

	return new Float32Array(array);
}

export function toFloat32Array<VertexType>(vertices: VertexType[], type: VertexDataType) {
	let array: number[] = [];

	if(type === VertexDataType.VERTEX) {
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