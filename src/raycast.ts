import { vec3 } from 'gl-matrix';
import { Camera } from './camera';
import { Viewport } from './context';
import { Ray } from './ray';
import { Plane } from './plane';
import * as math from './util';
import { Triangle } from './triangle';
import { Sphere } from './sphere';
import { AABB } from './aabb';

export class Picker {

	constructor(viewport: Viewport) {
		this.viewport = viewport;

		this.triangle = new Triangle(
			vec3.fromValues(-5, 0, -5),
			vec3.fromValues(5, 0, -5),
			vec3.fromValues(5, 0, 5));

		this.sphere = new Sphere(vec3.fromValues(5, 0, 5), 5);

		this.aabb = new AABB(vec3.fromValues(-5, -5, -5), vec3.fromValues(5, 5, 5));
	}

	generateScreenRayFromCamera(camera: Camera, x: number, y: number) {

		const pointNear = vec3.fromValues(x, y, 0);
		const pointFar = vec3.fromValues(x, y, 1);
		const near = camera.unproject(this.viewport, pointNear);
		const far = camera.unproject(this.viewport, pointFar);

		const rayDir = vec3.create();
		vec3.sub(rayDir, far, near);
		vec3.normalize(rayDir, rayDir);

		return new Ray(camera.position, rayDir);
	}

	castRay(camera: Camera, x: number, y: number) {

		const ray = this.generateScreenRayFromCamera(camera, x, y);

		const hitInfo = new HitInfo();

		math.rayIntersectsAABB(ray, this.aabb, hitInfo);
		//math.rayIntersectsSphere(ray, this.sphere, hitInfo);
		//	math.rayInterectsTriangle(ray, this.triangle, hitInfo);

		/*console.log('ray', ray, 'plane', plane, 'hitInfo', hitInfo);

		if (math.rayIntersectsPlane(ray, plane, hitInfo)) {

		}*/
		return hitInfo;
	}
	aabb: AABB;
	sphere: Sphere;
	triangle: Triangle;
	viewport: Viewport;
}

export class HitInfo {
	constructor() {
		this.hit = false;
	}
	hitPoint: vec3;
	hit: boolean;
	normal: vec3;
}