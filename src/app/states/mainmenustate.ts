import { MenuState, MenuSettings } from "./menustate";
import { StateMachine, Size, State } from "../statemachine";
import { Button } from "../../overlay/ui/button";
import { Scene } from "../../scene";
import { Grid } from "../../overlay/ui/grid";
import { Text } from "../../overlay/ui/text";
import { Sprite } from "../../overlay/sprite";
import * as settings from '../../settings';
import { vec2, vec3, vec4, mat4 } from "gl-matrix";
import { Container } from '../../overlay/ui/container';
import { Slider } from "../../overlay/ui/slider";
import { Picker, HitInfo } from "../../raycast";
import { MeshComponent } from "../../meshcomponent";
import { VertexBase } from "../../vertex";
import * as async from '../../util/math';
import { SceneNode } from "../../scenenode";
import { LineMesh, Mesh } from "../../mesh";
import { AxisMesh } from "../axismesh";
import * as math from '../../util/math';
import { Ray } from "../../ray";
import { Plane } from "../../plane";
import { toMeshDataFile } from "../../meshmanager";

export interface MainMenuSettings extends MenuSettings {
    scene: Scene;
}

export class MainMenuState extends MenuState {

    constructor(name: string, settings: MainMenuSettings) {
		super(name, settings);
		this.showMenuButton = true;
		this.picker = new Picker(this.settings.renderer.context.screenViewPort, 'any');
		this.axisMesh = new AxisMesh(settings.renderer);

		this.selectedAxises = [];
	}
	
	public async enter(fsm: StateMachine, from?: State) {
		await super.enter(fsm, from);
		if(!from) {
			this.toggleMenu({ instant: true });
		}

		this.settings.renderer.hdrBufferRenderCallback = this.render.bind(this);
	}

    public enableInput(fsm: StateMachine) {
		const settings = this.settings as MainMenuSettings;
		this.menuSettings = settings;
        const button = settings.layout.find('MenuButton') as Button;
        button.onClick((x, y) => {
            fsm.set(fsm.getState('Settings'));
		});

    }
	public disableInput(fsm: StateMachine) {
        const settings = this.settings as MainMenuSettings;
        settings.layout.clickHandlers = [];
        settings.layout.releaseClickHandlers = [];
	}
	
	public mouseDown(x: number, y: number) {

		if(this.selectedNode) {

			if(this.selectedAxises.length === 0) {
				const ray = this.picker.generateScreenRayFromCamera(this.settings.renderer.getCurrentCamera(),
				x, window.innerHeight - y);

				const invTransform = mat4.create();
				let direction = vec4.create();
				let localRay = new Ray([0, 0, 0], [1, 0, 0]);
				mat4.invert(invTransform, this.selectedNode.transform.world);
				vec3.transformMat4(localRay.origin, ray.origin, invTransform);
				direction = vec4.fromValues(ray.direction[0], ray.direction[1], ray.direction[2], 0);
				vec4.transformMat4(direction, direction, invTransform);
				localRay.direction = vec3.fromValues(direction[0], direction[1], direction[2]);
				localRay = new Ray(localRay.origin, localRay.direction);
				let index = 0;
				for(let aabb of this.axisMesh.aabbs) {
					const info = new HitInfo();
					if(math.rayIntersectsAABB(localRay, aabb.aabb, info)) {
						this.selectedAxises.push(index);
					}
					
					
					index++;
				}
			}

			return;
		}

		const hitInfo = this.picker.select(this.settings.renderer.getCurrentCamera(), 
		x, window.innerHeight - y, this.settings.renderer.currentScene.sceneGraph);
		if(hitInfo.hit) {
			(async () => {
			const comp = (hitInfo.hitObject.getComponent('meshComponent') as MeshComponent<VertexBase>);
			comp.mesh.boundingVolume.color = vec4.fromValues(0, 1, 0, 1);
			this.selectedNode = hitInfo.hitObject;
			this.settings.mouseMoveCamera = false;
			await async.wait(4000);
			comp.mesh.boundingVolume.color = vec4.fromValues(1, 0, 0, 1);
			})();
		} else {
			this.selectedNode = null;
		}
	}

