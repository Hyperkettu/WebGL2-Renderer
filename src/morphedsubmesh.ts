import * as math from './util/math';
import { ShaderMode, Renderer } from './glrenderer';
import { ShaderType } from './shader';
import { Batch } from './batchrenderer';
import { ConstantBuffers } from './constantbuffers';
import { vec4 } from 'gl-matrix';
import { MorphVertex } from './vertex';
import { VertexDataType } from './vertexbuffer';
import { Submesh } from './submesh';


export class MorphedSubmesh extends Submesh<MorphVertex> {
    constructor(gl: WebGL2RenderingContext, vertices: MorphVertex[], indices: number[], numMorphTargets: number, 
        type?: VertexDataType) {
        super(gl, vertices, indices, VertexDataType.MORPHED_VERTEX);
        this.weights = [];
        this.numMorphTargets = numMorphTargets;
        this.weights.push(1);
        
        for(let index = 1; index < numMorphTargets; index++) {
            this.weights.push(0);
        }

        this.shadowMapShaders = [
            ShaderType.POINT_LIGHT_SHADOW_MAP_MORPHED,
            ShaderType.DIR_LIGHT_SHADOW_MAP_MORPHED
        ];

        this.shaderModes = [];
		this.shaderModes[ShaderMode.DEFAULT] = { shader: null, tech: 'default' };
		this.shaderModes[ShaderMode.NORMAL] = { shader: ShaderType.VISUALIZE_NORMALS_MOPRHED, tech: 'Vis' };
		this.shaderModes[ShaderMode.NORMAL_MAP] = { shader: ShaderType.VISUALIZE_NORMALS_MOPRHED, tech: 'VisN' };
    }

    updateConstantBuffers(renderer: Renderer, batch: Batch) {
        super.updateConstantBuffers(renderer, batch);
        ConstantBuffers.generalData.update(renderer.gl, 'dataVec3', vec4.fromValues((batch.submesh as MorphedSubmesh).weights[0], 0, 0, 0));
        ConstantBuffers.generalData.sendToGPU(renderer.gl);
	}

    update(gl: WebGL2RenderingContext, dt: number) {
        this.weights[0] -= 0.01 * dt;
        this.weights[0] = math.clamp(this.weights[0], 0, 1);
    }

    weights: number[];
    numMorphTargets: number;
}