import { vec2, vec3 } from 'gl-matrix';

export class AABB {
	constructor(min: vec3, max: vec3) {
		this.min = min;
		this.max = max;

		this.bounds = [];

		this.bounds[0] = min;
		this.bounds[1] = max;

		this.center = vec3.create();
		this.extents = vec3.create();

		vec3.add(this.center, this.min, this.max);
		this.center[0] = this.center[0] * 0.5;
		this.center[1] = this.center[1] * 0.5;
		this.center[2] = this.center[2] * 0.5;

		vec3.sub(this.extents, this.max, this.min);
		this.extents[0] = this.extents[0] * 0.5;
		this.extents[1] = this.extents[1] * 0.5;
		this.extents[2] = this.extents[2] * 0.5;
	}

	center: vec3;
	extents: vec3;

	bounds: vec3[];

	min: vec3;
	max: vec3;
}