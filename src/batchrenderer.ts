import { Submesh } from './submesh';
import { Renderer, ShadowPass } from './glrenderer';
import { mat4 } from 'gl-matrix';
import { VertexBase } from './vertex';
import * as instanceBuffer from './instancebuffer';

export interface Batch {
	submesh: Submesh<VertexBase>;
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

	flushSortedArray(renderer: Renderer, layer: Layer, shadowPass?: ShadowPass) {

		const context = renderer.getContext();
		for (let i = 0; i < this.layers[layer].length; i++) {
			const batch = this.layers[layer][i];
			if (renderer.materialID !== batch.submesh.materialID) {
				renderer.materialEnd(shadowPass);
				renderer.materialBegin(batch.submesh, shadowPass);
			}

			context.setVertexAndIndexBuffers(batch.submesh);
			batch.submesh.updateConstantBuffers(renderer, batch);

			if (batch.submesh.wireFrame) {
				context.drawIndexed(renderer.gl.LINE_STRIP, renderer.shader, renderer.shaderTech);
			} else {
				context.drawIndexed(renderer.gl.TRIANGLES, renderer.shader, renderer.shaderTech);
			}

			renderer.materialEnd(shadowPass);

			if(batch.submesh.renderBoundingVolume) {
				batch.submesh.boundingVolume.render(renderer.gl);
			}
		}

		for(let buffer of instanceBuffer.getInstanceBuffers(layer)) {
			buffer.render(renderer.gl, shadowPass);
		}
		
	}

	sortInAscendingOrder(renderer: Renderer, layer: Layer) {

	}

	sortInDescendingOrder(renderer: Renderer, layer: Layer) {

	}


	layers: Batch[][];
}