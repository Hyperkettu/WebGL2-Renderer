import { Mesh } from './mesh';
import { vec3, vec2 } from 'gl-matrix';
import { Vertex, ScreenVertex } from './vertex';
import * as texture from './texturemanager';
import { VertexArrayObject } from './vertexarrayobject';
import { MaterialData, MaterialFile } from './material';
import { GeometryGenerator } from './geometrygenerator';
import * as resource from './resource';
import { chdir } from 'process';
import { SceneNode } from './scenenode';
import { MeshComponent } from './meshcomponent';
import { Layer } from './batchrenderer';

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
	materials?: string[];
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

export interface MeshFileData extends Data {
	children: SceneNodeData[];
}

export interface SceneNodeData {
	name: string;
	position: {
		x: number;
		y: number;
		z: number;
	};
	rotation: {
		x: number;
		y: number;
		z: number;
	};
	scale?: {
		x: number;
		y: number; 
		z: number;
	}
	children: SceneNodeData[];
	vertexData?: VertexData;

}

export interface VertexData {
	vertices: Vertex[];
	indices: number [];
	material: string;
}

function getMeshData(gl: WebGL2RenderingContext, meshData: MeshData, parent: SceneNode) {
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
		case 'buffer': 
			return loadFromMeshFile(gl, meshData, parent);
			
	}
	return meshes[meshData.name];
}

export function loadMesh(gl: WebGL2RenderingContext, path: string, parent: SceneNode) {
	const file: MeshFile = resource.get<MeshFile>(path);
	const mesh = getMeshData(gl, file.mesh, parent);
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

export function loadFromMeshFile(gl: WebGL2RenderingContext, file: MeshData, parent: SceneNode) {
	const data = file.data as MeshFileData;
	const mesh = new Mesh(file.name);
	//mesh.materialID = data.vertexData.material;

	for(let child of data.children) {
		recurseSubmeshes(gl, mesh, child, parent);
	}

	SetMesh(file.name, mesh);
	return mesh;
}

function recurseSubmeshes(gl: WebGL2RenderingContext, mesh: Mesh, node: SceneNodeData, parent: SceneNode) {
	
	mesh.createSubmesh(gl, node.name, node.vertexData.vertices, node.vertexData.indices, node.vertexData?.material);
	const submesh = mesh.getSubmesh(node.name);

	const sceneNode = new SceneNode(node.name, parent.scene, parent);
	sceneNode.transform.setPosition(node.position.x, node.position.y, node.position.y);
	sceneNode.transform.setRotation(node.rotation.x, node.rotation.y, node.rotation.z);
	sceneNode.addMesh(Object.create(submesh), Layer.OPAQUE); // take a copy of submesh
	parent.addChild(sceneNode);

	for(let child of node.children){
		recurseSubmeshes(gl, mesh, child, sceneNode);
	}
}

export function toMeshDataFile(mesh: Mesh) {
	let vertexData: VertexData = {
		material: 'bark1-with-displacement',
		vertices: [],
		indices: []
	};

	const submesh = mesh.getSubmesh('terrain');
	vertexData.material = submesh.materialID;
	vertexData.vertices = submesh.vertices;
	vertexData.indices = submesh.indices;

	const sceneNodeData: SceneNodeData = {
		children: [],
		name: 'terrain',
		position: {
			x: 0,
			y: 0,
			z: 0
		},
		rotation: {
			x: 0,
			y: 0,
			z: 0
		},
		vertexData
	};

	let meshData: MeshFileData = {
		children: [
			sceneNodeData
		]
	}; 

	const data: MeshFile = {
		mesh: {
			name: 'testi',
			materials: [
				'materials/bark1.mat.json'
			],
			type: 'buffer',
			data: meshData
			
		}
	};
	JSON.stringify(data);
	console.log(JSON.stringify(data));
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