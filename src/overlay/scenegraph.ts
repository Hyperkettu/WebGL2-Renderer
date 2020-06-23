import { Container } from './container';
import { mat3 } from 'gl-matrix';

export class OverlaySceneGraph {

	constructor() {
        this.root = new Container('root');
        this.identity = mat3.create();

        this.root.updateLocalTransform();
        this.root.updateWorldTransform(this.identity, true);
	}

	forEach(func?: (node: Container, matrix: mat3, value: boolean) => boolean) {
		this.recurse(this.root, this.identity, false, func);
    }

	recurse(node: Container, parentWorldTransform: mat3, parentWordTransformUpdated: boolean, func?: (node: Container, world: mat3, updated: boolean) => boolean) {
        let updated = false;
        if (func) {
			updated = func(node, parentWorldTransform, parentWordTransformUpdated);
		}

		for (let child of node.children) {
			this.recurse(child, node.worldTransform, updated, func);
		}
	}

	root: Container;
    identity: mat3;
}