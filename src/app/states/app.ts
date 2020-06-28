import { Renderer } from '../../glrenderer';
import { StateMachine, State } from '../statemachine';
import { SettingsState } from './settingsstate';
import { MainMenuState } from './mainmenustate';
import { MenuSettings } from './menustate';

export interface AppConfig {
    initSceneFilePath: string;
    mainMenuLayout: string;
    layouts: string[];
}

export class Application {
    constructor(config: AppConfig) {
        this.config = config;
        this.canvas = this.createCanvas();
        document.body.appendChild(this.canvas);
        this.renderer = new Renderer(this.canvas);
    }

    async init() {
        this.paused = false;
        this.stateMachine = new StateMachine();

         const resources = {
            scenePaths: [
                this.config.initSceneFilePath
            ],
            layouts: [
                this.config.mainMenuLayout, ...
                this.config.layouts
            ]
         };

        await this.renderer.Load(resources);
        this.stateMachine.addState(new MainMenuState('MainMenu', {
            renderer: this.renderer,
            layout: this.renderer.getLayout(this.config.mainMenuLayout),
            mouseMoveCamera: true,
            scene: this.renderer.currentScene
        }));
        this.stateMachine.addState(new SettingsState('Settings', {
            renderer: this.renderer,
            layout: this.renderer.getLayout('layouts/settings.json'),
            mouseMoveCamera: true
        }));

        this.currentState = this.stateMachine.getState('MainMenu');

        this.keys = {};

        this.registerInput();

        await this.stateMachine.set(this.currentState);
    }

    start() {

        let dt = 0;
        let inputDt = 0;
    
        const update = (time: number, dt: number) => {
            this.currentState = this.stateMachine.getActiveState();
            if(this.currentState) {
                this.currentState.handleInput(inputDt, this.keys);
                this.currentState.update(dt, time, inputDt);
            }
            this.renderer.currentScene.update(dt);
        };
    
        let timeLastFrame = performance.now();
    
        const frameUpdate = (time: number) => {
            dt = (performance.now() - timeLastFrame) * 0.001;
            inputDt = dt;
            timeLastFrame = performance.now();
    
            if (this.paused) {
                dt = 0;
            }
            update(time, dt);
    
            this.renderer.reset();
            this.renderer.renderCurrentScene(time, dt);
    
            requestAnimationFrame(frameUpdate);
        };
        requestAnimationFrame(frameUpdate);
    }

    private keyDown(key: string) {
        this.keys[key] = true;
    }

    private keyUp(key: string) {
        this.keys[key] = false;
    }

    private registerInput() {
        document.addEventListener('keydown', event => {
            if (event.key === 'p') {
                this.paused = !this.paused;
            }
            this.keyDown(event.key);
        });

        document.addEventListener('keyup', event => {
            this.keyUp(event.key);
        });

        document.addEventListener('mousedown', event => {
            const settings = this.currentState.settings as MenuSettings;
            console.log(settings.layout.clickHandlers.length);
            for(let onClick of settings.layout.clickHandlers){
                if(onClick(event.x, event.y)) {
                    return; 
                }
            }
        });

        document.addEventListener('mouseup', event => {
            const settings = this.currentState.settings as MenuSettings;
            for(let onRelease of settings.layout.releaseClickHandlers){
                onRelease(event.x, event.y);
            }
        });

        document.addEventListener('mousemove', event => {

			if (this.currentState.settings.mouseMoveCamera) {
				const sensitivy = 0.5;
				const deltaX = event.movementX * sensitivy;
				const deltaY = event.movementY * sensitivy;

				const camera = this.renderer.getCurrentCamera();
				camera.rotateY(-deltaX);
				camera.rotateX(-deltaY);
			}
		});
    }

    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.left = '0px';
        canvas.style.top = '0px';
        canvas.style.border = '0px';
        canvas.style.padding = '0px';
        canvas.style.margin = '0px';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        return canvas;
    }

    config: AppConfig;

    canvas: HTMLCanvasElement;
    renderer: Renderer;

    stateMachine: StateMachine;
    currentState: State;

    paused: boolean;

    keys: { [id: string]: boolean };
}

