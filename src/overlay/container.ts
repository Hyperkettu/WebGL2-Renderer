import { vec2, vec3, mat3 } from 'gl-matrix';
import { threadId } from 'worker_threads';

export class Container {
    constructor(name: string) {
        this.position = vec2.create();
        this.angle = 0;
        this.alpha = 1;
        this.totalAlpha = 1;
        this.pivot = vec2.create();
        this.invPivot = vec2.create();
        this.anchor = vec2.create();
        this.scale = vec2.fromValues(1, 1);

        this.name = name;
        this.children = [];
        this.visible = true;
        this.parent = null;

        this.localTransform = mat3.create();
        this.worldTransform = mat3.create();

        this.localDirty = false;
        this.dirty = false;
        this.localTransformUpdated = false;
        this.worldTransformUpdated = false;
    }

    setPosition(position: vec2) {
        this.position = position;
        this.localDirty = true;
    }

    setAngle(angle: number) {
        this.angle = angle;
        this.localDirty = true;
    }

    setAlpha(alpha: number) {
        this.alpha = alpha;
        this.localDirty = true;
    }

    setScale(scale: vec2) {
        vec2.set(this.scale, scale[0], scale[0]);
        this.localDirty = true;
    }

    setPivot(x: number, y: number) {
        vec2.set(this.pivot, x, y);
        vec2.set(this.invPivot, -x, -y);
        this.localDirty = true;
    }

    setAnchor(x: number, y: number) {
        vec2.set(this.anchor, x, y);
        this.localDirty = true;
    }

    addChild(child: Container) {
		this.children.push(child);
		child.parent = this;
	}

	removeChild(child: Container) {
		this.children.splice(this.children.indexOf(child), 1);
		child.parent = null;
    }
    
    setVisible(visible: boolean) {
        this.visible = visible;
        this.localDirty = true;
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    updateAlpha(parentAlpha: number) {
        this.totalAlpha = this.alpha * parentAlpha;
    }

    updateWorldTransform(parentWorldTransform: mat3, updateWorldTransform: boolean) {

		this.localTransformUpdated = this.updateLocalTransform();

		if (this.localTransformUpdated || updateWorldTransform) {
			mat3.multiply(this.worldTransform, parentWorldTransform, this.localTransform);
            return true;
        }
        return false;
	}

    updateLocalTransform() {
        if(this.localDirty) {
            this.localDirty = false;
            mat3.identity(this.localTransform);
            mat3.translate(this.localTransform, this.localTransform, this.position);
            mat3.rotate(this.localTransform, this.localTransform, this.angle);
            mat3.translate(this.localTransform, this.localTransform, this.invPivot);
            mat3.scale(this.localTransform, this.localTransform, this.scale);
            return true;
        }
        return false;
    }

    position: vec2;
    angle: number;
    scale: vec2;

    pivot: vec2;
    invPivot: vec2;
    anchor: vec2;
    
    alpha: number;
    totalAlpha: number;

    parent: Container;
	children: Container[];
	name: string;
    visible: boolean;
    enabled: boolean;
	localTransform: mat3;
    worldTransform: mat3;
    
    localDirty: boolean;
    dirty: boolean;
    localTransformUpdated: boolean;
    worldTransformUpdated: boolean;
}