import { Mesh, StaticMesh, MorphedMesh } from './mesh';
import { vec3, vec2 } from 'gl-matrix';
import { Vertex, ScreenVertex, VertexBase, MorphVertex } from './vertex';
import { GeometryGenerator } from './geometrygenerator';
import * as resource from './resource';
import { SceneNode } from './scenenode';
import { Layer } from './batchrenderer';
import * as instanceBuffer from './instancebuffer';
import { Submesh } from './submesh';
import { MeshComponent } from './meshcomponent';
import { GetMaterial } from './material';

let meshes: { [id: string]: Mesh<VertexBase> } = {};

export function GetMesh<MeshType>(id: string) {
	return (meshes[id] as unknown) as MeshType;
}

export function SetMesh(id: string, mesh: Mesh<VertexBase>) {
	meshes[id] = mesh;
}

export interface MeshFile {
	mesh: MeshData;
}
export interface MeshData {
	type: 'static' | 'morphed' | 'skinned' | 'sphere' | 'plane' | 'cube';
	name: string;
	instanceBufferName?: string;
	data: Data;
	materials?: string[];
}

export interface Data {
}

export interface SphereData extends Data {
	radius: number;
	numStacks: number;
	numSectors: number;
	material: string;
}

export interface PlaneData extends Data {
	width: number;
	height: number;
	material: string;
}

export interface CubeData extends Data {
	width: number;
	height: number;
	depth: number;
	material: string;
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
	vertices: VertexBase[];
	vertices2?: VertexBase[];
	indices: number [];
	material: string;
}

function getMeshData(gl: WebGL2RenderingContext, meshData: MeshData, parent: SceneNode) {
	switch (meshData.type) {
		case 'sphere':
			const sphereData = meshData.data as SphereData; 
			if(!meshes[meshData.name]) {
				GeometryGenerator.GenerateSphere(gl, meshData.name, sphereData.radius, sphereData.numStacks, sphereData.numSectors);
			}
			meshes[meshData.name].getSubmesh('sphere').materialID = (meshData.data as SphereData).material;
			parent.addMesh(Object.create(meshes[meshData.name].getSubmesh('sphere')), Layer.OPAQUE); // take a copy of submesh
			break;
		case 'plane':
			const planeData = meshData.data as PlaneData;
			if(!meshes[meshData.name]) {
				GeometryGenerator.GeneratePlane(gl, meshData.name, planeData.width, planeData.height);
			}
			meshes[meshData.name].getSubmesh('plane').materialID = planeData.material;
			parent.addMesh(Object.create(meshes[meshData.name].getSubmesh('plane')), Layer.OPAQUE);
			break;
		case 'cube':
			const cubeData = meshData.data as CubeData;
			if(!meshes[meshData.name]) {
				GeometryGenerator.GenerateCube(gl, meshData.name, cubeData.width, cubeData.height, cubeData.depth);
			}
			meshes[meshData.name].getSubmesh('cube').materialID = cubeData.material;
			parent.addMesh(Object.create(meshes[meshData.name].getSubmesh('cube')), Layer.OPAQUE);
			break;
		case 'static': 
		case 'morphed':
			return loadFromMeshFile(gl, meshData, parent);

			
	}
	return meshes[meshData.name];
}

export function loadMesh(gl: WebGL2RenderingContext, path: string, parent: SceneNode) {
	const file: MeshFile = resource.get<MeshFile>(path);
	const mesh: Mesh<VertexBase> = getMeshData(gl, file.mesh, parent);
	if(file.mesh.instanceBufferName && mesh instanceof StaticMesh) {
		let buffer = instanceBuffer.getInstanceBuffer(file.mesh.instanceBufferName, Layer.OPAQUE);
		if(!buffer) {
			buffer = new instanceBuffer.InstanceBuffer(mesh, file.mesh.instanceBufferName, Layer.OPAQUE);
		}

		buffer.addInstance();
		mesh.getSubmeshes()[0].addToInstanceBuffer(file.mesh.instanceBufferName);

	}
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
	let mesh: Mesh<VertexBase>; 

	let createNew = false;
	mesh = GetMesh(file.name);

	if(file.type === 'static') {
		if(!mesh) {
			createNew = true;
			mesh = new StaticMesh(file.name);
		}
		
	} else if(file.type === 'morphed') {
		if(!mesh) {
			createNew = true;
			mesh = new MorphedMesh(file.name, 2);
		}
	}

	for(let child of data.children) {
		recurseSubmeshes(gl, mesh, child, parent, createNew, file.instanceBufferName);
	}

	SetMesh(file.name, mesh);
	return mesh;
}

