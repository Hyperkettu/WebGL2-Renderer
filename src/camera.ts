import { mat4, vec4, vec3, vec2, quat } from 'gl-matrix';
import { DEG_TO_RAD } from './util';
import { Viewport } from './context';
import * as math from './util';

export class Camera {

	constructor() {

		this.position = vec3.create();
		this.target = vec3.create();

		this.view = mat4.create();
		this.projection = mat4.create();

		this.quat = quat.create();

		this.forward = vec3.create();
		this.up = vec3.create();
		this.right = vec3.create();
		this.worldUp = vec3.fromValues(0, 1, 0);

		this.setRotation(0, 90, 0);

		this.updateBaseVectors();
	}

	setPerspective(fovY: number, aspectRatio: number, nearZ: number, farZ: number) {
		this.fovY = fovY;
		this.aspectRatio = aspectRatio;
		this.nearZ = nearZ;
		this.farZ = farZ;
		this.isPerspective = true;
		mat4.perspective(this.projection, this.fovY * DEG_TO_RAD, this.aspectRatio, this.nearZ, this.farZ);
	}

	setOrthographic(left: number, right: number, bottom: number, top: number, nearZ: number, farZ: number) {
		this.nearZ = nearZ;
		this.farZ = farZ;
		this.leftX = left;
		this.rightX = right;
		this.bottomY = bottom;
		this.topY = top;
		this.isPerspective = false;
		mat4.ortho(this.projection, left, right, bottom, top, nearZ, farZ);
	}

	setView() {
		const cameraMatrix = mat4.fromRotationTranslation(this.view, this.quat, this.position);
		mat4.invert(this.view, cameraMatrix);
	}

	setRotation(x: number, y: number, z: number) {
		this.yaw = z;
		this.pitch = y;
		this.roll = x;
		quat.fromEuler(this.quat, x, y, z);
		this.setView();
		this.updateBaseVectors();
	}

	lookAt(eye: vec3, center: vec3, up: vec3) {
		mat4.lookAt(this.view, eye, center, up);
	}


	rotateY(angle: number) {
		this.pitch += angle;
		this.setRotation(this.roll, this.pitch, this.yaw);
	}

	rotateX(angle: number) {
		this.roll += angle;
		this.setRotation(this.roll, this.pitch, this.yaw);
	}
	rotateZ(angle: number) {
		this.yaw += angle;
		this.setRotation(this.roll, this.pitch, this.yaw);
	}

	setPosition(x: number, y: number, z: number) {
		vec3.set(this.position, x, y, z);
		this.setView();
	}

	moveForward(delta: number) {
		vec3.scaleAndAdd(this.position, this.position, this.forward, -delta);
		this.setView();

	}

	moveRight(delta: number) {
		vec3.scaleAndAdd(this.position, this.position, this.right, -delta);
		this.setView();

	}

	moveUp(delta: number) {
		vec3.scaleAndAdd(this.position, this.position, this.up, delta);
		this.setView();
	}

	updateBaseVectors() {
		const x = this.quat[0];
		const y = this.quat[1];
		const z = this.quat[2];
		const w = this.quat[3];

		const x2 = 2.0 * x;
		const y2 = 2.0 * y;
		const z2 = 2.0 * z;
		const w2 = 2.0 * w;
		const x2w = x2 * w;
		const y2w = y2 * w;
		const x2x = x2 * x;
		const z2x = z2 * x;
		const y2y = y2 * y;
		const z2y = z2 * y;
		this.forward = vec3.fromValues(z2x + y2w, z2y - x2w, 1.0 - (x2x + y2y));

		vec3.normalize(this.forward, this.forward);

		vec3.cross(this.right, this.forward, this.worldUp);
		vec3.normalize(this.right, this.right);

		vec3.cross(this.up, this.right, this.forward);
		vec3.normalize(this.up, this.up);
	}

	unproject(viewport: Viewport, point: vec3) {

		const screen = vec4.fromValues(point[0] / viewport.width, point[1] / viewport.height, point[2], 1);
		screen[0] = screen[0] * 2 - 1;
		screen[1] = screen[1] * 2 - 1;
		screen[2] = screen[2] * 2 - 1;

		const viewProjInv = mat4.create();
		mat4.multiply(viewProjInv, this.projection, this.view);
		mat4.invert(viewProjInv, viewProjInv);
		vec4.transformMat4(screen, screen, viewProjInv);
		return math.mapToCartesian(screen);
	}

	project(viewport: Viewport, worldPoint: vec3) {

		const projectorMatrix = mat4.create();
		mat4.multiply(projectorMatrix, this.projection, this.view);

		const clipPosition = vec4.fromValues(worldPoint[0], worldPoint[1], worldPoint[2], 1);
		vec4.transformMat4(clipPosition, clipPosition, projectorMatrix);

		const w = clipPosition[3];
		const ndcX = clipPosition[0] / w;
		const ndcY = clipPosition[1] / w;

		const x = (ndcX + 1) * 0.5 * viewport.width + viewport.x;
		const y = (ndcY + 1) * 0.5 * viewport.height + viewport.y;
		return vec2.fromValues(Math.round(x), Math.round(y));
	}

	forward: vec3;
	right: vec3;
	up: vec3;
	worldUp: vec3;

	roll: number;
	pitch: number;
	yaw: number;

	position: vec3;
	quat: quat;
	target: vec3;

	fovY: number;
	aspectRatio: number;
	nearZ: number;
	farZ: number;

	view: mat4;
	projection: mat4;

	isPerspective: boolean;

	leftX: number;
	rightX: number;
	topY: number;
	bottomY: number;

}