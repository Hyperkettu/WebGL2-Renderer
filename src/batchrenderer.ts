import { Mesh } from './mesh';
import { Renderer } from './glrenderer';
import { Camera } from './camera';
import * as camera from './cameramanager';
import { ConstantBuffers, BufferDirtyFlag } from './constantbuffers';
import { mat4 } from 'gl-matrix';

interface Batch {
	mesh: Mesh;
	world: mat4;
}

export enum Layer {
	OPAQUE = 0,
	TRANSPARENT,
	NUM_LAYERS
}

export class BatchRenderer {

	constructor() {
		this.layers = [];

		for (let index = 0; index < Layer.NUM_LAYERS; index++) {
			this.layers[index] = [];
		}
	}

	reset() {

		for (let i = 0; i < Layer.NUM_LAYERS; i++) {
			this.layers[i] = [];
		}
	}

	addBatch(batch: Batch, layer: Layer) {
		this.layers[layer].push(batch);
	}

	flushSortedArray(renderer: Renderer, layer: Layer, shadowPass: boolean = false) {

		const context = renderer.getContext();
		for (let i = 0; i < this.layers[layer].length; i++) {
			const batch = this.layers[layer][i];
			if (renderer.materialID !== batch.mesh.materialID) {
				renderer.materialEnd(shadowPass);
				renderer.materialBegin(batch.mesh.materialID, shadowPass);
			}

			context.setVertexAndIndexBuffers(batch.mesh);
			ConstantBuffers.world = batch.world;
			ConstantBuffers.displacementFactor = batch.mesh.displacementFactor;
			ConstantBuffers.pointLightIndex = batch.mesh.pointLightIndex;
			ConstantBuffers.UpdateBuffer(BufferDirtyFlag.PER_OBJECT, renderer.shader);

			if (batch.mesh.wireFrame) {
				context.drawIndexed(renderer.gl.LINE_STRIP, renderer.shader, renderer.shaderTech);
			} else {
				context.drawIndexed(renderer.gl.TRIANGLES, renderer.shader, renderer.shaderTech);
			}
			renderer.materialEnd(shadowPass);
		}
	}

	sortInAscendingOrder(renderer: Renderer, layer: Layer) {

	}

	sortInDescendingOrder(renderer: Renderer, layer: Layer) {

	}


	layers: Batch[][];
}