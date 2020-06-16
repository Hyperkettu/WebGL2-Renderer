import { Mesh } from './mesh';
import { vec3, vec2 } from 'gl-matrix';
import { Vertex, ScreenVertex } from './vertex';
import * as texture from './texturemanager';
import { VertexArrayObject } from './vertexarrayobject';
import { MaterialData, MaterialFile } from './material';
import { GeometryGenerator } from './geometrygenerator';
import * as resource from './resource';

let meshes: { [id: string]: Mesh } = {};

export function GetMesh(id: string) {
	return meshes[id];
}

export function SetMesh(id: string, mesh: Mesh) {
	meshes[id] = mesh;
}

export interface MeshFile {
	mesh: MeshData;
}
export interface MeshData {
	type: 'buffer' | 'sphere' | 'plane' | 'cube';
	name: string;
	data: Data;
	material: string;
}

export interface Data {
}

export interface SphereData extends Data {
	radius: number;
	numStacks: number;
	numSectors: number;
}

export interface PlaneData extends Data {
	width: number;
	height: number;
}

export interface CubeData extends Data {
	width: number;
	height: number;
	depth: number;
}

function getMeshData(gl: WebGL2RenderingContext, meshData: MeshData) {
	switch (meshData.type) {
		case 'sphere':
			const sphereData = meshData.data as SphereData;
			GeometryGenerator.GenerateSphere(gl, meshData.name, sphereData.radius, sphereData.numStacks, sphereData.numSectors);
			break;
		case 'plane':
			const planeData = meshData.data as PlaneData;
			GeometryGenerator.GeneratePlane(gl, meshData.name, planeData.width, planeData.height);
			break;
		case 'cube':
			const cubeData = meshData.data as CubeData;
			GeometryGenerator.GenerateCube(gl, meshData.name, cubeData.width, cubeData.height, cubeData.depth);
			break;
	}
	return meshes[meshData.name];
}

export function loadMesh(gl: WebGL2RenderingContext, path: string) {
	const file: MeshFile = resource.get<MeshFile>(path);
	const mesh = getMeshData(gl, file.mesh);
	const materialId = resource.get<MaterialFile>(file.mesh.material).material.name;
	mesh.materialID = materialId;
	return mesh;
}

export async function LoadMeshes(gl: WebGL2RenderingContext) {
	//await GeometryGenerator.GenerateTerrain(gl, 'terrain', 10.0, 0.25, 3.5, 0.0, 'images/height-map10.png');
}

export function GenerateScreenQuadVertices() {

	const vertices: ScreenVertex[] = [];

	let vertex = new ScreenVertex();
	vertex.position = vec3.fromValues(-1.0, 1.0, 0);
	vertex.textureCoords = vec2.fromValues(0, 1);
	vertices.push(vertex);

	vertex = new ScreenVertex();
	vertex.position = vec3.fromValues(-1.0, -1.0, 0);
	vertex.textureCoords = vec2.fromValues(0, 0);
	vertices.push(vertex);

	vertex = new ScreenVertex();
	vertex.position = vec3.fromValues(1.0, 1.0, 0);
	vertex.textureCoords = vec2.fromValues(1, 1);
	vertices.push(vertex);

	vertex = new ScreenVertex();
	vertex.position = vec3.fromValues(1.0, -1.0, 0);
	vertex.textureCoords = vec2.fromValues(1, 0);
	vertices.push(vertex);

	return vertices;
}

export function GenerateUnitCubeVertices() {

	const skyboxVertices: number[] = [

		- 1, 1, -1,
		-1, -1, -1,
		1, -1, -1,
		1, -1, -1,
		1, 1, -1,
		-1, 1, -1,

		-1, -1, 1,
		-1, -1, -1,
		-1, 1, -1,
		-1, 1, -1,
		-1, 1, 1,
		-1, -1, 1,

		1, -1, -1,
		1, -1, 1,
		1, 1, 1,
		1, 1, 1,
		1, 1, -1,
		1, -1, -1,

		-1, -1, 1,
		-1, 1, 1,
		1, 1, 1,
		1, 1, 1,
		1, -1, 1,
		-1, -1, 1,

		-1, 1, -1,
		1, 1, -1,
		1, 1, 1,
		1, 1, 1,
		-1, 1, 1,
		-1, 1, -1,

		-1, -1, -1,
		-1, -1, 1,
		1, -1, -1,
		1, -1, -1,
		-1, -1, 1,
		1, -1, 1
	];
	return new Float32Array(skyboxVertices);
}