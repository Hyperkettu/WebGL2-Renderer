import { Application } from './app/states/app';

let app: Application = null;

export async function main() {

	app = new Application({ initSceneFilePath: 'scenes/testscene.json' });
	await app.init();
	app.start();

}

