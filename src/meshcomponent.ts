import { Component } from './component';
import { Submesh } from './submesh';
import { Layer } from './batchrenderer';
import { SceneNode } from './scenenode';

export class MeshComponent extends Component {

	constructor(owner: SceneNode, mesh: Submesh, layer: Layer) {
		super(owner);
		this.mesh = mesh;
		this.layer = layer;
		this.type = 'meshComponent';
	}

	mesh: Submesh;
	layer: Layer;

}