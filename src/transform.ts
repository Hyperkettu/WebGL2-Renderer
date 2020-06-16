import { mat4, quat, vec3 } from 'gl-matrix';
import { Component } from './component';
import { SceneNode } from './scenenode';

export class Transform extends Component {

	constructor(owner: SceneNode) {
		super(owner);
		this.position = vec3.fromValues(0, 0, 0);
		this.eulerAngles = vec3.fromValues(0, 0, 0);
		this.scale = vec3.fromValues(1, 1, 1);
		this.rotation = quat.create();

		this.localMatrix = mat4.create();
		this.world = mat4.create();

		this.localId = 0;

		this.Compose(Transform.IDENTITY);
		this.type = 'transform';

	}

	rotate(eulerAngles: vec3) {
		quat.fromEuler(this.rotation, eulerAngles[0], eulerAngles[1], eulerAngles[2]);
		this.localId++;
	}

	setPosition(x: number, y: number, z: number) {
		this.position = vec3.fromValues(x, y, z);
		this.localId++;
	}

	setRotation(x: number, y: number, z: number) {
		this.eulerAngles = vec3.fromValues(x, y, z);
		quat.fromEuler(this.rotation, x, y, z);
		this.localId++;
	}

	Compose(parentWorld: mat4) {
		mat4.fromRotationTranslationScale(this.localMatrix, this.rotation, this.position, this.scale);
		mat4.multiply(this.world, parentWorld, this.localMatrix);
	}

	position: vec3;
	eulerAngles: vec3;
	scale: vec3;

	rotation: quat;
	world: mat4;
	localMatrix: mat4;

	localId: number;

	static IDENTITY: mat4 = mat4.create();
}