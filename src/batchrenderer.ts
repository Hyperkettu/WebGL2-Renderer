import { Submesh } from './submesh';
import { Renderer } from './glrenderer';
import { Camera } from './camera';
import * as camera from './cameramanager';
import { ConstantBuffers, BufferDirtyFlag } from './constantbuffers';
import { mat4, vec4 } from 'gl-matrix';
import { VertexBase } from './vertex';
import { MorphedSubmesh } from './mesh';
import { Material } from './material';
import { ShaderType } from './shader';

interface Batch {
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

	flushSortedArray(renderer: Renderer, layer: Layer, shadowPass: boolean = false) {

		const context = renderer.getContext();
		for (let i = 0; i < this.layers[layer].length; i++) {
			const batch = this.layers[layer][i];
			if (renderer.materialID !== batch.submesh.materialID) {
				renderer.materialEnd(shadowPass);
				renderer.materialBegin(batch.submesh, shadowPass);
			}

			context.setVertexAndIndexBuffers(batch.submesh);
			ConstantBuffers.world = batch.world;
			ConstantBuffers.displacementFactor = batch.submesh.displacementFactor;
			ConstantBuffers.pointLightIndex = batch.submesh.pointLightIndex;
			ConstantBuffers.UpdateBuffer(BufferDirtyFlag.PER_OBJECT, renderer.shader);

			if(renderer.shader === ShaderType.MORPHED_PBR || renderer.shader === ShaderType.VISUALIZE_NORMALS_MOPRHED) {
				ConstantBuffers.generalData.update(renderer.gl, 'dataVec1', vec4.fromValues((batch.submesh as MorphedSubmesh).weights[0], 0, 0, 0));
				ConstantBuffers.generalData.sendToGPU(renderer.gl);
			}

			if (batch.submesh.wireFrame) {
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