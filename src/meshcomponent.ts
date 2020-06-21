import { Component } from './component';
import { Submesh } from './submesh';
import { Layer } from './batchrenderer';
import { SceneNode } from './scenenode';

export class MeshComponent<VertexType> extends Component {

	constructor(owner: SceneNode, mesh: Submesh<VertexType>, layer: Layer) {
		super(owner);
		this.mesh = mesh;
		this.layer = layer;
		this.type = 'meshComponent';
	}

	mesh: Submesh<VertexType>;
	layer: Layer;

}