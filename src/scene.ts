import { SceneNode } from './scenenode';
import { SceneGraph } from './scenegraph';
import { DirectionalLight } from './directionallight';
import { PointLight } from './pointlight';
import * as texture from './texturemanager';
import { Renderer } from './glrenderer';
import { Skybox } from './skybox';
import { TextureData } from './texturemanager';
import { Mesh, StaticMesh } from './mesh';
import { MeshFile, loadMesh, loadFromMeshFile, MeshFileData } from './meshmanager';
import { MaterialFile, loadMaterial, materials, Material } from './material';
import { vec3, mat4 } from 'gl-matrix';
import { Layer } from './batchrenderer';
import { MeshComponent } from './meshcomponent';
import { Terrain } from './terrain';
import * as resource from './resource';
import { VertexBase, Vertex } from './vertex';
import * as instanceBuffer from './instancebuffer';

export interface SceneFile {
	data: SceneData;
}

export interface SceneData {
	skybox: string;
	textures: TextureData[];
	objects: SceneNodeData[];
	instanceDatas?: InstanceBufferData[];
}

export interface InstanceBufferData {
	instanceBufferName: string;
	meshPath: string;
	matrices: mat4[];
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

	constructor(name: string, renderer: Renderer) {
		this.name = name;
		this.renderer = renderer;
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

			for(let materialFile of meshFile.mesh.materials) {
				if (materials.indexOf(materialFile)) {
					materials.push(materialFile);
					materialPromises.push(resource.loadFile<MaterialFile>(materialFile));
				}
			}
		}

		await Promise.all(materialPromises);

		const materialFiles: MaterialFile[] = [];

		const textureDatas: TextureData[] = [];
		for (let materialPath of materials) {
			const materialFile: MaterialFile = resource.get<MaterialFile>(materialPath);
			materialFiles.push(materialFile);
			for (let texture of materialFile.material.textures) {
				textureDatas.push(texture);
			}

			if(materialFile.material.customTextures) {
				for(let texture of materialFile.material.customTextures) {
					textureDatas.push({ path: texture.path, type: 'custom' })
				}
			}

		}

		await texture.LoadTextures(renderer.gl, textureDatas);

		for(let materialFile of materialFiles) {
			if(materialFile.material.customTextures) {
				for(let customTexture of materialFile.material.customTextures) {
					const tex = texture.GetTexture(customTexture.path);
					tex.name = customTexture.name;
				}
			}
		}

		for (let materialPath of materials) {
			loadMaterial(materialPath);
		}

		for (let object of sceneFile.data.objects) {
			const node = this.sceneNodeFromData(renderer.gl, object, null);
			this.recurseChildren(renderer.gl, object, node);
			this.addObject(node);
		}

		// TO SEE TERRAIN UNCOMMENT THIS
		//await this.terrain.load(renderer);
		
		for(let buffer of instanceBuffer.getInstanceBuffers(Layer.OPAQUE)) {
			if(!buffer.isStatic) {
				buffer.create(renderer.gl);
			}
		}

		for(let buffer of instanceBuffer.getInstanceBuffers(Layer.TRANSPARENT)) {
			if(!buffer.isStatic) {
				buffer.create(renderer.gl);
			}
		}
		const matrices: mat4[] = [];

		/*for(let y = 1.25; y < 40; y += 2.5) {
			for(let x = 1.25; x < 40; x += 2.5) {
				const matrix = mat4.create();
				mat4.fromTranslation(matrix, vec3.fromValues(x - 20, 0, y - 20));
				matrices.push(matrix);
			}
		}

		sceneFile.data.instanceDatas = [
			{
				instanceBufferName: 'grass-static',
				meshPath: 'meshes/grass.staticmesh',
				matrices
			}
		];*/

