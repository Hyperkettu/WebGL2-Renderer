import { vec2, vec3, vec4 } from 'gl-matrix';
import { Ray } from './ray';
import { Triangle } from './triangle';
import { Plane } from './plane';
import { Sphere } from './sphere';
import { AABB } from './aabb';
import { HitInfo } from './raycast';
import { StaticMesh } from './mesh';
import { Vertex } from './vertex';

export const DEG_TO_RAD = Math.PI / 180.0;
export const RAD_TO_DEG = 180.0 / Math.PI;
export const EPSILON = 1e-4;

export async function wait(millis: number) {
	const promise = new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, (millis));
	});
	return promise;
}

export function clamp(value: number, min: number, max: number) {
	return Math.max(min, (Math.min(value, max)));
}

export function randomFloat(min: number, max: number) {
	return Math.random() * (max - min) + min;
}

export function remapVec2(point: vec2) {
	return vec2.fromValues(2 * point[0] - 1, 2 * point[1] - 1);
}

export function remapVec3(point: vec3) {
	return vec3.fromValues(2 * point[0] - 1, 2 * point[1] - 1, 2 * point[2] - 1);
}

export function remapVec4(point: vec4) {
	return vec4.fromValues(2 * point[0] - 1, 2 * point[1] - 1, 2 * point[2] - 1, 1);
}

export function mapToCartesian(point: vec4) {
	const cartesian = vec3.fromValues(point[0], point[1], point[2]);
	const w = point[3];
	if (w !== 0.0) {
		vec3.div(cartesian, cartesian, [w, w, w]);
	}
	return cartesian;
}

export function solveQuadratic(a: number, b: number, c: number, solution: { x0: number, x1: number }) {

	const discr = b * b - 4 * a * c;

	if (discr < 0) {
		return false;
	} else if (discr === 0) {
		solution.x0 = solution.x1 = - 0.5 * b / a;
	}
	else {
		const q = (b > 0) ?
			-0.5 * (b + Math.sqrt(discr)) :
			-0.5 * (b - Math.sqrt(discr));
		solution.x0 = q / a;
		solution.x1 = c / q;
	}
	if (solution.x0 > solution.x1) {
		const temp = solution.x0;
		solution.x0 = solution.x1;
		solution.x1 = temp;
	}

	return true;
}

export function rayInterectsTriangle(ray: Ray, triangle: Triangle, info: HitInfo) {

	if (rayIntersectsPlane(ray, new Plane(triangle.v0, triangle.normal), info)) {
		const hit = triangle.barycentric(info.hitPoint);
		if (hit) {
			info.hitPoint = triangle.getTrianglePointByBarycentric();
			info.hit = true;
			info.normal = triangle.normal;
			return true;
		}
	}

	info.hit = false;
	return false;
}

export function rayIntersectsPlane(ray: Ray, plane: Plane, hitInfo: HitInfo) {
	// assuming vectors are all normalized
	const denom = vec3.dot(ray.direction, plane.normal);

	if (Math.abs(denom) < EPSILON) {
		return false;
	}

	const originToPlane = vec3.create();
	vec3.sub(originToPlane, plane.p0, ray.origin);
	const t = vec3.dot(originToPlane, plane.normal) / denom;
	hitInfo.hit = t >= 0;

	if (t >= 0) {
		hitInfo.hitPoint = ray.get(t);
		hitInfo.normal = plane.normal;
		return t >= 0;
	} else {
		return false;
	}
}

export function rayIntersectsSphere(ray: Ray, sphere: Sphere, hitInfo: HitInfo) {

	const L = vec3.create();
	vec3.sub(L, ray.origin, sphere.center);
	const a = vec3.dot(ray.direction, ray.direction);
	const b = 2 * vec3.dot(ray.direction, L);
	const c = vec3.dot(L, L) - sphere.radius * sphere.radius;
	const solution: { x0: number, x1: number } = { x0: 0, x1: 0 };
	hitInfo.hit = false;
	if (!solveQuadratic(a, b, c, solution)) {
		return false;
	}

	if (solution.x0 > solution.x1) {
		const temp = solution.x0;
		solution.x0 = solution.x1;
		solution.x1 = solution.x0;
	}

	if (solution.x0 < 0) {
		solution.x0 = solution.x1; // if x0 is negative, let's use x1 instead
		if (solution.x0 < 0) {
			return false; // both t0 and t1 are negative
		}
	}

	hitInfo.hit = true;
	hitInfo.hitPoint = ray.get(solution.x0);
	const normal = vec3.create();
	vec3.sub(normal, hitInfo.hitPoint, sphere.center);
	vec3.normalize(normal, normal);
	hitInfo.normal = normal;

	return true;
}

export function rayIntersectsAABB(ray: Ray, aabb: AABB, info: HitInfo) {

	info.hit = false;
	let tmin, tmax, tymin, tymax, tzmin, tzmax;

	tmin = (aabb.bounds[ray.sign[0]][0] - ray.origin[0]) * ray.invDirection[0];
	tmax = (aabb.bounds[1 - ray.sign[0]][0] - ray.origin[0]) * ray.invDirection[0];
	tymin = (aabb.bounds[ray.sign[1]][1] - ray.origin[1]) * ray.invDirection[1];
	tymax = (aabb.bounds[1 - ray.sign[1]][1] - ray.origin[1]) * ray.invDirection[1];

	if ((tmin > tymax) || (tymin > tmax)) {
		return false;
	}
	if (tymin > tmin) {
		tmin = tymin;
	}
	if (tymax < tmax) {
		tmax = tymax;
	}

	tzmin = (aabb.bounds[ray.sign[2]][2] - ray.origin[2]) * ray.invDirection[2];
	tzmax = (aabb.bounds[1 - ray.sign[2]][2] - ray.origin[2]) * ray.invDirection[2];

	if ((tmin > tzmax) || (tzmin > tmax)) {
		return false;
	}
	if (tzmin > tmin) {
		tmin = tzmin;
	}
	if (tzmax < tmax) {
		tmax = tzmax;
	}

	info.hit = true;
	info.hitPoint = ray.get(tmin);
	info.normal = getAABBNormal(info.hitPoint, aabb);

	return true;
}

export function getAABBNormal(point: vec3, aabb: AABB) {
	let normal = vec3.fromValues(0, 0, 0);
	let minDistance = Infinity;
	const p = vec3.create();
	vec3.copy(p, point);
	vec3.sub(p, point, aabb.center);

	for (let i = 0; i < 3; ++i) {
		const distance = Math.abs(aabb.extents[i] - Math.abs(point[i]));
		if (distance < minDistance) {
			minDistance = distance;
			const cardinal = vec3.fromValues(0, 0, 0);
			cardinal[i] = 1;
			cardinal[i] = p[i] > 0 ? 1 : -1;
			normal = vec3.fromValues(cardinal[0], cardinal[1], cardinal[2]);
		}
	}
	return normal;
}

export function getMeshVerticesWithinRadius(point: vec3, radius: number, mesh: StaticMesh) {
	const vertices: Vertex[] = [];
	for(let submesh of mesh.getSubmeshes()) {
		for(let vertex of submesh.vertices) {
			if(vec3.distance(vertex.position, point) <= radius) {
				vertices.push(vertex);
			}
		}
	}
	return vertices;
}
