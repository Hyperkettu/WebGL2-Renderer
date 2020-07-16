import { MenuState, MenuSettings } from "./menustate";
import { StateMachine, Size, State } from "../statemachine";
import { Button } from "../../overlay/ui/button";
import { Scene } from "../../scene";
import { Grid } from "../../overlay/ui/grid";
import { Text } from "../../overlay/ui/text";
import { Sprite } from "../../overlay/sprite";
import * as settings from '../../settings';
import { vec2 } from "gl-matrix";
import { Container } from '../../overlay/ui/container';

export interface MainMenuSettings extends MenuSettings {
    scene: Scene;
}

export class MainMenuState extends MenuState {

    constructor(name: string, settings: MainMenuSettings) {
		super(name, settings);
		this.showMenuButton = true;
	}
	
	public async enter(fsm: StateMachine, from?: State) {
		await super.enter(fsm, from);
		if(!from) {
			this.toggleMenu({ instant: true });
		}
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

    public handleInput(dt: number, keys: { [id: string]: boolean }) {
        const settings = this.settings as MainMenuSettings;
        if (keys['o']) {
			settings.scene.dirLight.intensity += 1.0 * dt;

			const value = Math.round(settings.scene.dirLight.intensity * 100) / 100;
		//	this.layout.getElement(ui.Text, 'dirlight_text').setText(`Dirlight Intensity:\n${value}`);
		} else if (keys['l']) {
            settings.scene.dirLight.intensity -= 1.0 * dt;
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
	}
	
	public handleKeyPress(key: string) {
		if(key === 'm') {
			this.toggleMenu({ instant: false });
		}
	}

	public postExit(fsm: StateMachine) {
	}

	public update(dt: number, time: number, inputDt: number) {
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
}