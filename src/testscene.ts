import { Scene } from './scene';
import { SceneNode } from './scenenode';
import { CubeScript } from './cubescript';
import { DirectionalLight } from './directionallight';
import { vec3 } from 'gl-matrix';
import { Renderer } from './glrenderer';
import * as mesh from './meshmanager';
import { Layer } from './batchrenderer';
import * as material from './material';
import * as texture from './texturemanager';
import { GeometryGenerator } from './geometrygenerator';

export class TestScene extends Scene {
	constructor(name: string) {
		super(name);
	}

	async initScene(renderer: Renderer, path: string) {
		await super.initScene(renderer, path);

		const dirLightColor = vec3.fromValues(1, 1, 1);
		const dirLightDirection = vec3.fromValues(0.0, -1.0, -1.0);
		const dirLightIntensity = 0.0;
		this.dirLight = new DirectionalLight(dirLightColor, dirLightDirection, dirLightIntensity);

		for (let pointLight of this.pointLights) {
			pointLight.shadowMap.excludeNodesFromShadowMap(renderer, [
			]);
		}
		
		await material.loadMaterial('materials/rock.mat.json', true, renderer.gl);

		//this.sceneGraph.find('sphere').addComponent(new CubeScript());

		/*	const terrain = mesh.GetMesh('terrain');
			terrain.materialID = ''; //'stone-with-displacement';  //'rock -with-displacement'; //'rock';
			terrain.wireFrame = false;
			const node = new SceneNode('terrainNode', this);
			node.transform.setPosition(0, 10, 0);
			node.transform.setRotation(0, 0, 0);
			node.addMesh(terrain, Layer.OPAQUE);
			this.addObject(node);*/

			/*await GeometryGenerator.GeneratePlaneTerrain(renderer.gl, 'planeTerrain', 0.2, 20, 4, 0);
			const terrain = mesh.GetMesh('planeTerrain');
			const submesh = terrain.getSubmesh('terrain');
			submesh.wireFrame = false;
			const node = new SceneNode('terrainNode', this);
			node.transform.setPosition(0, 0, 0);
			node.transform.setRotation(0, 0, 0);
			node.addMesh(submesh, Layer.OPAQUE);
			this.addObject(node);
			this.plane = node; 

			mesh.toMeshDataFile(terrain); */

	}

	update(dt: number) {
		super.update(dt);
	}

	plane: SceneNode;
}