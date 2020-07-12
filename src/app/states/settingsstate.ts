import { MenuState, MenuSettings } from "./menustate";
import { StateMachine, State, Size } from "../statemachine";
import { Button } from "../../overlay/ui/button";
import { Grid } from "../../overlay/ui/grid";
import * as setting from '../../settings';
import { vec2 } from "gl-matrix";
import { Container } from "../../overlay/ui/container";

export interface Settings extends MenuSettings {

}

export class SettingsState extends MenuState {

    constructor(name: string, settings: Settings) {
        super(name, settings);
        this.menuSettings = settings as MenuSettings;
    }

    public async enter(fsm: StateMachine, from?: State) {
        this.menuSettings = this.settings as MenuSettings;
        this.fillGrid();
        await this.menuSettings.renderer.overlay.setAsCurrent(this.menuSettings.layout, true);
        this.enableInput(fsm);
    }

    private fillGrid() {
        const grid = this.menuSettings.layout.find('MenuGrid') as Grid<Container>;
        grid.clear();

		let index = 0;

		const options = setting.getSettings();
		const settingList = Object.keys(options);

		const array: { key: string, settings: setting.Settings }[] = [];

		let index2 = 0;
		for(let key of settingList) {
			const value = options[key];
			array[index2] = {
				key,
				settings: value
			};
			index2++;
		}

		grid.setGrid(1, settingList.length , (x, y) => {

			const container = grid.layout.createContainer({
				name: `container-${y}`,
				rotation: 0,
				position: [0, 0],
				scale: [1, 1],
				type: 'container',
				anchor: [0, 0 ]
			});

			const textElement = grid.layout.createText({
				name: `menu-${y}`,
				rotation: 0,
				position: [0,0],
				scale: [0.7, 0.7],
				text: array[y].key,
				type: 'text',
				atlasText: {
					letterHeight: 60, 
					letterStyle: 'tilted',
					letterWidth: 45,
					lineWidth: 1000,
					textAppearAnimation: 'none'
				}
			});

			const positionX = textElement.getContentSize()[0] * 0.5 + 150;
			textElement.setPosition([-positionX, 0]);
			textElement.setAnchor([0, 0.5]);

			container.addChild(textElement);

			const buttonText = grid.layout.createText({
				name: `menu-${y}`,
				rotation: 0,
				position: [0,0],
				scale: [0.75, 0.75],
				text: setting.getSettingText(array[y].key),
				type: 'text',
				atlasText: {
					letterHeight: 60, 
					letterStyle: 'tilted',
					letterWidth: 45,
					lineWidth: 1000,
					textAppearAnimation: 'none'
				}
			});

			const sprite = grid.layout.createSprite({
				name: `menuSprite-${index}`,
				path: 'images/button_bg.png',
				position: [0, 0],
				rotation: 0,
				scale: [1.75 , 1.25],
				type: 'button',
				anchor: [0.5, 0.5]
			});
			const button = new Button(`menu-${index}`, grid.overlay, sprite, buttonText, grid.layout);
			button.setPosition([750, 0]);

			button.setScale(vec2.fromValues(0.75, 0.75));
            button.setAnchor([0, 1]);
            
            const key = array[y].key;

			button.onClick((x,y) => {

                setting.changeSetting(key);
                const text = setting.getSettingText(key);
                button.setText(text);

            });

			container.addChild(button);

			index++;
			return container;
		});

		console.log(grid);
    }

    public enableInput(fsm: StateMachine) {
        const button = this.menuSettings.layout.find('myButton') as Button;
        button.onClick((x, y) => {
            fsm.set(fsm.getState('MainMenu'));
        });
    }

    public disableInput(fsm: StateMachine) {
        const settings = this.settings as Settings;
        settings.layout.clickHandlers = [];
        settings.layout.releaseClickHandlers = [];
    }

    public handleInput(dt: number, keys: { [id: string]: boolean; }) {
    }

    public handleKeyPress(key: string) {
    }

    public postExit(fsm: StateMachine) {
    }

    public update(dt: number, time: number, inputDt: number) {
    }

    public onResize(size: Size) {
    }

    menuSettings: Settings;

}