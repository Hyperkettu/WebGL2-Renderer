import { Vertex, toFloat32Array, ParticleVertex, MorphVertex, morphVertexToFloat32Array, SpriteVertex, positionVertexToFloat32Array, PositionVertex } from './vertex';
import { Overlay } from './overlay/overlay';
import { OverlayMesh } from './overlay/mesh';
import { StaticMesh } from './mesh';
import { InstanceData } from './instancebuffer';

export enum VertexDataType {
	VERTEX,
	MORPHED_VERTEX,
	SPRITE_VERTEX,
	POSITION_VERTEX
};

interface VertexBufferStructure {
	variables: VertexVariable[];
}

type VertexVariableType = 'vec2' | 'vec3' | 'vec4' | 'mat3' | 'mat4';

interface VertexVariable {
	type: VertexVariableType;
}

function getTypeSizeInBytes(type: VertexVariableType) {
	switch(type) {
		case 'vec2': return 4 * 2;
		case 'vec3': return 4 * 3;
		case 'vec4': return 4 * 4;
		case 'mat3': return 4 * 9;
		case 'mat4': return 4 * 16;
	}
}

function getNumberOfComponents(type: VertexVariableType) {
	switch(type) {
		case 'vec2': return 2;
		case 'vec3': return 3;
		case 'vec4': return 4;
		case 'mat3': return 3;
		case 'mat4': return 4;
	}
}

function getBufferStride(buffer: VertexBufferStructure) {
	let size = 0;
	for(let variable of buffer.variables) {
		size += getTypeSizeInBytes(variable.type);
	}
	return size;
}

export class VertexBuffer<VertexType> {

	constructor(gl: WebGL2RenderingContext, vertices: VertexType[], type: VertexDataType) {
		this.type = type;
		if(type === VertexDataType.VERTEX) {
			this.createBuffer(gl, vertices);
		} else if(type === VertexDataType.MORPHED_VERTEX) {
			this.createMorphedBuffer(gl, (vertices as unknown) as MorphVertex[]);
		} else if(type === VertexDataType.SPRITE_VERTEX) {
			this.createSpriteVertexBuffer(gl, Overlay.SPRITE_BATCH_SIZE);
		} else if(type === VertexDataType.POSITION_VERTEX) {
			this.createPositionVertexBuffer(gl, vertices);
		}
	}

	private createPositionVertexBuffer(gl: WebGL2RenderingContext, vertices: VertexType[]) {
		this.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, positionVertexToFloat32Array(vertices as unknown as PositionVertex[]), gl.DYNAMIC_DRAW);
		
		const structure: VertexBufferStructure = {
			variables: [
				{
					type: 'vec3'
				}
			]
		};

		const stride = getBufferStride(structure);
		const type = gl.FLOAT;
		const normalize = false;
		let offset = 0;

