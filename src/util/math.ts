import { vec2, vec3, vec4, mat4 } from 'gl-matrix';
import { Ray } from '../ray';
import { Triangle } from '../triangle';
import { Plane } from '../plane';
import { Sphere } from '../sphere';
import { AABB } from '../aabb';
import { HitInfo } from '../raycast';
import { StaticMesh } from '../mesh';
import { Vertex } from '../vertex';
import { Frustum, FrustumPlaneBit, FrustumPlane } from '../frustum';

export const DEG_TO_RAD = Math.PI / 180.0;
export const RAD_TO_DEG = 180.0 / Math.PI;
export const EPSILON = 1e-4;

export async function wait(millis: number): Promise<unknown> {
	const promise = new Promise(resolve => {
		setTimeout(() => {
			resolve(1);
		}, (millis));
	});
	return promise;
}

export function integrateEuler(y_n: vec3, derivative_Y_n: vec3, h: number) {
	const y_n_plis_1 = vec3.create();
	vec3.scaleAndAdd(y_n_plis_1, y_n, derivative_Y_n, h);
	return y_n_plis_1;
}

export function integrateRungeKutta(y_n: vec3, derivative_Y_n: vec3, h: number) {
	const k1 = derivative_Y_n;
	const k2 = integrateEuler(y_n, k1, h * 0.5);
	const k3 = integrateEuler(y_n, k2, h * 0.5);
	const k4 = integrateEuler(y_n, k3, h);

	const weightedSumK = vec3.create();
	vec3.add(weightedSumK, k1, k4);
	const k2k3 = vec3.create();
	vec3.add(k2k3, k2, k3);
	vec3.scaleAndAdd(weightedSumK, weightedSumK, k2k3, 2);
	return integrateEuler(y_n, weightedSumK, h * 1/6);
}

export function getPowerOfTwo(value: number, pow?: number) {
	let powDimension = pow || 1;
	while(powDimension < value) {
		powDimension *= 2;
	}
	return powDimension;
}

export function lerpNumber(from: number, to: number, t: number, easingFunction?: (x: number) => number) {
    const value = easingFunction ? easingFunction(t) : t;
    return value * to + (1 - value) * from;
}

export function lerpVec2(from: vec2, to: vec2, t: number, easingFunction?: (x: number) => number) {
    const value = easingFunction ? easingFunction(t) : t;
    const returnValue = vec2.create();
    vec2.set(returnValue, lerpNumber(from[0], to[0], value), lerpNumber(from[1], to[1], value));
    return returnValue;
}

