import { SceneNode } from './scenenode';
import { Transform } from './transform';

export class SceneGraph {

	constructor() {
		this.root = new SceneNode('root', null);
	}

	forEach(callback?: (node: SceneNode) => void) {
		this.recurse(this.root, callback);
	}

	find(name: string): SceneNode {
		return this.root.find(name);
	}

	private recurse(node: SceneNode, callback?: (node: SceneNode) => void) {

		if (callback && (node.enabled || node.enableUpdate)) {
			callback(node);
		}

		for (let child of node.children) {
			if (child.enabled) {
				this.recurse(child, callback);
			}
		}
	}

	updateGraph(dt: number) {
		this.forEach(node => {
			node.update(dt);
			if (!node.parent) {
				node.transform.Compose(Transform.IDENTITY);
			} else {
				node.transform.Compose(node.parent.transform.world);
			}
		});
	}

	root: SceneNode;
}