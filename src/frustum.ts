import { Plane } from "./plane";
import { mat4, vec3 } from "gl-matrix";
import * as math from './util/math';
import { Sphere } from "./sphere";
import { AABB } from './aabb';

export enum FrustumPlane {
    LEFT, 
    RIGHT,
    BOTTOM, 
    TOP, 
    NEAR, 
    FAR
}

export enum FrustumPlaneBit {
    LEFT = 1 << 0,
    RIGHT = 1 << 1, 
    BOTTOM = 1 << 2,
    TOP = 1 << 3,
    NEAR = 1 << 4,
    FAR = 1 << 5,
    ALL = LEFT | RIGHT | BOTTOM | TOP | NEAR | FAR
}

export class Frustum {
    constructor() {
        this.planes = [];
        this.viewProjection = mat4.create();

        for(let index = 0; index < 6; index++) {
            this.planes[index] = new Plane(vec3.fromValues(0,0,0), vec3.fromValues(0,0,0));
        }
    }

    update(projection: mat4, view: mat4) {
        mat4.multiply(this.viewProjection, projection, view);

        this.planes[FrustumPlane.LEFT].A = this.viewProjection[3] - this.viewProjection[0];
        this.planes[FrustumPlane.LEFT].B = this.viewProjection[7] - this.viewProjection[4];
        this.planes[FrustumPlane.LEFT].C = this.viewProjection[11] - this.viewProjection[8];
        this.planes[FrustumPlane.LEFT].D = this.viewProjection[15] - this.viewProjection[12];

        this.normalizePlane(FrustumPlane.LEFT);

        this.planes[FrustumPlane.RIGHT].A = this.viewProjection[3] - this.viewProjection[0];
        this.planes[FrustumPlane.RIGHT].B = this.viewProjection[7] - this.viewProjection[4];
        this.planes[FrustumPlane.RIGHT].C = this.viewProjection[11] - this.viewProjection[8];
        this.planes[FrustumPlane.RIGHT].D = this.viewProjection[15] - this.viewProjection[12];

        this.normalizePlane(FrustumPlane.RIGHT);

        this.planes[FrustumPlane.BOTTOM].A = this.viewProjection[3] + this.viewProjection[1];
        this.planes[FrustumPlane.BOTTOM].B = this.viewProjection[7] + this.viewProjection[5];
        this.planes[FrustumPlane.BOTTOM].C = this.viewProjection[11] + this.viewProjection[9];
        this.planes[FrustumPlane.BOTTOM].D = this.viewProjection[15] + this.viewProjection[13];

        this.normalizePlane(FrustumPlane.BOTTOM);

        this.planes[FrustumPlane.TOP].A = this.viewProjection[3] - this.viewProjection[1];
        this.planes[FrustumPlane.TOP].B = this.viewProjection[7] - this.viewProjection[5];
        this.planes[FrustumPlane.TOP].C = this.viewProjection[11] - this.viewProjection[9];
        this.planes[FrustumPlane.TOP].D = this.viewProjection[15] - this.viewProjection[13];

        this.normalizePlane(FrustumPlane.TOP);

        this.planes[FrustumPlane.NEAR].A = this.viewProjection[3] + this.viewProjection[2];
        this.planes[FrustumPlane.NEAR].B = this.viewProjection[7] + this.viewProjection[6];
        this.planes[FrustumPlane.NEAR].C = this.viewProjection[11] + this.viewProjection[10];
        this.planes[FrustumPlane.NEAR].D = this.viewProjection[15] + this.viewProjection[14];

        this.normalizePlane(FrustumPlane.NEAR);

        this.planes[FrustumPlane.FAR].A = this.viewProjection[3] - this.viewProjection[2];
        this.planes[FrustumPlane.FAR].B = this.viewProjection[7] - this.viewProjection[6];
        this.planes[FrustumPlane.FAR].C = this.viewProjection[11] - this.viewProjection[10];
        this.planes[FrustumPlane.FAR].D = this.viewProjection[15] - this.viewProjection[14];

        this.normalizePlane(FrustumPlane.FAR);
    }

    normalizePlane(index: FrustumPlane) {
        const magnitude = Math.sqrt(this.planes[index].A * this.planes[index].A + 
            this.planes[index].B * this.planes[index].B +
            this.planes[index].C * this.planes[index].C);
        this.planes[index].A /= magnitude;
        this.planes[index].B /= magnitude;
        this.planes[index].C /= magnitude;
        this.planes[index].D /= magnitude;
    }

    intersectsSphere(sphere: Sphere, planeBits: number) {
        return math.sphereIntersectsFrustum(this, sphere, planeBits);
    }

    intersectsAABB(aabb: AABB, world: mat4, planeBits: number) {
        return math.AABBIntersectsFrustum(this, aabb, planeBits);
    }

    viewProjection: mat4;
    planes: Plane[];
}