	public mouseUp(x: number, y: number) {
		this.selectedAxises = [];
		this.settings.mouseMoveCamera = true;
	}
	public mouseMove(x: number, y: number) {
		if(this.selectedAxises.length === 1  && this.selectedNode) {

			if(this.selectedAxises[0] === 0) {

				const normal = math.getY(this.selectedNode.transform.world);

				const plane = new Plane(this.selectedNode.transform.position, normal);
				const ray = this.picker.generateScreenRayFromCamera(this.settings.renderer.getCurrentCamera(),
				x, window.innerHeight - y);


				const info = new HitInfo();
				if(math.rayIntersectsPlane(ray, plane, info)) {	
					const px = info.hitPoint[0];
					this.selectedNode.transform.setPosition(px, 
						this.selectedNode.transform.position[1], this.selectedNode.transform.position[2]);
	
				}

				
			} else if(this.selectedAxises[0] === 1) {

				const normal = math.getZ(this.selectedNode.transform.world);

				const plane = new Plane(this.selectedNode.transform.position, normal);
				const ray = this.picker.generateScreenRayFromCamera(this.settings.renderer.getCurrentCamera(),
				x, window.innerHeight - y);

				const info = new HitInfo();
				if(math.rayIntersectsPlane(ray, plane, info)) {	
					const py = info.hitPoint[1];

					this.selectedNode.transform.setPosition(this.selectedNode.transform.position[0], 
						py, this.selectedNode.transform.position[2]);
	
				}

				
		
			} else {

				const normal = math.getX(this.selectedNode.transform.world);

				const plane = new Plane(this.selectedNode.transform.position, normal);
				const ray = this.picker.generateScreenRayFromCamera(this.settings.renderer.getCurrentCamera(),
				x, window.innerHeight - y);

				const info = new HitInfo();
				if(math.rayIntersectsPlane(ray, plane, info)) {	
					const pz = info.hitPoint[2];

					this.selectedNode.transform.setPosition(this.selectedNode.transform.position[0], 
						this.selectedNode.transform.position[1], pz);
	
				}
			}
		} else if(this.selectedAxises.length === 2 && this.selectedNode) {
			if(this.selectedAxises[0] === 0) {
				if(this.selectedAxises[1] === 1) {

					const normal = math.getZ(this.selectedNode.transform.world);

					const plane = new Plane(this.selectedNode.transform.position, normal);
					const ray = this.picker.generateScreenRayFromCamera(this.settings.renderer.getCurrentCamera(),
					x, window.innerHeight - y);


					const info = new HitInfo();
					if(math.rayIntersectsPlane(ray, plane, info)) {	
						const px = info.hitPoint[0];
						const py = info.hitPoint[1];
						this.selectedNode.transform.setPosition(px, py,
						this.selectedNode.transform.position[2]);
	
					}

				} else {

					const normal = math.getY(this.selectedNode.transform.world);

					const plane = new Plane(this.selectedNode.transform.position, normal);
					const ray = this.picker.generateScreenRayFromCamera(this.settings.renderer.getCurrentCamera(),
					x, window.innerHeight - y);


					const info = new HitInfo();
					if(math.rayIntersectsPlane(ray, plane, info)) {	
						const px = info.hitPoint[0];
						const pz = info.hitPoint[2];
						this.selectedNode.transform.setPosition(px, 
						this.selectedNode.transform.position[1], pz);
	
					}
				}
			} else {
				const normal = math.getX(this.selectedNode.transform.world);

				const plane = new Plane(this.selectedNode.transform.position, normal);
				const ray = this.picker.generateScreenRayFromCamera(this.settings.renderer.getCurrentCamera(),
				x, window.innerHeight - y);


				const info = new HitInfo();
				if(math.rayIntersectsPlane(ray, plane, info)) {	
					const py = info.hitPoint[1];
					const pz = info.hitPoint[2];
					this.selectedNode.transform.setPosition( 
					this.selectedNode.transform.position[0], py, pz);

				}
			}
		}
	}

