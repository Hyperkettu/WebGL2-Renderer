import { mat4, vec3, vec4 } from 'gl-matrix';
import { AABB } from './aabb';
import { Frustum } from './frustum';
import { Ray } from './ray';
import { HitInfo } from './raycast';
import { BoundingVolume } from './util/bvh/boundingvolume';
import { VertexBase } from './vertex';

export class Sphere extends BoundingVolume {

	constructor(center: vec3, radius: number) {
		super();
		this.center = center;
		this.radius = radius;
	}

	create(gl: WebGL2RenderingContext, vertices: VertexBase[]) {
	}

	render(gl: WebGL2RenderingContext) {

	}

	static merge(spheres: Sphere[]) {

		const centerOfMergedSphere = Sphere.findCenterForSpheres(spheres);
		let radius = 0;

		for(let sphere of spheres) {
			const distanceBetweenCenters = vec3.distance(centerOfMergedSphere, sphere.center);
			if(radius < distanceBetweenCenters + sphere.radius) {
				radius = distanceBetweenCenters + sphere.radius;
			}
		}
		return new Sphere(centerOfMergedSphere, radius);
	}

	private static findCenterForSpheres(spheres: Sphere[]) {

		let aabb = new AABB(vec3.fromValues(0,0,0),
			vec3.fromValues(0,0,0));

		for(let sphere of spheres) {
			aabb = aabb.merge(sphere.getAABB());
		}

		return aabb.center;
	}

	public getAABB() {

		const min = vec3.fromValues(this.center[0] - this.radius, 
			this.center[1] - this.radius, this.center[2] - this.radius);

		const max = vec3.fromValues(this.center[0] + this.radius, 
			this.center[1] + this.radius, this.center[2] + this.radius);

		const aabb = new AABB(min, max);
		return aabb;
	}

	public getTransformed(world: mat4) {
		const sphere = new Sphere(this.center, this.radius);
		const center = vec4.fromValues(sphere.center[0], sphere.center[1], sphere.center[2], 1);
		vec4.transformMat4(center, center, world);
		sphere.center = vec3.fromValues(center[0], center[1], center[2]);
		return sphere;
	}

	center: vec3;
	radius: number;
}