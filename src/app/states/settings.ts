import { State, StateMachine } from '../statemachine';
import * as settings from '../../settings';
import { Renderer } from '../../glrenderer';
import { Scene } from '../../scene';
import { ConstantBuffers, BufferDirtyFlag } from '../../constantbuffers';
import * as util from '../../app/util';
import { ShaderType } from '../../shader';
import { MeshComponent } from '../../meshcomponent';
import { vec3 } from 'gl-matrix';
import { Picker } from '../../raycast';
import { Mesh } from '../../mesh';
import { GetMesh } from '../../meshmanager';
import { Transform } from '../../transform';

enum ColorSetting {
	NONE = 0,
	SATURATION,
	CONTRAST,
	BRIGHTNESS,
	NUM_ATTRIBUTES
}

export interface SettingsParams {
	renderer: Renderer;
}

export class SettingsState extends State {

	constructor(params: SettingsParams) {
		super('Settings');
		this.params = params;
	}

	async enter(fsm: StateMachine, from: State) {

		this.scene = this.params.renderer.currentScene;
		this.enableInput(fsm);
	}

	exit(fsm: StateMachine, to: State) {
	}

	postExit(fsm: StateMachine) {

	}

	update(dt: number, time: number, inputDt: number) {
		this.handleInput(inputDt);

		this.fps++;

		if (time * 0.001 >= this.seconds) {
			this.seconds++;
		//	this.layout.getElement(ui.Text, 'fps_text').setText(`${this.fps}`);
		//	this.layout.getElement(ui.Text, 'draw_calls_text').setText(`Draw Calls: ${Renderer.numDrawCallsPerFrame}`);
			this.fps = 0;
		}
	}