		await this.handleSeparateInstanceBuffers(renderer.gl, sceneFile);
	}

	async handleSeparateInstanceBuffers(gl: WebGL2RenderingContext, data: SceneFile) {
		if(data.data.instanceDatas) {
			for(let buffer of data.data.instanceDatas) {
				await resource.loadFile<MeshFile>(buffer.meshPath);
				const meshData = resource.get<MeshFile>(buffer.meshPath);
				const staticMesh = new StaticMesh(meshData.mesh.name);
				const meshFileData = meshData.mesh.data as MeshFileData;
				
				const materialFiles: MaterialFile[] = [];
				const materials: string[] = [];
				const materialPromises: Promise<MaterialFile>[] = [];

				for(let materialFile of meshData.mesh.materials) {
					if (materials.indexOf(materialFile)) {
						materials.push(materialFile);
						materialPromises.push(resource.loadFile<MaterialFile>(materialFile));
					}
				}

				await Promise.all(materialPromises);

				const textureDatas: TextureData[] = [];
				for (let materialPath of meshData.mesh.materials) {
					const materialFile: MaterialFile = resource.get<MaterialFile>(materialPath);
					materialFiles.push(materialFile);
					for (let texture of materialFile.material.textures) {
						textureDatas.push(texture);
					}
		
					if(materialFile.material.customTextures) {
						for(let texture of materialFile.material.customTextures) {
							textureDatas.push({ path: texture.path, type: 'custom' })
						}
					}
		
				}
		
				await texture.LoadTextures(gl, textureDatas);
		
				for(let materialFile of materialFiles) {
					if(materialFile.material.customTextures) {
						for(let customTexture of materialFile.material.customTextures) {
							const tex = texture.GetTexture(customTexture.path);
							tex.name = customTexture.name;
						}
					}
				}
		
				for (let materialPath of meshData.mesh.materials) {
					loadMaterial(materialPath);
				}
				

				for(let child of meshFileData.children) {
					staticMesh.createSubmesh(gl, child.name, child.vertexData.vertices as unknown as Vertex[], child.vertexData.indices, child.vertexData.material);
				}
				const ib = new instanceBuffer.InstanceBuffer(staticMesh, buffer.instanceBufferName, Layer.OPAQUE);
				ib.createStaticFromData(gl, buffer.matrices);
			}
		}
	}

	loadAssets(renderer: Renderer) {}

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

	recurseChildren(gl: WebGL2RenderingContext, object: SceneNodeData, sceneNode: SceneNode ) {
		if (object.children) {
			for (let child of object.children) {
				const node = this.sceneNodeFromData(gl, child, sceneNode);
				this.recurseChildren(gl, child, node);
			}
		}
		if(object.meshPath) {
			this.createMesh(gl, object, sceneNode);
		}

	}

	private createMesh(gl: WebGL2RenderingContext, object: SceneNodeData, parent: SceneNode) {
		if(parent) {
			const mesh = loadMesh(gl, object.meshPath, parent);
			if(object.pointLight) {

				parent.pointLight = new PointLight(gl, vec3.fromValues(object.pointLight.localPosition.x,
					object.pointLight.localPosition.y, object.pointLight.localPosition.z),
					vec3.fromValues(object.pointLight.color.r, object.pointLight.color.g, object.pointLight.color.b)
					, object.pointLight.intensity, object.pointLight.radius);
	
				const pointLightIndex = this.pointLights.length;

				for(let submesh of mesh.getSubmeshes()) {
					(parent.getComponent('meshComponent') as MeshComponent<VertexBase>).mesh.pointLightIndex = pointLightIndex;
					this.pointLights.push(parent.pointLight);
					submesh.pointLightIndex = pointLightIndex;
				}
			}
		}
	}

	private sceneNodeFromData(gl: WebGL2RenderingContext, object: SceneNodeData, parent?: SceneNode) {

		const node = new SceneNode(object.name, this);
		node.transform.setPosition(object.position.x, object.position.y, object.position.z);
		node.transform.setRotation(object.rotation.x, object.rotation.y, object.rotation.z);

		if (parent) {
			parent.addChild(node);
		}

		if (object.pointLight && (node.getComponent('meshComponent') as MeshComponent<VertexBase>).mesh) {
			node.pointLight = new PointLight(gl, vec3.fromValues(object.pointLight.localPosition.x,
				object.pointLight.localPosition.y, object.pointLight.localPosition.z),
				vec3.fromValues(object.pointLight.color.r, object.pointLight.color.g, object.pointLight.color.b)
				, object.pointLight.intensity, object.pointLight.radius);

			const pointLightIndex = this.pointLights.length;
			(node.getComponent('meshComponent') as MeshComponent<VertexBase>).mesh.pointLightIndex = pointLightIndex;
			this.pointLights.push(node.pointLight);
		}

		return node;
	}

	name: string;
	path: string;
	sceneGraph: SceneGraph;
	renderer: Renderer;

	dirLight?: DirectionalLight;
	pointLights?: PointLight[];

	terrain: Terrain;

	modifySphere: SceneNode;
}
