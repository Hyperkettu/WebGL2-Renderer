import { vec2, mat3, mat4 } from 'gl-matrix';
import { Transform } from './transform';

export class Container {

	constructor() {
		this.position = vec2.fromValues(0, 0);
		this.rotation = 0;
		this.scale = vec2.fromValues(1, 1);
		this.pivot = vec2.fromValues(0, 0);
		this.negPivot = vec2.fromValues(0, 0);
		this.zOrder = 0;
		this.alpha = 1;
		this.parent = null;
		this.children = [];
		this.name = 'container';
		this.visible = true;

		this.localTransform = mat3.create();
		this.worldTransform = mat3.create();

		this.localID = 0;
		this.currentLocalID = 0;

		this.worldID = 0;
		this.parentID = 0;
	}

	setPosition(x: number, y: number) {
		this.position = vec2.fromValues(x, y);
		this.localID++;
	}

	setPivot(x: number, y: number) {
		this.pivot = vec2.fromValues(x, y);
		this.negPivot = vec2.fromValues(-x, -y);
		this.localID++;
	}

	setScale(x: number, y: number) {
		this.scale = vec2.fromValues(x, y);
		this.localID++;
	}

	setRotation(angle: number) {
		if (this.rotation !== angle) {
			this.rotation = angle;
			this.localID++;
		}
	}

	updateWorldTransform(parent: Container) {

		const updated = this.updateLocalTransform();

		if (updated) {
			// force an update..
			this.parentID = -1;
		}

		if (this.parentID !== parent.worldID) {

			mat3.multiply(this.worldTransform, parent.worldTransform, this.localTransform);
			this.parentID = parent.worldID;
			this.worldID++;
		}

	}

	updateRootTransform() {

		const updated = this.updateLocalTransform();

		if (updated) {
			mat3.copy(this.worldTransform, this.localTransform);
			this.worldID++;
		}
	}

	updateLocalTransform() {

		if (this.localID !== this.currentLocalID) {
			this.currentLocalID = this.localID;

			mat3.copy(this.localTransform, Transform.IDENTITY);

			mat3.translate(
				this.localTransform,
				this.localTransform,
				this.position
			);

			mat3.rotate(
				this.localTransform,
				this.localTransform,
				this.rotation
			);

			mat3.translate(
				this.localTransform,
				this.localTransform,
				this.negPivot
			);

			mat3.scale(
				this.localTransform,
				this.localTransform,
				this.scale
			);

			return true;
		}

		return false;

	}

	render(gl: WebGLRenderingContext) {

	}

	update(dt: number) {
		//	this.setRotation(this.rotation + 0.1 * dt);
		//this.setPosition(x, y);
	}

	addChild(child: Container) {
		this.children.push(child);
		child.parent = this;
	}

	removeChild(child: Container) {
		this.children.splice(this.children.indexOf(child), 1);
		child.parent = null;
	}

	position: vec2;
	rotation: number;
	scale: vec2;

	pivot: vec2;
	negPivot: vec2;
	zOrder: number;

	alpha: number;

	parent: Container;
	children: Array<Container>;
	name: string;
	visible: boolean;
	localTransform: mat3;
	worldTransform: mat3;

	localID: number;
	currentLocalID: number;
	worldID: number;
	parentID: number;
}