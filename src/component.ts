import { SceneNode } from './scenenode';

export abstract class Component {
	constructor(owner?: SceneNode) {
		this.node = owner;
		this.type = 'component';
	}

	update(dt: number) {

	}

	node: SceneNode;
	type: string;
}