    public handleInput(dt: number, keys: { [id: string]: boolean }) {
        const settings = this.settings as MainMenuSettings;
        if (keys['o']) {
			settings.scene.dirLight.intensity += 1.0 * dt;

			const value = Math.round(settings.scene.dirLight.intensity * 100) / 100;
		//	this.layout.getElement(ui.Text, 'dirlight_text').setText(`Dirlight Intensity:\n${value}`);
		} else if (keys['l']) {
			settings.scene.dirLight.intensity -= 1.0 * dt;
			if(settings.scene.dirLight.intensity < 0.0) {
				settings.scene.dirLight.intensity = 0;
			}
        }

        const camera = this.settings.renderer.getCurrentCamera();

		if (keys['h']) {
			camera.rotateX(-dt * 50);
		}
		if (keys['y']) {
			camera.rotateX(dt * 50);
		}
		if (keys['g']) {
			camera.rotateY(dt * 50);
		}
		if (keys['j']) {
			camera.rotateY(-dt * 50);
		}
		if (keys['r']) {
			camera.moveUp(10.0 * dt);
		}
		if (keys['f']) {
			camera.moveUp(-10.0 * dt);
		}
		if (keys['w']) {

			let speed = 10.0;

			if (keys['Shift']) {
				speed *= 10.0;
			}

			camera.moveForward(speed * dt);
		}
		if (keys['s']) {

			let speed = 10.0;

			if (keys['Shift']) {
				speed *= 10.0;
			}

			camera.moveForward(-speed * dt);
		}
		if (keys['a']) {

			let speed = 10.0;

			if (keys['Shift']) {
				speed *= 10.0;
			}

			camera.moveRight(-speed * dt);
		}
		if (keys['d']) {
			let speed = 10.0;

			if (keys['Shift']) {
				speed *= 10.0;
			}

			camera.moveRight(speed * dt);
		}

		if(this.selectedNode) { 
			if(keys['+']) {
				(this.selectedNode.getComponent('meshComponent') as MeshComponent<VertexBase>).mesh.displacementFactor += 1 * dt;
			} else if(keys['-']) {
				const mesh = (this.selectedNode.getComponent('meshComponent') as MeshComponent<VertexBase>).mesh;
				mesh.displacementFactor -= 1 * dt;
				if(mesh.displacementFactor < 0) {
					mesh.displacementFactor = 0;
				}
			}
		}
	}
	
	public handleKeyPress(key: string) {
		if(key === 'm') {
			this.toggleMenu({ instant: false });
		}
		if(key === 'c') {
			this.selectedNode = null;
			this.selectedAxises = [];
		}

		if(key === '1') {
			toMeshDataFile(this.settings.renderer.tree.trunk, 'oak-tree-node', 'oak-tree', 'trunk', 'materials/bark1.mat.json', 'bark1-with-displacement');        
		} else if(key === '2') {
			toMeshDataFile(this.settings.renderer.tree.leaves, 'oak-leaves-node', 'oak-leaves', 'leafSubmesh', 'materials/oak-leaf.mat.json', 'oak-leaf');        
		}
	}

	public postExit(fsm: StateMachine) {
	}

	public update(dt: number, time: number, inputDt: number) {

	}

	render(gl: WebGL2RenderingContext) {
		if(this.selectedNode) {
			this.axisMesh.render(gl, this.selectedNode);
		}
	}

	public onResize(size: Size) {
	}

	private toggleMenu(settings: { instant: boolean }) {
		this.settings.mouseMoveCamera = this.showMenuButton;
		this.showMenuButton = !this.showMenuButton;
		if(this.showMenuButton) {
			this.menuSettings.layout.runAnimation('MenuButton', 'show-menu-button', settings);
		} else {
			this.menuSettings.layout.runAnimation('MenuButton', 'hide-menu-button', settings);
		}
	}
	menuSettings: MainMenuSettings;
	showMenuButton: boolean;

	picker: Picker;
	selectedNode: SceneNode;
	selectedAxises: number[];

	axisMesh: AxisMesh;
}