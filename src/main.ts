import { Renderer } from './glrenderer';
import { TestScene } from './testscene';
import * as settings from './settings';
import { StateMachine } from './app/statemachine';
import { SettingsState } from './app/states/settings';
import { createCanvas } from './app/util';
import { Application } from './app/states/app';

let app: Application = null;

//let renderer: Renderer = null;

//let paused = false;

export async function main() {
	//const canvas = createCanvas();
	//document.body.appendChild(canvas);
	//renderer = new Renderer(canvas);

	app = new Application({ initSceneFilePath: 'scenes/testscene.json' });
	await app.init();
	app.start();

/*	document.addEventListener('keydown', event => {
		if (event.key === 'p') {
			paused = !paused;
		}
	});*/

	//await renderer.Load(['scenes/testscene.json']);

	//let dt = 0;
	//let inputDt = 0;

	/*function loop(time: number, dt: number) {
		//	currentState.update(dt, time, inputDt);

		renderer.currentScene.update(dt);
	}

	let timeLastFrame = performance.now();

	const frame = (time: number) => {
		dt = (performance.now() - timeLastFrame) * 0.001;
		inputDt = dt;
		timeLastFrame = performance.now();

		if (paused) {
			dt = 0;
		}

		loop(time, dt);

		renderer.reset();
		renderer.renderCurrentScene();


		requestAnimationFrame(frame);
	};
	requestAnimationFrame(frame);*/
}

