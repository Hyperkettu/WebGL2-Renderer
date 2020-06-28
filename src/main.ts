import { Application } from './app/states/app';

let app: Application = null;

export async function main() {

	app = new Application({ 
		initSceneFilePath: 'scenes/testscene.json', 
		mainMenuLayout: 'layouts/main.json',
		layouts: [
			'layouts/settings.json'
		]
	});
	await app.init();
	app.start();

}

