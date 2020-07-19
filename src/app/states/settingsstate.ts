import { MenuState, MenuSettings } from "./menustate";
import { StateMachine, State, Size } from "../statemachine";
import { Button } from "../../overlay/ui/button";
import { Grid } from "../../overlay/ui/grid";
import * as setting from '../../settings';
import { vec2 } from "gl-matrix";
import { Container } from "../../overlay/ui/container";
import { Slider } from "../../overlay/ui/slider";
import { Sprite } from "../../overlay/sprite";

export interface Settings extends MenuSettings {

}

export class SettingsState extends MenuState {

    constructor(name: string, settings: Settings) {
        super(name, settings);
        this.menuSettings = settings as MenuSettings;
        this.category = 0;
    }

    public async enter(fsm: StateMachine, from?: State) {
        this.menuSettings = this.settings as MenuSettings;
        this.fillGrids();
        await this.menuSettings.renderer.overlay.setAsCurrent(this.menuSettings.layout, true);
        this.enableInput(fsm);
    }

    private fillGrids() {
        const grid = this.menuSettings.layout.find('MenuGrid') as Grid<Container>;
        const debugGrid = this.menuSettings.layout.find('DebugMenu') as Grid<Container>;
        const sliderGrid = this.menuSettings.layout.find('SliderGrid') as Grid<Container>;

        sliderGrid.clear();

        const grids: Grid<Container>[] = [];
        grids.push(grid);
        grids.push(debugGrid);

        let category = 0;

        for(let grid of grids) {
            grid.clear();
        
            let index = 0;

            const options = this.settings.renderer.settings.getSettings(category);
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
                    text: this.settings.renderer.settings.getSettingText(array[y].key, category),
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

                const categoryIndex = category;
    
                button.onClick((x,y) => {
                    this.settings.renderer.settings.changeSetting(key, categoryIndex);
                    const text = this.settings.renderer.settings.getSettingText(key, categoryIndex);
                    button.setText(text);
                });
    
                container.addChild(button);
    
                index++;
                return container;
            }); 
            
            category++;
        }

        const valueSettings = this.settings.renderer.settings.getValueSettings();
        const valueKeys = Object.keys(valueSettings);

        sliderGrid.setGrid(1, valueKeys.length, (x, y) => {

            const container = sliderGrid.layout.createContainer({
                name: `container-${y}`,
                rotation: 0,
                position: [0, 0],
                scale: [1, 1],
                type: 'container',
                anchor: [0, 0]
            });
            const textElement = grid.layout.createText({
                name: `menu-${y}`,
                rotation: 0,
                position: [0,0],
                scale: [0.7, 0.7],
                text: valueKeys[y],
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
            textElement.setAnchor(vec2.fromValues(0, 0.5));
            container.addChild(textElement);

            const background = sliderGrid.layout.createSprite({
                name: `sliderBg-${y}`,
                path: 'images/slider_bg.png',
                position: [0, 0],
                rotation: 0,
                scale: [1 , 1],
                type: 'sprite',
                anchor: [0.5, 0.5]
            }); 

            const hold = sliderGrid.layout.createSprite({
                name: `sliderHold-${y}`,
                path: 'images/slider_hold.png',
                position: [0, 0],
                rotation: 0,
                scale: [1 , 1],
                type: 'sprite',
                anchor: [0.5, 0.5]
            }); 
            const slider = new Slider(`slider-${y}`, sliderGrid.overlay, background, hold, sliderGrid.layout);

            slider.setPosition([250, 0]);

            const valueToChange = valueKeys[y];

            slider.onDrag(value => {
                console.log(value);
                this.settings.renderer.settings.changeValue(valueToChange as setting.SettingValueType, value);
            });

            const valueLimits = this.settings.renderer.settings.getValueLimits(valueKeys[y] as setting.SettingValueType);
            const value = this.settings.renderer.settings.getSettingValue(valueKeys[y] as setting.SettingValueType);
            slider.setValues(valueLimits.min, value, valueLimits.max);

            container.addChild(slider);

            return container;
        });

    }

    public enableInput(fsm: StateMachine) {
        const button = this.menuSettings.layout.find('myButton') as Button;
        button.onClick((x, y) => {
            this.menuSettings.layout.runAnimation('MenuGrid', 'exit-1', { instant: true });
            this.menuSettings.layout.runAnimation('SliderGrid', 'exit-1', { instant: true });
            this.menuSettings.layout.runAnimation('DebugGrid', 'exit-1', { instant: true });

            fsm.set(fsm.getState('MainMenu'));
        });

        const selectCategory = this.menuSettings.layout.find('categoryButton') as Button;
        selectCategory.onClick( async (x, y) => {
            this.category = (this.category + 1) % (setting.SettingCategory.MAX_CATEGORIES + 1);

            if(this.category === setting.SettingCategory.DEBUG) {
                await this.menuSettings.layout.runAnimation('MenuGrid', 'exit-1', { instant: false });
                this.menuSettings.layout.runAnimation('DebugMenu', 'show', { instant: false });

            } else if(this.category === setting.SettingCategory.DEFAULT) {
                await this.menuSettings.layout.runAnimation('SliderGrid', 'exit-1', { instant: false });

                this.menuSettings.layout.runAnimation('MenuGrid', 'enter-1', { instant: false });
 
            } else {
                await this.menuSettings.layout.runAnimation('DebugMenu', 'exit-1', { instant: false });
                this.menuSettings.layout.runAnimation('SliderGrid', 'show', { instant: false });
            }

            
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
    category: number;

}