import { Component } from './component';
import { Mesh } from './mesh';
import { Layer } from './batchrenderer';
import { SceneNode } from './scenenode';

export class MeshComponent extends Component {

	constructor(owner: SceneNode, mesh: Mesh, layer: Layer) {
		super(owner);
		this.mesh = mesh;
		this.layer = layer;
		this.type = 'meshComponent';
	}

	mesh: Mesh;
	layer: Layer;

}