		for(let index = 0; index < structure.variables.length; index++) {
			gl.vertexAttribPointer(index, getNumberOfComponents(structure.variables[index].type), type, normalize, stride, offset);
			gl.enableVertexAttribArray(index);
			offset += getTypeSizeInBytes(structure.variables[index].type);
		}

	}

	private createSpriteVertexBuffer(gl: WebGL2RenderingContext, batchSize: number) {
		this.floatArray = new Float32Array(batchSize * OverlayMesh.VERTICES_PER_SPRITE * 
			OverlayMesh.COMPONENTS_PER_SPRITE_VERTEX);
		this.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.floatArray, gl.DYNAMIC_DRAW);

		const structure: VertexBufferStructure = {
			variables: [
				{
					type: 'vec2'					
				},
				{
					type: 'vec3'
				},
				{
					type: 'vec4'
				},
				{
					type: 'vec4'
				},
				{
					type: 'vec4'
				},
				{
					type: 'vec4'
				}
			]
		};

		const stride = getBufferStride(structure);
		const type = gl.FLOAT;
		const normalize = false;
		let offset = 0;

		for(let index = 0; index < structure.variables.length; index++) {
			gl.vertexAttribPointer(index, getNumberOfComponents(structure.variables[index].type), type, normalize, stride, offset);
			gl.enableVertexAttribArray(index);
			offset += getTypeSizeInBytes(structure.variables[index].type);
		}
	}

	private createMorphedBuffer(gl: WebGL2RenderingContext, vertices: MorphVertex[]) {
		this.vertexBuffer = gl.createBuffer();
		const floatArray = morphVertexToFloat32Array(vertices);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, floatArray, gl.STATIC_DRAW);
		
		const structure: VertexBufferStructure = {
			variables: [
				{
					type: 'vec3'					
				},
				{
					type: 'vec3'					
				},
				{
					type: 'vec3'					
				},
				{
					type: 'vec3'					
				},
				{
					type: 'vec2'					
				},
				{
					type: 'vec3'					
				},
				{
					type: 'vec3'					
				}

			]
		};

		const stride = getBufferStride(structure);
		const type = gl.FLOAT;
		const normalize = false;
		let offset = 0;

		for(let index = 0; index < structure.variables.length; index++) {
			gl.vertexAttribPointer(index, getNumberOfComponents(structure.variables[index].type), type, normalize, stride, offset);
			gl.enableVertexAttribArray(index);
			offset += getTypeSizeInBytes(structure.variables[index].type);
		}

		}

	private createBuffer(gl: WebGL2RenderingContext, vertices: VertexType[]) {

			this.vertexBuffer = gl.createBuffer();
			const floatArray = toFloat32Array(vertices, this.type);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, floatArray, gl.STATIC_DRAW);

			const structure: VertexBufferStructure = {
				variables: [
					{
						type: 'vec3'
					},
					{
						type: 'vec3'
					},
					{
						type: 'vec2'
					},
					{
						type: 'vec3'
					}
					
				]
			};

			const stride = getBufferStride(structure);
			const type = gl.FLOAT;
			const normalize = false;
			let offset = 0;
	
			for(let index = 0; index < structure.variables.length; index++) {
				gl.vertexAttribPointer(index, getNumberOfComponents(structure.variables[index].type), type, normalize, stride, offset);
				gl.enableVertexAttribArray(index);
				offset += getTypeSizeInBytes(structure.variables[index].type);
			}
	}

	static createParticleBuffer(gl: WebGL2RenderingContext, vertices: Float32Array, buffer?: WebGLBuffer, divisor: boolean = false) {

		const vertexBuffer = buffer ? buffer : gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
		let size = 3;          // n components per iteration
		const type = gl.FLOAT;   // the data is 32bit floats
		const normalize = false; // don't normalize the data
		let stride = 4 * 8;        // 0 = move forward size * sizeof(type) each iteration to get the next position
		let offset = 0;        // start at the beginning of the buffer

		// set position data
		gl.vertexAttribPointer(
			0, size, type, normalize, stride, offset);
		gl.enableVertexAttribArray(0);

		if (divisor) {
			gl.vertexAttribDivisor(0, 1);
		}

		// set velocity data
		offset = 3 * 4;
		size = 3;
		gl.vertexAttribPointer(
			1, size, type, normalize, stride, offset);
		gl.enableVertexAttribArray(1);

		if (divisor) {
			gl.vertexAttribDivisor(1, 1);
		}

		// set age data
		offset = 6 * 4;
		size = 1;
		gl.vertexAttribPointer(
			2, size, type, normalize, stride, offset);
		gl.enableVertexAttribArray(2);

		if (divisor) {
			gl.vertexAttribDivisor(2, 1);
		}

		// set life data
		offset = 7 * 4;
		size = 1;
		gl.vertexAttribPointer(
			3, size, type, normalize, stride, offset);
		gl.enableVertexAttribArray(3);

		if (divisor) {
			gl.vertexAttribDivisor(3, 1);
		}

		return vertexBuffer;
	}

	static createRenderParticleBuffer(gl: WebGL2RenderingContext, vertices: Float32Array) {
		const vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		
		const structure: VertexBufferStructure = {
			variables: [
				{
					type: 'vec3'
				},
				{
					type: 'vec2'
				},
				{
					type: 'vec2'
				}
			]
		};
		
		const indexOffset = 4;

		const stride = getBufferStride(structure);
		const type = gl.FLOAT;
		const normalize = false;
		let offset = 0;

		for(let index = indexOffset; index < indexOffset + structure.variables.length; index++) {
			gl.vertexAttribPointer(index, getNumberOfComponents(structure.variables[index - indexOffset].type), type, normalize, stride, offset);
			gl.enableVertexAttribArray(index);
			offset += getTypeSizeInBytes(structure.variables[index - indexOffset].type);
		}

		return vertexBuffer;
	}

	static GenerateVertexBufferForScreen(gl: WebGL2RenderingContext, vertices: Float32Array) {

		const quadVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		const structure: VertexBufferStructure = {
			variables: [
				{
					type: 'vec3'
				},
				{
					type: 'vec2'
				}
			]
		};
		
		const indexOffset = 0;

		const stride = getBufferStride(structure);
		const type = gl.FLOAT;
		const normalize = false;
		let offset = 0;

		for(let index = indexOffset; index < indexOffset + structure.variables.length; index++) {
			gl.vertexAttribPointer(index, getNumberOfComponents(structure.variables[index - indexOffset].type), type, normalize, stride, offset);
			gl.enableVertexAttribArray(index);
			offset += getTypeSizeInBytes(structure.variables[index - indexOffset].type);
		}
		return quadVBO;
	}

	static GenerateVertexBufferForSkybox(gl: WebGL2RenderingContext, vertices: Float32Array) {

		const cubeVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVBO);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

		const structure: VertexBufferStructure = {
			variables: [
				{
					type: 'vec3'
				}
			]
		};
		
		const indexOffset = 0;
		const stride = getBufferStride(structure);
		const type = gl.FLOAT;
		const normalize = false;
		let offset = 0;

		for(let index = indexOffset; index < indexOffset + structure.variables.length; index++) {
			gl.vertexAttribPointer(index, getNumberOfComponents(structure.variables[index].type), type, normalize, stride, offset);
			gl.enableVertexAttribArray(index);
			offset += getTypeSizeInBytes(structure.variables[index].type);
		}


		return cubeVBO;
	}

	static createInstanceVertexBuffer(gl: WebGL2RenderingContext, mesh: StaticMesh, instanceCount: number) {

		const data: InstanceData[] = [];

		for(let submesh of mesh.getSubmeshes()) {
			gl.bindVertexArray(submesh.vertexArrayObject.vao);

			const instanceBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, instanceCount * getTypeSizeInBytes('mat4'), gl.DYNAMIC_DRAW);
 
			gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 4 * getTypeSizeInBytes('vec4'), 0);
			gl.enableVertexAttribArray(4);
			gl.vertexAttribDivisor(4, 1);

			gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 4 * getTypeSizeInBytes('vec4'), getTypeSizeInBytes('vec4'));
			gl.vertexAttribDivisor(5, 1);
			gl.enableVertexAttribArray(5);

			gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 4 * getTypeSizeInBytes('vec4'), 2 * getTypeSizeInBytes('vec4'));
			gl.enableVertexAttribArray(6);
			gl.vertexAttribDivisor(6, 1);

			gl.vertexAttribPointer(7, 4, gl.FLOAT, false, 4 * getTypeSizeInBytes('vec4'), 3 * getTypeSizeInBytes('vec4'));
			gl.enableVertexAttribArray(7);
			gl.vertexAttribDivisor(7, 1);

			gl.bindVertexArray(null);

			data.push({
				submesh,
				instanceCount,
				buffer: instanceBuffer,
				data: new Float32Array(instanceCount * 16)
			});
		}

		return data;
	}

	vertexBuffer: WebGLBuffer;
	floatArray?: Float32Array;
	type: VertexDataType;
}