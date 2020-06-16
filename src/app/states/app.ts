import { Renderer } from '../../glrenderer';
import { StateMachine, State } from '../statemachine';
import { SettingsState } from './settings';

export interface AppConfig {
    initSceneFilePath: string;
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
        this.currentState = new SettingsState({
            renderer: this.renderer
         });
        this.stateMachine.addState(this.currentState);
        this.registerInput();
        await this.renderer.Load(['scenes/testscene.json']);
        await this.stateMachine.set(this.currentState);
    }

    start() {

        let dt = 0;
        let inputDt = 0;
    
        const update = (time: number, dt: number) => {
            this.currentState = this.stateMachine.getActiveState();
            if(this.currentState) {
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
            this.renderer.renderCurrentScene();
    
            requestAnimationFrame(frameUpdate);
        };
        requestAnimationFrame(frameUpdate);
    }

    private registerInput() {
        document.addEventListener('keydown', event => {
            if (event.key === 'p') {
                this.paused = !this.paused;
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
}

