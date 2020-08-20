import { vec3 } from 'gl-matrix';

export class Plane {
	constructor(p0: vec3, normal: vec3) {
		this.p0 = p0;
		this.normal = normal;

		vec3.normalize(this.normal, this.normal);
	}

	normal: vec3;
	p0: vec3;

	A: number;
	B: number;
	C: number;
	D: number;
}