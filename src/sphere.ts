import { vec3 } from 'gl-matrix';

export class Sphere {
	constructor(center: vec3, radius: number) {
		this.center = center;
		this.radius = radius;
	}

	center: vec3;
	radius: number;
}