import { vec3 } from 'gl-matrix';
import { Camera } from './camera';
import { Viewport } from './context';
import { Ray } from './ray';
import * as math from './util';
import { Triangle } from './triangle';
import { Sphere } from './sphere';
import { AABB } from './aabb';
import { SceneGraph } from './scenegraph';
import { MeshComponent } from './meshcomponent';
import { SceneNode } from './scenenode';

export type HitPolicy = 'any' | 'closest';

export class Picker {

	constructor(viewport: Viewport, hitPolicy: HitPolicy) {
		this.viewport = viewport;
		this.hitPolicy = hitPolicy;
		this.pickerRadius = 1;
		this.distance = Infinity;

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

	castRay(camera: Camera, x: number, y: number, world: SceneGraph) {
		
		const hitInfo = new HitInfo();
		hitInfo.hit = false;
		const ray = this.generateScreenRayFromCamera(camera, x, y);

		const setAttributes = (node: SceneNode, info: HitInfo) => {
			hitInfo.hitObject = node;
			hitInfo.hit = true;
			hitInfo.hitPoint = info.hitPoint;
			hitInfo.normal = info.normal;
		};

		world.forEach(node => {

			const meshComponent = node.getComponent('meshComponent') as MeshComponent;
			if(meshComponent && meshComponent.mesh) {
				const info = new HitInfo();
				for(let index = 0 ; index < meshComponent.mesh.getTriangleCount(); index++) {
					if(math.rayInterectsTriangle(ray, meshComponent.mesh.getTriangle(index), info)) {

						if(this.hitPolicy === 'any') {
							setAttributes(node, info);
							return hitInfo;
						} else if(this.hitPolicy === 'closest') {
							const distance = vec3.distance(info.hitPoint, camera.position);
							if(distance < this.distance) {
								this.distance = distance;
								setAttributes(node, info);
							}
						}
					}
				}
			}
		});
		return hitInfo;
	}


	pickerRadius: number;
	hitPolicy: 'any' | 'closest';

	distance: number;
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
	hitObject: SceneNode;
}