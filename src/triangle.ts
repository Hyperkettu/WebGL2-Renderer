import { vec3 } from 'gl-matrix';

export class Triangle {
	constructor(v0: vec3, v1: vec3, v2: vec3) {
		this.v0 = v0;
		this.v1 = v1;
		this.v2 = v2;

		this.alpha = -1;
		this.beta = -1;

		this.edge1 = vec3.create();
		this.edge2 = vec3.create();
		this.normal = vec3.create();

		this.computeTriangleVariables();
	}

	computeTriangleVariables() {
		const v1v0 = vec3.create();
		vec3.sub(v1v0, this.v1, this.v0);
		vec3.copy(this.edge1, v1v0);

		const v2v0 = vec3.create();
		vec3.sub(v2v0, this.v2, this.v0);
		vec3.copy(this.edge2, v2v0);

		vec3.cross(this.normal, v1v0, v2v0);

		this.area = 0.5 * vec3.length(this.normal);
		vec3.normalize(this.normal, this.normal);
	}

	barycentric(point: vec3) {

		const test = vec3.create();
		vec3.sub(test, point, this.v0);
		const d00 = vec3.dot(this.edge1, this.edge1);
		const d01 = vec3.dot(this.edge1, this.edge2);
		const d11 = vec3.dot(this.edge2, this.edge2);
		const d20 = vec3.dot(test, this.edge1);
		const d21 = vec3.dot(test, this.edge2);
		const denom = d00 * d11 - d01 * d01;

		this.alpha = (d11 * d20 - d01 * d21) / denom;
		this.beta = (d00 * d21 - d01 * d20) / denom;
		this.gamma = 1 - this.alpha - this.beta;
		console.log('alpha:', this.alpha, this.beta);

		let hit = false;
		if (this.alpha >= 0 && this.alpha <= 1 &&
			this.beta >= 0 && this.beta <= 1 && this.gamma >= 0 &&
			this.gamma <= 1) {
			hit = true;
		} else {
			return false;
		}
		return hit;
	}

	getTrianglePointByBarycentric() {
		const point = vec3.fromValues(0, 0, 0);
		vec3.scaleAndAdd(point, point, this.v0, this.gamma);
		vec3.scaleAndAdd(point, point, this.v1, this.alpha);
		vec3.scaleAndAdd(point, point, this.v2, this.beta);
		return point;
	}

	v0: vec3;
	v1: vec3;
	v2: vec3;

	edge1: vec3;
	edge2: vec3;

	area: number;

	normal: vec3;

	alpha: number;
	beta: number;
	gamma: number;
}