	handleInput(dt: number) {

		const camera = this.params.renderer.getCurrentCamera();

		if (this.keys['h']) {
			camera.rotateX(-dt * 50);
		}
		if (this.keys['y']) {
			camera.rotateX(dt * 50);
		}
		if (this.keys['g']) {
			camera.rotateY(dt * 50);
		}
		if (this.keys['j']) {
			camera.rotateY(-dt * 50);
		}
		if (this.keys['r']) {
			camera.moveUp(10.0 * dt);
		}
		if (this.keys['f']) {
			camera.moveUp(-10.0 * dt);
		}
		if (this.keys['w']) {

			let speed = 10.0;

			if (this.keys['Shift']) {
				speed *= 10.0;
			}

			camera.moveForward(speed * dt);
		}
		if (this.keys['s']) {

			let speed = 10.0;

			if (this.keys['Shift']) {
				speed *= 10.0;
			}

			camera.moveForward(-speed * dt);
		}
		if (this.keys['a']) {

			let speed = 10.0;

			if (this.keys['Shift']) {
				speed *= 10.0;
			}

			camera.moveRight(-speed * dt);
		}
		if (this.keys['d']) {
			let speed = 10.0;

			if (this.keys['Shift']) {
				speed *= 10.0;
			}

			camera.moveRight(speed * dt);
		}

		if (this.keys['o']) {
			this.scene.dirLight.intensity += 1.0 * dt;

			const value = Math.round(this.scene.dirLight.intensity * 100) / 100;
		//	this.layout.getElement(ui.Text, 'dirlight_text').setText(`Dirlight Intensity:\n${value}`);
		} else if (this.keys['l']) {
			this.scene.dirLight.intensity -= 1.0 * dt;

			if (this.scene.dirLight.intensity < 0) {
				this.scene.dirLight.intensity = 0;
			}
			const value = Math.round(this.scene.dirLight.intensity * 100) / 100;
		//	this.layout.getElement(ui.Text, 'dirlight_text').setText(`Dirlight Intensity:\n${value}`);
		}

		if (this.keys['9']) {
			this.scene.pointLights[0].intensity += 1.0 * dt;
			const value = Math.round(this.scene.pointLights[0].intensity * 100) / 100;
		//	this.layout.getElement(ui.Text, 'pointlight_text').setText(`Point Light Intensity:\n${value}`);
		} else if (this.keys['8']) {
			this.scene.pointLights[0].intensity -= 1.0 * dt;

			if (this.scene.pointLights[0].intensity < 0) {
				this.scene.pointLights[0].intensity = 0;
			}
			const value = Math.round(this.scene.pointLights[0].intensity * 100) / 100;
		//	this.layout.getElement(ui.Text, 'pointlight_text').setText(`Point Light Intensity:\n${value}`);
		}

		if (this.keys['+']) {

			if (this.keys['c']) {
				this.scene.terrain.tileScale += 1.0 * dt;
				console.log(this.scene.terrain.tileScale);

				return;
			}

			if (this.skyboxIntensityToggle) {
				this.params.renderer.skybox.intensity += 1.0 * dt;
				return;
			}

			if (this.colorSettingState === ColorSetting.NONE) {
				this.scene.pointLights[0].changeRadius(10.0, dt);
				const value = Math.round(this.scene.pointLights[0].radius * 100) / 100;
		//		this.layout.getElement(ui.Text, 'pointlight_radius_text').setText(`Point Light Radius:\n${value}`);
			} else {
				switch (this.colorSettingState) {
					case ColorSetting.SATURATION:
						const newSaturation = settings.saturation + 0.2 * dt;
						settings.setSaturation(newSaturation);
						const value = Math.round(newSaturation * 100) / 100;
		//				this.layout.getElement(ui.Text, 'saturation_text').setText(`Saturation\n${value}`);
						break;
					case ColorSetting.CONTRAST:
						const newContrast = settings.contrast + 0.2 * dt;
						settings.setContrast(newContrast);
						const value2 = Math.round(newContrast * 100) / 100;
		//				this.layout.getElement(ui.Text, 'contrast_text').setText(`Contrast\n${value2}`);
						break;
					case ColorSetting.BRIGHTNESS:
						const newBrightness = settings.brightness + 0.2 * dt;
						settings.setBrightness(newBrightness);
						const value3 = Math.round(newBrightness * 100) / 100;
		//				this.layout.getElement(ui.Text, 'brightness_text').setText(`Brightness\n${value3}`);
						break;
				}
			}

		} else if (this.keys['-']) {

			if (this.keys['c']) {
				this.scene.terrain.tileScale -= 1.0 * dt;
				console.log(this.scene.terrain.tileScale);
				return;
			}

			if (this.skyboxIntensityToggle) {
				this.params.renderer.skybox.intensity -= 1.0 * dt;
				return;
			}

			if (this.colorSettingState === ColorSetting.NONE) {
				this.scene.pointLights[0].changeRadius(-10.0, dt);
				const value = Math.round(this.scene.pointLights[0].radius * 100) / 100;
		//		this.layout.getElement(ui.Text, 'pointlight_radius_text').setText(`Point Light Radius:\n${value}`);
			} else {
				switch (this.colorSettingState) {
					case ColorSetting.SATURATION:
						const newSaturation = settings.saturation - 0.2 * dt;
						settings.setSaturation(newSaturation);
						const value = Math.round(newSaturation * 100) / 100;
		//				this.layout.getElement(ui.Text, 'saturation_text').setText(`Saturation\n${value}`);
						break;
					case ColorSetting.CONTRAST:
						const newContrast = settings.contrast - 0.2 * dt;
						settings.setContrast(newContrast);
						const value2 = Math.round(newContrast * 100) / 100;
		//				this.layout.getElement(ui.Text, 'contrast_text').setText(`Contrast\n${value2}`);
						break;
					case ColorSetting.BRIGHTNESS:
						const newBrightness = settings.brightness - 0.2 * dt;
						settings.setBrightness(newBrightness);
						const value3 = Math.round(newBrightness * 100) / 100;
		//				this.layout.getElement(ui.Text, 'brightness_text').setText(`Brightness\n${value3}`);
						break;
				}
			}

		}

		if (this.keys['m']) {
			// 'sphere'
			const mesh = this.scene.terrain.terrain; //this.scene.sceneGraph.find('terrainNode').getComponent('meshComponent') as MeshComponent;
			mesh.displacementFactor += 1.0 * dt;
		} else if (this.keys['n']) {
			const mesh = this.scene.terrain.terrain;
			mesh.displacementFactor -= 1.0 * dt;

			if (mesh.displacementFactor < 0) {
				mesh.displacementFactor = 0;
			}
		}

		if (this.keys['z']) {
			// 'sphere'
			const meshComponent = this.scene.sceneGraph.find('sphere').getComponent('meshComponent') as MeshComponent;
			meshComponent.mesh.displacementFactor += 1.0 * dt;
		} else if (this.keys['x']) {
			const meshComponent = this.scene.sceneGraph.find('sphere').getComponent('meshComponent') as MeshComponent;
			meshComponent.mesh.displacementFactor -= 1.0 * dt;

			if (meshComponent.mesh.displacementFactor < 0) {
				meshComponent.mesh.displacementFactor = 0;
			}
		}
	}

	onResize(size: { x: number, y: number }) {

	}

