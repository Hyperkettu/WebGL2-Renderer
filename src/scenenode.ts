import { Component } from './component';
import { Transform } from './transform';
import { MeshComponent } from './meshcomponent';
import { Layer } from './batchrenderer';
import * as mesh from './meshmanager';
import { PointLight } from './pointlight';
import { Scene } from './scene';
import { Submesh } from './submesh';
import { vec3 } from 'gl-matrix';
import { VertexBase } from './vertex';
import { Mesh } from './mesh';

export class SceneNode {

	constructor(name: string, scene: Scene, parent?: SceneNode) {
		this.name = name;
		this.parent = parent;
		this.children = [];
		this.transform = new Transform(this);
		this.components = [];
		this.components.push(this.transform);
		this.components.push(new MeshComponent(this, null, Layer.OPAQUE));
		this.scene = scene;

		this.enabled = true;
		this.enableUpdate = true;
	}

	setMesh(name: string, submeshName: string, layer: Layer) {
		(this.getComponent('meshComponent') as MeshComponent<VertexBase>).mesh = mesh.GetMesh<Mesh<VertexBase>>(name).getSubmesh(submeshName);
		(this.getComponent('meshComponent') as MeshComponent<VertexBase>).layer = layer;

	}

	addMesh(mesh: Submesh<VertexBase>, layer: Layer) {
		const comp = this.getComponent('meshComponent') as MeshComponent<VertexBase>;
		comp.mesh = mesh;
		comp.layer = layer;
	}

	getComponent<Type>(type: string) {
		for (let component of this.components) {
			if (component.type === type) {
				return (component as unknown) as Type;
			}

		}

		return null;
	}

	addComponent(component: Component) {
		this.components.push(component);
		component.node = this;
	}

	addChild(child: SceneNode) {
		this.children.push(child);
		child.parent = this;
	}

	update(dt: number) {
		for (let component of this.components) {
			component.update(dt);
		}

		if (this.pointLight) {
			vec3.transformMat4(this.pointLight.position, this.pointLight.localPosition, this.transform.world);

		}
	}

	removeChild(child: SceneNode) {
		const index = this.children.indexOf(child);
		if (index >= 0) {
			this.children.splice(index, 1);
		}
	}

	traverseChildren(parent: SceneNode, callback: (node: SceneNode) => boolean) {

		const shouldBreak = callback(parent);

		if (shouldBreak) {
			return true;
		}

		if (!shouldBreak) {
			for (let child of this.children) {
				const shouldBreakRecursion = this.traverseChildren(child, callback);
				if (shouldBreakRecursion) {
					return true;
				}
			}
		}

		return false;
	}

	recurseChildren(parent: SceneNode, name: string): SceneNode {
		if (name === parent.name) {
			return parent;
		}

		for (let child of parent.children) {
			const value = this.recurseChildren(child, name);
			if (value) {
				return value;
			}
		}

		return null;
	}

	find(name: string) {
		return this.recurseChildren(this, name);
	}

	scene: Scene;

	enabled: boolean;
	enableUpdate: boolean;

	components: Component[];
	transform: Transform;

	parent: SceneNode;
	children: SceneNode[];
	name: string;

	pointLight?: PointLight;
}