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
import { StaticMesh } from './mesh';
import { BillboardText } from './billboardtext';

export class TestScene extends Scene {
	constructor(name: string, renderer: Renderer) {
		super(name, renderer);
	}

	async initScene(renderer: Renderer, path: string) {
		await super.initScene(renderer, path);

		const dirLightColor = vec3.fromValues(1, 1, 1);
		const dirLightDirection = vec3.fromValues(0.0, -1.0, -2.0);
		const dirLightIntensity = 0.0;
		this.dirLight = new DirectionalLight(renderer.gl, dirLightColor, dirLightDirection, dirLightIntensity);

		for (let pointLight of this.pointLights) {
			pointLight.shadowMap.excludeNodesFromShadowMap(renderer, [
				'light'
			]);
		}

		await material.loadMaterial('materials/rock.mat.json', true, renderer.gl);


		//this.sceneGraph.find('sphere').addComponent(new CubeScript());

		/*	const terrain = mesh.GetMesh<StaticMesh>('terrain');
			terrain.getSubmesh('terrain').materialID = 'stone-with-displacement';  //'rock -with-displacement'; //'rock';
			terrain.getSubmesh('terrain').wireFrame = false;

			const node = new SceneNode('terrainNode', this);
			node.transform.setPosition(0, 10, 0);
			node.transform.setRotation(0, 0, 0);
			node.addMesh(terrain.getSubmesh('terrain'), Layer.OPAQUE);
			this.addObject(node); */

		/*	await GeometryGenerator.GeneratePlaneTerrain(renderer.gl, 'planeTerrain', 0.2, 20, 1.2, 0);
			const terrain = mesh.GetMesh('planeTerrain');
			const submesh = terrain.getSubmesh('terrain');
			submesh.wireFrame = false;
			submesh.materialID = 'bark1-with-displacement';
			const node = new SceneNode('terrainNode', this);
			node.transform.setPosition(0, 0, 0);
			node.transform.setRotation(0, 0, 0);
			node.addMesh(submesh, Layer.OPAQUE);
			this.addObject(node);
			this.plane = node; 

			mesh.toMeshDataFile(terrain); */

	}

	loadAssets(renderer: Renderer) {
	
		const billboardText = new BillboardText(renderer, renderer.overlay);
		billboardText.setText('Nightwish', 0.25);
		const sn = new SceneNode('bb', this);
		sn.addMesh(billboardText.billboardMesh.getSubmesh('plane'), Layer.OPAQUE);
		sn.transform.setPosition(0, 7, 0);
		this.addObject(sn);

	}

	update(dt: number) {
		super.update(dt);
	}

	plane: SceneNode;
}