export function lerpVec3(from: vec3, to: vec3, t: number, easingFunction?: (x: number) => number) {
    const value = easingFunction ? easingFunction(t) : t;
    const returnValue = vec3.create();
    vec3.set(returnValue, 
        lerpNumber(from[0], to[0], value), 
        lerpNumber(from[1], to[1], value),
        lerpNumber(from[2], to[2], value));
    return returnValue;
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
		solution.x1 = temp;
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

export function getX(matrix: mat4) {
	return vec3.fromValues(matrix[0], matrix[1], matrix[2]);
}

export function getY(matrix: mat4) {
	return vec3.fromValues(matrix[4], matrix[5], matrix[6]);
}

export function getZ(matrix: mat4) {
	return vec3.fromValues(matrix[8], matrix[9], matrix[10]);
}

export enum IntersectionType {
	OUTSIDE,
	INTERSECTING,
	INSIDE
}

export function transformedSphereIntersectsPlane(sphere: Sphere, plane: Plane, world: mat4) {

	const center = vec4.fromValues(sphere.center[0], sphere.center[1], sphere.center[2], 1);
	vec4.transformMat4(center, center, world);
	const planeEq = plane.A * center[0] + plane.B * center[1] + plane.C * center[2] +
	plane.D;

	if(planeEq <= -sphere.radius) {
		return IntersectionType.OUTSIDE;
	}

	if(planeEq >= sphere.radius) {
		return IntersectionType.INSIDE;
	}

	return IntersectionType.INTERSECTING;
}

export function sphereIntersectsPlane(sphere: Sphere, plane: Plane) {

	const planeEq = plane.A * sphere.center[0] + plane.B * sphere.center[1] + 
	plane.C * sphere.center[2] + plane.D;

	if(planeEq <= -sphere.radius) {
		return IntersectionType.OUTSIDE;
	}

	if(planeEq >= sphere.radius) {
		return IntersectionType.INSIDE;
	}

	return IntersectionType.INTERSECTING;
}

export function sphereIntersectsFrustum(frustum: Frustum, sphere: Sphere, planeBits: number) {

	let bits = planeBits;
	let intersecting = false;

	for(let index = 0; index < 6; index++) {

		const planeBit = 1 << index;

		if(!(bits & planeBit)) {
			const result = sphereIntersectsPlane(sphere, frustum.planes[index]);

			if(result === IntersectionType.OUTSIDE) {
				return {
					intersection: IntersectionType.OUTSIDE,
					planeBits: bits
				};
			} else if(result === IntersectionType.INTERSECTING) {
				intersecting = true;
			} else { // inside
				bits |= planeBit;

				if(bits === FrustumPlaneBit.ALL) {
					return {
						intersection: IntersectionType.INSIDE,
						planeBits: bits
					};
				}
			}
		}
	}

	if(intersecting) {
		return {
			intersection: IntersectionType.INTERSECTING,
			planeBits: bits
		};
	} else {
		return {
			intersection: IntersectionType.INSIDE,
			planeBits: bits
		};
	}
}

export function planeIntersectsAABB(plane: Plane, aabb: AABB) {
	let maxExtent = 0; 
	for(let i = 0; i < 3; i++) {
		maxExtent += aabb.extents[i] * Math.abs(plane.normal[i]); 
	}

	const s = vec3.dot(plane.normal, aabb.center) + vec3.dot(plane.normal, plane.p0);

	if(s - maxExtent > 0) {
		return IntersectionType.OUTSIDE;
	}
	if(s + maxExtent < 0) {
		return IntersectionType.INSIDE;
	}
	return IntersectionType.INTERSECTING;
}

export function AABBIntersectsFrustum(frustum: Frustum, aabb: AABB, planeBits: number) {

	let bits = planeBits;
	let intersecting = false;

	if(!(bits & FrustumPlaneBit.LEFT)) {

		const result = planeIntersectsAABB(frustum.planes[FrustumPlane.LEFT], aabb);

		if(result === IntersectionType.OUTSIDE) {
			return {
				intersection: IntersectionType.OUTSIDE,
				planeBits: bits 
			};
		} else if(result === IntersectionType.INTERSECTING) {
			intersecting = true;
		} else { // INSIDE
			bits = bits |= FrustumPlaneBit.LEFT;

			if(bits === FrustumPlaneBit.ALL) {
				return {
					intersection: IntersectionType.INSIDE,
					planeBits: bits
				};
			}
		}
	}

	if(!(bits & FrustumPlaneBit.RIGHT)) {
		
		const result = planeIntersectsAABB(frustum.planes[FrustumPlane.RIGHT], aabb);
		
		if(result === IntersectionType.OUTSIDE) {
			return {
				intersection: IntersectionType.OUTSIDE,
				planeBits: bits
			};
		} else if(result === IntersectionType.INTERSECTING) {
			intersecting = true;
		} else { // INSIDE
			bits = bits |= FrustumPlaneBit.RIGHT;

			if(bits === FrustumPlaneBit.ALL) {
				return {
					intersection: IntersectionType.INSIDE,
					planeBits: bits
				};
			}
		}
	}

	if(!(bits & FrustumPlaneBit.BOTTOM)) {
		
		const result = planeIntersectsAABB(frustum.planes[FrustumPlane.BOTTOM], aabb);

		if(result === IntersectionType.OUTSIDE) {
			return {
				intersection: IntersectionType.OUTSIDE,
				planeBits: bits
			};
		} else if(result === IntersectionType.INTERSECTING) {
			intersecting = true;
		} else { // INSIDE
			bits = bits |= FrustumPlaneBit.BOTTOM;

			if(bits === FrustumPlaneBit.ALL) {
				return {
					intersection: IntersectionType.INSIDE,
					planeBits: bits
				};
			}
		}
	}

	if(!(bits & FrustumPlaneBit.TOP)) {
		
		const result = planeIntersectsAABB(frustum.planes[FrustumPlane.TOP], aabb);

		if(result === IntersectionType.OUTSIDE) {
			return {
				intersection: IntersectionType.OUTSIDE,
				planeBits: bits
			};
		} else if(result === IntersectionType.INTERSECTING) {
			intersecting = true;
		} else { // INSIDE
			bits = bits |= FrustumPlaneBit.TOP;

			if(bits === FrustumPlaneBit.ALL) {
				return {
					intersection: IntersectionType.INSIDE,
					planeBits: bits
				};
			}
		}
	}

	if(!(bits & FrustumPlaneBit.NEAR)) {

		const result = planeIntersectsAABB(frustum.planes[FrustumPlane.NEAR], aabb);

		if(result === IntersectionType.OUTSIDE) {
			return {
				intersection: IntersectionType.OUTSIDE,
				planeBits: bits
			};
		} else if(result === IntersectionType.INTERSECTING) {
			intersecting = true;
		} else { // INSIDE
			bits = bits |= FrustumPlaneBit.NEAR;

			if(bits === FrustumPlaneBit.ALL) {
				return {
					intersection: IntersectionType.INSIDE,
					planeBits: bits
				};
			}
		}
	}

	if(!(bits & FrustumPlaneBit.FAR)) {

		const result = planeIntersectsAABB(frustum.planes[FrustumPlane.FAR], aabb);

		if(result === IntersectionType.OUTSIDE) {
			return {
				intersection: IntersectionType.OUTSIDE,
				planeBits: bits
			};
		} else if(result === IntersectionType.INTERSECTING) {
			intersecting = true;
		} else { // INSIDE
			bits = bits |= FrustumPlaneBit.FAR;

			if(bits === FrustumPlaneBit.ALL) {
				return {
					intersection: IntersectionType.INSIDE,
					planeBits: bits
				};
			}
		}
	}

	if(intersecting) {
		return {
			intersection: IntersectionType.INTERSECTING,
			planeBits: bits
		};
	} else {
		return {
			intersection: IntersectionType.INSIDE,
			planeBits: bits
		};
	}

}
