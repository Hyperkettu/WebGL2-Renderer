import { vec3 } from 'gl-matrix';
import { __values } from 'tslib';

export class Ray {
	constructor(origin: vec3, direction: vec3) {
		this.origin = origin;
		this.direction = direction;

		vec3.normalize(this.direction, this.direction);

		this.invDirection = vec3.fromValues(1, 1, 1);
		vec3.div(this.invDirection, this.invDirection, this.direction);

		this.sign = [];

		for (let i = 0; i < 3; i++) {
			this.sign[i] = this.invDirection[i] < 0 ? 1 : 0;
		}
	}

	get(t: number) {
		const value = vec3.create();
		vec3.scaleAndAdd(value, this.origin, this.direction, t);
		return value;
	}

	origin: vec3;
	direction: vec3;

	invDirection: vec3;
	sign: number[];
}