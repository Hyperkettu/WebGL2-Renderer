import { Container } from './container';

export class SceneGraph {

	constructor() {
		this.root = new Container();
	}

	forEach(func?: (node: Container) => void) {
		this.recurse(this.root, func);
	}

	recurse(node: Container, func?: (Container) => void) {

		if (func) {
			func(node);
		}

		for (let child of node.children) {
			this.recurse(child, func);
		}
	}

	root: Container;

}