	enableInput(fsm: StateMachine) {

		document.addEventListener('mouseup', event => {
			const camera = this.params.renderer.getCurrentCamera();
			const svp = this.params.renderer.context.screenViewPort;
			const picker = new Picker(svp);
			const info = picker.castRay(camera, event.x, svp.height - event.y);
			console.log(info);
			if (info.hit) {
				const sphere = this.scene.sceneGraph.find('sphere');
				(sphere.getComponent('meshComponent') as MeshComponent).mesh.wireFrame = false;
				(sphere.getComponent('transform') as Transform).position = vec3.fromValues(
					info.hitPoint[0], info.hitPoint[1], info.hitPoint[2]);
			} else {
				const sphere = this.scene.sceneGraph.find('sphere');
				(sphere.getComponent('meshComponent') as MeshComponent).mesh.wireFrame = true;

			}
		});

		document.addEventListener('mousemove', event => {

			if (!this.showMenu) {
				const sensitivy = 0.5;
				const deltaX = event.movementX * sensitivy;
				const deltaY = event.movementY * sensitivy;

				const camera = this.params.renderer.getCurrentCamera();
				camera.rotateY(-deltaX);
				camera.rotateX(-deltaY);
			}
		});

	//	this.layout.getElement('menu_button').onClick(() => {

	/*		if (!this.showMenu) {
				this.layout.getElement(ui.Text, 'normal_map_toggle_text').setText(settings.enableNormalMap === 1 ? 'enabled' : 'disabled');
				this.layout.getElement(ui.Text, 'displacement_map_toggle_text').setText(settings.enableDisplacement === 1 ? 'enabled' : 'disabled');
				this.layout.getElement(ui.Text, 'gamma_correction_toggle_text').setText(settings.enableGammaCorrection === 1 ? 'enabled' : 'disabled');
				this.layout.getElement(ui.Text, 'tonemap_toggle_text').setText(settings.getToneMapping());
				this.layout.getElement(ui.Text, 'grayscale_toggle_text').setText(settings.enableGrayScale ? 'enabled' : 'disabled');

				this.layout.getElement(ui.Text, 'setting_07_text').setText('Shadow Map Debug:');
				this.layout.getElement(ui.Text, 'setting_07_toggle_text').setText(settings.enableShadowMapDebug ? 'enabled' : 'disabled');

				this.layout.getElement(ui.Text, 'setting_08_text').setText('Blending:');
				this.layout.getElement(ui.Text, 'setting_08_toggle_text').setText(settings.enableBlending ? 'enabled' : 'disabled');



				//this.layout.setState('show-attributes');
				this.layout.setState('options-01-button-move-in');
				this.layout.setState('options-02-button-move-in');*/
	/*		} else {
				//this.layout.setState('options-01-button-move-out');
				//this.layout.setState('options-02-button-move-out');

				if (this.showOptions === 1) {
			//		this.layout.setState('hide-attributes');
				} else if (this.showOptions === 2) {
			//		this.layout.setState('hide-attributes-02');
				}
				this.showOptions = 0;
			}

			this.showMenu = !this.showMenu;
		});
*/
		/*this.layout.getElement('menu_option_01_button').onClick(async () => {
			console.log(this.showOptions);
			if (this.showOptions === 0) {
				this.layout.setState('show-attributes');
			} else if (this.showOptions === 2) {
				await this.layout.setState('hide-attributes-02');
				this.layout.setState('show-attributes');
			}
			this.showOptions = 1;
		});

		this.layout.getElement('menu_option_02_button').onClick(async () => {
			if (this.showOptions === 0) {
				this.layout.setState('show-attributes-02');
			} else if (this.showOptions === 1) {
				await this.layout.setState('hide-attributes');
				this.layout.setState('show-attributes-02');
			}
			this.showOptions = 2;
		});

		this.layout.getElement('normal_button').onClick(() => {
			settings.setEnableNormalMap(!settings.enableNormalMap);
			this.layout.getElement(ui.Text, 'normal_map_toggle_text').setText(settings.enableNormalMap === 1 ? 'enabled' : 'disabled');
		});

		this.layout.getElement('displacement_button').onClick(() => {
			settings.setEnableDisplacement(!settings.enableDisplacement);
			this.layout.getElement(ui.Text, 'displacement_map_toggle_text').setText(settings.enableDisplacement === 1 ? 'enabled' : 'disabled');
		});

		this.layout.getElement('gamma_button').onClick(() => {
			settings.setEnableGammaCorrection(!settings.enableGammaCorrection);
			this.layout.getElement(ui.Text, 'gamma_correction_toggle_text').setText(settings.enableGammaCorrection === 1 ? 'enabled' : 'disabled');
		});

		this.layout.getElement('tone_button').onClick(() => {
			settings.setEnableToneMapping();
			this.layout.getElement(ui.Text, 'tonemap_toggle_text').setText(settings.getToneMapping());
		});

		this.layout.getElement('grayscale_button').onClick(() => {
			settings.setEnableGrayScale(!settings.enableGrayScale);
			this.layout.getElement(ui.Text, 'grayscale_toggle_text').setText(settings.enableGrayScale ? 'enabled' : 'disabled');

		});

		this.layout.getElement('bloom_button').onClick(() => {
			settings.setEnableBloom(!settings.enableBloom);
			this.layout.getElement(ui.Text, 'bloom_toggle_text').setText(settings.enableBloom ? 'enabled' : 'disabled');

		});

		this.layout.getElement('setting_07_button').onClick(() => {
			settings.setEnableShadowMapDebug(!settings.enableShadowMapDebug);
			this.layout.getElement(ui.Text, 'setting_07_toggle_text').setText(settings.enableShadowMapDebug ? 'enabled' : 'disabled');

		});

		this.layout.getElement('setting_08_button').onClick(() => {
			settings.setEnableBlending(!settings.enableBlending);
			this.layout.getElement(ui.Text, 'setting_08_toggle_text').setText(settings.enableBlending ? 'enabled' : 'disabled');
		}); */

		document.addEventListener('keyup', (event: KeyboardEvent) => {
			this.keys[event.key] = false;
		});

		document.addEventListener('keydown', event => {
			this.keys[event.key] = true;

			if (event.key === '1') {
				settings.setEnableNormalMap(!settings.enableNormalMap);
			//	this.layout.getElement(ui.Text, 'normal_map_toggle_text').setText(settings.enableNormalMap === 1 ? 'enabled' : 'disabled');
				this.showInfoText(`Normal Map: ${settings.enableNormalMap === 1 ? 'enabled' : 'disabled'}`);

			} else if (event.key === '2') {
				settings.setEnableGammaCorrection(!settings.enableGammaCorrection);
			//	this.layout.getElement(ui.Text, 'gamma_correction_toggle_text').setText(settings.enableGammaCorrection === 1 ? 'enabled' : 'disabled');
				this.showInfoText(`Gamma Correction: ${settings.enableGammaCorrection === 1 ? 'enabled' : 'disabled'}`);


			} else if (event.key === '3') {
				settings.setEnableToneMapping();
			//	this.layout.getElement(ui.Text, 'tonemap_toggle_text').setText(settings.getToneMapping());
				this.showInfoText(`Tone Map: ${settings.getToneMapping()}`);


			} else if (event.key === '4') {
				settings.setEnableDisplacement(!settings.enableDisplacement);
			//	this.layout.getElement(ui.Text, 'displacement_map_toggle_text').setText(settings.enableDisplacement === 1 ? 'enabled' : 'disabled');
				this.showInfoText(`Displacement: ${settings.enableDisplacement === 1 ? 'enabled' : 'disabled'}`);


			} else if (event.key === '5') {
				settings.setEnableGrayScale(!settings.enableGrayScale);
			//	this.layout.getElement(ui.Text, 'grayscale_toggle_text').setText(settings.enableGrayScale ? 'enabled' : 'disabled');
				this.showInfoText(`Gray Scale: ${settings.enableGrayScale ? 'enabled' : 'disabled'}`);


			} else if (event.key === 'b') {
				settings.setEnableBlending(!settings.enableBlending);
			//	this.layout.getElement(ui.Text, 'setting_08_text').setText(settings.enableBlending ? 'enabled' : 'disabled');
				this.showInfoText(`Blending: ${settings.enableBlending ? 'enabled' : 'disabled'}`);


			} else if (event.key === '0') {
				settings.setEnableShadowMapDebug(!settings.enableShadowMapDebug);
				this.showInfoText(`Shadow Map Debug: ${settings.enableShadowMapDebug ? 'enabled' : 'disabled'}`);

			} else if (event.key === '.') {
				settings.setEnableSkybox(!settings.enableSkybox);
				this.showInfoText(`Skybox: ${settings.enableSkybox ? 'enabled' : 'disabled'}`);

			} else if (event.key === '6') {
				settings.setEnableDebugNormals(!settings.debugNormals);
			} else if (event.key === '7') {
				settings.setEnabledDebugWireframe(!settings.debugWireFrame);
				//	(this.scene.sceneGraph.find('terrainNode').getComponent('meshComponent') as MeshComponent).mesh.wireFrame = settings.debugWireFrame;
				this.scene.terrain.terrain.wireFrame = settings.debugWireFrame;
			}

			if (event.key === 'F1') {
				this.colorSettingState = (this.colorSettingState + 1) % ColorSetting.NUM_ATTRIBUTES;
			}

			if (event.key === 'F2') {
				this.skyboxIntensityToggle = !this.skyboxIntensityToggle;
			}

		});
	}

	async showInfoText(text: string) {
	/*	this.layout.getElement(ui.Text, 'info_text').setText(text);
		await this.layout.setState('show-info');
		await async.wait(2000);
		this.layout.setState('hide-info');*/
	}

	showMenu: boolean = false;
	showOptions: number = 0;
	scene: Scene;
	keys: { [id: string]: boolean } = {};
	params: SettingsParams;

	fps: number = 0;
	seconds: number = 0;

	colorSettingState: ColorSetting = ColorSetting.NONE;
	skyboxIntensityToggle: boolean = false;
}