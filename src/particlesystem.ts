import { Renderer } from './glrenderer';
import { ParticleVertex, Vertex, RenderParticleVertex } from './vertex';
import { vec3, vec2 } from 'gl-matrix';
import { particleVertexToFloat32Array, renderParticleToFloat32Array } from './vertex';
import { VertexBuffer } from './vertexbuffer';
import { ShaderType } from './shader';
import * as shader from './shadermanager';
import { ConstantBuffers } from './constantbuffers';
import * as texture from './texturemanager';
import { Texture } from './texture';
import { VertexArrayObject } from './vertexarrayobject';
import { IndexBuffer } from './indexbuffer';
import * as math from './util/math';

interface ParticleRenderState {
	udpateVAO: WebGLVertexArrayObject;
	renderBuffers: {
		vertexArrayObject: WebGLVertexArrayObject;
		vertexBuffer: WebGLBuffer;
		indexBuffer: IndexBuffer;
		particleInstanceBuffer: WebGLBuffer;
	};
}

interface ParticleInit {
	numParticles: number;
	minAge: number;
	maxAge: number;
	birthRate: number;
}

export class ParticleSystem {

	constructor(initData: ParticleInit) {
		this.data = initData;
		this.states = [];
		this.read = 0;
		this.write = 1;
		this.numParticles = 0;
		this.bornParticles = 0;
	}

	async load(renderer: Renderer) {
		const gl = renderer.gl;
		this.generateVertices(gl);
		this.createUpdateVAOs(gl);

		await texture.LoadTexture(gl, 'images/particles/flare.png');
		this.createRandomTexture(gl);

		this.particleTexture = texture.GetTexture('images/particles/flare.png');
	}

	private createUpdateVAOs(gl: WebGL2RenderingContext) {
	}

	generateVertices(gl: WebGL2RenderingContext) {

		const updateVertices: ParticleVertex[] = [];

		for (let i = 0; i < this.data.numParticles; i++) {
			const vertex = new ParticleVertex();
			vertex.position = vec3.fromValues(0, 2.75, 0);
			vertex.velocity = vec3.fromValues(0, 0, 0);
			const life = math.randomFloat(this.data.minAge, this.data.maxAge);
			vertex.age = life + 1;
			vertex.life = life;

			updateVertices.push(vertex);
		}

		const vertices: RenderParticleVertex[] = [];

		let vertex = new RenderParticleVertex();
		vertex.position = vec3.fromValues(-1.0, 1.0, 0.0);
		vertex.texCoords = vec2.fromValues(0, 1);
		vertex.size = vec2.fromValues(2, 2);
		vertices.push(vertex);

		vertex = new RenderParticleVertex();
		vertex.position = vec3.fromValues(-1.0, -1.0, 0.0);
		vertex.texCoords = vec2.fromValues(0, 0);
		vertex.size = vec2.fromValues(2, 2);
		vertices.push(vertex);

		vertex = new RenderParticleVertex();
		vertex.position = vec3.fromValues(1.0, -1.0, 0.0);
		vertex.texCoords = vec2.fromValues(1, 0);
		vertex.size = vec2.fromValues(2, 2);
		vertices.push(vertex);

		vertex = new RenderParticleVertex();
		vertex.position = vec3.fromValues(1.0, 1.0, 0.0);
		vertex.texCoords = vec2.fromValues(1, 1);
		vertex.size = vec2.fromValues(2, 2);
		vertices.push(vertex);

		const renderParticles = renderParticleToFloat32Array(vertices);
		const updateParticles = particleVertexToFloat32Array(updateVertices);


		this.updateVAO1 = gl.createVertexArray();
		gl.bindVertexArray(this.updateVAO1);
		const vertexBuffer = VertexBuffer.createParticleBuffer(gl, updateParticles);
		gl.bindVertexArray(null);

		this.updateVAO2 = gl.createVertexArray();
		gl.bindVertexArray(this.updateVAO2);
		const vertexBuffer2 = VertexBuffer.createParticleBuffer(gl, updateParticles);
		gl.bindVertexArray(null);

		this.particleBuffer = VertexArrayObject.GenerateRenderParticleObject(gl, renderParticles, updateParticles, vertexBuffer);
		this.particleBuffer2 = VertexArrayObject.GenerateRenderParticleObject(gl, renderParticles, updateParticles, vertexBuffer2);

		this.states.push({
			udpateVAO: this.updateVAO1,
			renderBuffers: this.particleBuffer
		});

		this.states.push({
			udpateVAO: this.updateVAO2,
			renderBuffers: this.particleBuffer2
		});
	}