function handleMorphVertices(vertices: VertexBase[], vertices2: VertexBase[]) {
	const morphVertices: MorphVertex[] = []
	for(let index = 0; index < vertices.length; index++) {
		const vertex = vertices[index] as Vertex;
		const vertex2 = vertices2[index] as Vertex;
		const vert = new MorphVertex();
		vert.position1 = vertex.position;
		vert.position2 = vertex2.position;
		vert.normal1 = vertex.normal;
		vert.normal2 = vertex2.normal;
		vert.textureCoords = vertex.textureCoords;
		vert.tangent1 = vertex.tangent;
		vert.tangent2 = vertex2.tangent;
		morphVertices.push(vert);
	}
	return morphVertices;
}

function recurseSubmeshes(gl: WebGL2RenderingContext, mesh: Mesh<VertexBase>, node: SceneNodeData, parent: SceneNode, createNew: boolean, instanceBufferName?: string) {

	let vertices = node.vertexData.vertices;

	if(node.vertexData.vertices2) {
		vertices = handleMorphVertices(node.vertexData.vertices, node.vertexData.vertices2);
	}
	if(createNew) {
		mesh.createSubmesh(gl, node.name, vertices, node.vertexData.indices, node.vertexData?.material);
	}

	if(instanceBufferName) {
		const submesh = mesh.getSubmesh(node.name);

		if(submesh === mesh.getSubmeshes()[0]) {
			const sceneNode = new SceneNode(node.name, parent.scene, parent);
			sceneNode.transform.setPosition(node.position.x, node.position.y, node.position.y);
			sceneNode.transform.setRotation(node.rotation.x, node.rotation.y, node.rotation.z);
		
			sceneNode.addMesh(Object.create(submesh), Layer.OPAQUE); // take a copy of submesh
			parent.addChild(sceneNode);
		}
		return;
	}
	const submesh = mesh.getSubmesh(node.name);
	const sceneNode = new SceneNode(node.name, parent.scene, parent);
	sceneNode.transform.setPosition(node.position.x, node.position.y, node.position.y);
	sceneNode.transform.setRotation(node.rotation.x, node.rotation.y, node.rotation.z);
	
	sceneNode.addMesh(Object.create(submesh), Layer.OPAQUE); // take a copy of submesh
	
	
	parent.addChild(sceneNode);

	for(let child of node.children){
		recurseSubmeshes(gl, mesh, child, sceneNode, createNew);
	}
}

export function toMeshDataFile(mesh: Mesh<VertexBase>, nodeName: string, meshName: string, submeshName: string, materialFile: string, materialId: string) {
	let vertexData: VertexData = {
		material: materialId,
		vertices: [],
		indices: []
	};

	const submesh = mesh.getSubmesh(submeshName);
	vertexData.material = submesh.materialID;
	vertexData.vertices = submesh.vertices;
	vertexData.indices = submesh.indices;

	const sceneNodeData: SceneNodeData = {
		children: [],
		name: nodeName,
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
			name: meshName,
			materials: [
				materialFile
			],
			type: 'static',
			data: meshData
			
		}
	};
	console.log(JSON.stringify(data));
}

export function toMeshDataFileMultiSubmesh(mesh: Mesh<VertexBase>, instanceBufferName?: string) {

	const children: SceneNodeData[] = [];
	const materials: string[] = [];

	for(let submesh of mesh.getSubmeshes()) {

		let vertexData: VertexData = {
			material: '',
			vertices: [],
			indices: []
		};

		vertexData.material = submesh.materialID;
		vertexData.vertices = submesh.vertices;
		vertexData.indices = submesh.indices;

		materials.push(GetMaterial(submesh.materialID).path);

		const sceneNodeData: SceneNodeData = {
			children: [],
			name: submesh.submeshName,
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
		children.push(sceneNodeData);
	}	

	let meshData: MeshFileData = {
		children
	}; 

	const data: MeshFile = {
		mesh: {
			name: mesh.name,
			materials,
			type: mesh instanceof StaticMesh ? 'static' : 'morphed',
			data: meshData,
			instanceBufferName
			
		}
	};
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