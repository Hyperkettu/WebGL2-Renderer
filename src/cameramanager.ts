import { Camera } from './camera';
import { vec3 } from 'gl-matrix';
import { DEG_TO_RAD } from './util/math';

interface CameraSettings {
	fovY: number;
	nearZ: number;
	farZ: number;
}

const DEFAULT_SETTINGS = {

	fovY: 45.0,
	nearZ: 0.1,
	farZ: 2000

};

const cameras: { [id: string]: Camera } = {};

export function GetCamera(name: string) {
	return cameras[name];
}

function AddCamera(name: string, settings: CameraSettings) {

	const camera = new Camera();
	camera.setPerspective(settings.fovY, window.innerWidth / window.innerHeight, settings.nearZ, settings.farZ);
	camera.setPosition(0, 0, 0);
	camera.setRotation(0, 0, 0);
	cameras[name] = camera;

}

export function AddCameras() {
	AddCamera('default', DEFAULT_SETTINGS);
}