import { SceneNode } from './scenenode';
import { Transform } from './transform';
import { Frustum, FrustumPlaneBit } from './frustum';
import { MeshComponent } from './meshcomponent';
import { VertexBase } from './vertex';
import { Sphere } from './sphere';
import { vec3 } from 'gl-matrix';
import { IntersectionType } from './util/math';

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

	forEachFrustumCull(frustum: Frustum, callback?: (node: SceneNode) => void) {
		this.totalObjects = 0;
		this.objectCounter = 0;
		this.solveBoundingVolumeHierarchy();
		this.hierarchicalFrustumCull(this.root, frustum, 0, callback);
	//	console.log(this.objectCounter, this.totalObjects);
	}

	public solveBoundingVolumeHierarchy() {
		this.solveSphereBoundingVolumeHierarchy(this.root);
	}

	private solveSphereBoundingVolumeHierarchy(node: SceneNode) {

		if(node.children.length == 0) {
			const meshComponent = node.getComponent<MeshComponent<VertexBase>>('meshComponent');
			if(meshComponent) {
				node.boundingSphere = meshComponent.mesh.boundingVolume.sphere.getTransformed(
					node.transform.world);
			} else {
				if(!node.boundingSphere) {
					node.boundingSphere = new Sphere(vec3.fromValues(0,0,0), 0);
				}
			}
			return;
		}

		const spheres: Sphere[] = [];

		for(let child of node.children) {
			this.solveSphereBoundingVolumeHierarchy(child);

			if(child.boundingSphere.radius > 0) {
				spheres.push(child.boundingSphere);
			}
		}

		const mergedSphere = Sphere.merge(spheres);
		node.boundingSphere = mergedSphere;
	}	

	private hierarchicalFrustumCull(node: SceneNode, frustum: Frustum, planeBits: number, callback?: (node: SceneNode) => void) {

		this.totalObjects++;

		if(planeBits === FrustumPlaneBit.ALL) {

			if (callback && (node.enabled || node.enableUpdate)) {
				this.objectCounter++;
				callback(node);
			}

			for (let child of node.children) {
				if (child.enabled) {
					this.hierarchicalFrustumCull(child, frustum, FrustumPlaneBit.ALL, callback);
				}
			}

		} else {

			let bits = planeBits;
			const result = frustum.intersectsSphere(node.boundingSphere, bits);

			if(result.intersection === IntersectionType.OUTSIDE) {
				return;
			}

			if (callback && (node.enabled || node.enableUpdate)) {
				this.objectCounter++;
				callback(node);
			}

			for (let child of node.children) {
				if (child.enabled) {
					if(result.intersection === IntersectionType.INTERSECTING) {
						this.hierarchicalFrustumCull(child, frustum, result.planeBits, callback);
					} else if(result.intersection === IntersectionType.INSIDE) {
						this.hierarchicalFrustumCull(child, frustum, FrustumPlaneBit.ALL, callback);
					}
				}
			}
		}
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

	objectCounter: number;
	totalObjects: number;
}