	renderParticles(renderer: Renderer, dt: number) {

		this.update(renderer, dt);

		const gl = renderer.gl;
		const particleBillboardShader = shader.GetShader(ShaderType.BILLBOARD_PARTICLE);
		particleBillboardShader.use(gl);
		particleBillboardShader.setSamplerTexture(gl, 'particleTexture', this.particleTexture, 0);

		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
		gl.blendEquation(gl.FUNC_ADD);
		gl.depthFunc(gl.LEQUAL);
		gl.depthMask(false);

		Renderer.numDrawCallsPerFrame++;
		gl.bindVertexArray(this.states[this.read].renderBuffers.vertexArrayObject);
		gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, this.numParticles);
		gl.bindVertexArray(null);

		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.depthFunc(gl.LESS);
		gl.depthMask(true);


		const temp = this.read;
		this.read = this.write;
		this.write = temp;
	}

	update(renderer: Renderer, dt: number) {
		const gl = renderer.gl;

		this.numParticles = Math.floor(this.bornParticles);

		if (this.bornParticles < this.data.numParticles) {
			this.bornParticles = Math.min(this.data.numParticles,
				this.bornParticles + this.data.birthRate * dt);
		}

		const particelUpdateShader = shader.GetShader(ShaderType.PARTICLE_UPDATE);
		particelUpdateShader.use(gl);

		particelUpdateShader.setSamplerTexture(gl, 'noiseTexture', this.noiseTexture, 0);

		ConstantBuffers.particleData.update(gl, 'particleData.gravity', vec3.fromValues(0, -9.81, 0));
		ConstantBuffers.particleData.updateWithOffset('particleData.gravity', 3, dt);
		ConstantBuffers.particleData.update(gl, 'particleData.origin', vec3.fromValues(0, 2.75, 0));
		ConstantBuffers.particleData.update(gl, 'particleData.angleLimits', vec2.fromValues(-Math.PI / 4.0, Math.PI / 4.0));
		ConstantBuffers.particleData.update(gl, 'particleData.speedLimits', vec2.fromValues(1.0, 10.0));
		ConstantBuffers.particleData.sendToGPU(gl);

		Renderer.numDrawCallsPerFrame++;
		gl.bindVertexArray(this.states[this.read].udpateVAO);
		gl.enable(gl.RASTERIZER_DISCARD);
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.states[this.write].renderBuffers.particleInstanceBuffer);
		gl.beginTransformFeedback(gl.POINTS);
		gl.drawArrays(gl.POINTS, 0, this.numParticles);
		gl.endTransformFeedback();
		gl.flush();
		gl.disable(gl.RASTERIZER_DISCARD);
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
		gl.bindVertexArray(null);

	}

	private createRandomTexture(gl: WebGL2RenderingContext) {

		this.noiseTexture = new Texture();
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D,
			0,
			gl.RGB8,
			512, 512,
			0,
			gl.RGB,
			gl.UNSIGNED_BYTE,
			this.randomRGBData(512, 512));
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

		this.noiseTexture.textureId = texture;
	}

	private randomRGBData(width: number, height: number) {
		let data = [];
		for (let i = 0; i < width * height; ++i) {
			data.push(Math.random() * 255.0);
			data.push(Math.random() * 255.0);
			data.push(Math.random() * 255.0);
		}
		return new Uint8Array(data);
	}

	particleBuffer: {
		vertexArrayObject: WebGLVertexArrayObject;
		vertexBuffer: WebGLBuffer;
		indexBuffer: IndexBuffer;
		particleInstanceBuffer: WebGLBuffer;
	};

	particleBuffer2: {
		vertexArrayObject: WebGLVertexArrayObject;
		vertexBuffer: WebGLBuffer;
		indexBuffer: IndexBuffer;
		particleInstanceBuffer: WebGLBuffer;
	};

	updateVAO1: WebGLVertexArrayObject;
	updateVAO2: WebGLVertexArrayObject;

	particleTexture: Texture;
	noiseTexture: Texture;

	states: ParticleRenderState[];

	read: number;
	write: number;

	data: ParticleInit;

	numParticles: number;
	bornParticles: number;
}