import { MenuState, MenuSettings } from "./menustate";
import { StateMachine } from "../statemachine";
import { Button } from "../../overlay/ui/button";
import { Scene } from "../../scene";

export interface MainMenuSettings extends MenuSettings {
    scene: Scene;
}

export class MainMenuState extends MenuState {
    constructor(name: string, settings: MainMenuSettings) {
        super(name, settings);
    }

    public enableInput(fsm: StateMachine) {
        const settings = this.settings as MainMenuSettings;
        const button = settings.layout.find('MainButton') as Button;
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
}