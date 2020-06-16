import { SceneNode } from './scenenode';
import { SceneGraph } from './scenegraph';
import { DirectionalLight } from './directionallight';
import { PointLight } from './pointlight';
import * as texture from './texturemanager';
import { Renderer } from './glrenderer';
import { Skybox } from './skybox';
import { TextureData } from './texturemanager';
import { Mesh } from './mesh';
import { MeshFile, loadMesh } from './meshmanager';
import { MaterialFile, loadMaterial } from './material';
import { vec3 } from 'gl-matrix';
import { Layer } from './batchrenderer';
import { MeshComponent } from './meshcomponent';
import { Terrain } from './terrain';
import * as resource from './resource';

export interface SceneFile {
	data: SceneData;
}

export interface SceneData {
	skybox: string;
	textures: TextureData[];
	objects: SceneNodeData[];
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
	children: SceneNodeData[];
	meshPath: string;
	pointLight?: {
		localPosition: {
			x: number;
			y: number;
			z: number;
		};
		color: {
			r: number;
			g: number;
			b: number;
		};
		near: number;
		radius: number;
		intensity: number;
	};
}


export abstract class Scene {

	constructor(name: string) {
		this.name = name;
		this.sceneGraph = new SceneGraph();

		this.pointLights = [];

		this.terrain = new Terrain();
	}

	async initScene(renderer: Renderer, path: string) {
		this.path = path;
		const sceneFile = await resource.loadFile<SceneFile>(path);
		renderer.skybox = new Skybox(renderer.gl, sceneFile.data.skybox);
		const skyboxPromise = renderer.skybox.loadSkyboxCubeMapImages(renderer.gl, renderer.skybox.path);

		const meshPaths: string[] = [];

		for (let object of sceneFile.data.objects) {
			this.iterateSceneNodes(object, node => {
				if (meshPaths.indexOf(node.meshPath) < 0) {
					meshPaths.push(node.meshPath);
				}
			});
		}

		const meshFilePromises: Promise<MeshFile>[] = [];
		for (let meshPath of meshPaths) {
			meshFilePromises.push(resource.loadFile<MeshFile>(meshPath));
		}

		await Promise.all(meshFilePromises);

		const meshFiles: MeshFile[] = [];
		const materials: string[] = [];
		const materialPromises: Promise<MaterialFile>[] = [];

		for (let meshPath of meshPaths) {
			const meshFile = resource.get<MeshFile>(meshPath);
			meshFiles.push(meshFile);

			if (materials.indexOf(meshFile.mesh.material)) {
				materials.push(meshFile.mesh.material);
				materialPromises.push(resource.loadFile<MaterialFile>(meshFile.mesh.material));
			}
		}

		await Promise.all(materialPromises);

		const textureDatas: TextureData[] = [];
		for (let materialPath of materials) {
			const materialFile: MaterialFile = resource.get<MaterialFile>(materialPath);
			for (let texture of materialFile.material.textures) {
				textureDatas.push(texture);
			}
		}

		await texture.LoadTextures(renderer.gl, textureDatas);

		for (let materialPath of materials) {
			loadMaterial(materialPath);
		}

		const pathToMesh: { [name: string]: Mesh } = {};

		for (let meshPath of meshPaths) {
			pathToMesh[meshPath] = loadMesh(renderer.gl, meshPath);
		}

		for (let object of sceneFile.data.objects) {
			const node = this.sceneNodeFromData(renderer.gl, object, pathToMesh, null);
			this.recurseChildren(renderer.gl, object, node, pathToMesh);
			this.addObject(node);
		}

		await this.terrain.load(renderer);
		
	}

	addObject(node: SceneNode) {
		this.sceneGraph.root.addChild(node);
	}

	update(dt: number) {
		this.sceneGraph.updateGraph(dt);
	}

	iterateSceneNodes(node: SceneNodeData, callback: (meshPath: SceneNodeData) => void) {
		if (callback) {
			callback(node);
		}

		for (let child of node.children) {
			this.iterateSceneNodes(child, callback);
		}
	}

	recurseChildren(gl: WebGL2RenderingContext, object: SceneNodeData, sceneNode: SceneNode, pathToMesh: { [name: string]: Mesh }) {
		if (object.children) {
			for (let child of object.children) {
				const node = this.sceneNodeFromData(gl, child, pathToMesh, sceneNode);
				this.recurseChildren(gl, child, node, pathToMesh);
			}
		}
	}

	private sceneNodeFromData(gl: WebGL2RenderingContext, object: SceneNodeData, pathToMesh: { [name: string]: Mesh }, parent?: SceneNode) {

		const node = new SceneNode(object.name, this);
		node.addMesh(Object.create(pathToMesh[object.meshPath]), Layer.OPAQUE);
		node.transform.setPosition(object.position.x, object.position.y, object.position.z);
		node.transform.setRotation(object.rotation.x, object.rotation.y, object.rotation.z);

		if (parent) {
			parent.addChild(node);
		}

		if (object.pointLight) {
			node.pointLight = new PointLight(gl, vec3.fromValues(object.pointLight.localPosition.x,
				object.pointLight.localPosition.y, object.pointLight.localPosition.z),
				vec3.fromValues(object.pointLight.color.r, object.pointLight.color.g, object.pointLight.color.b)
				, object.pointLight.intensity, object.pointLight.radius);

			const pointLightIndex = this.pointLights.length;
			(node.getComponent('meshComponent') as MeshComponent).mesh.pointLightIndex = pointLightIndex;
			this.pointLights.push(node.pointLight);
		}

		return node;
	}

	name: string;
	path: string;
	sceneGraph: SceneGraph;

	dirLight?: DirectionalLight;
	pointLights?: PointLight[];

	terrain: Terrain;

	modifySphere: SceneNode;
}
