import { VertexArrayObject } from './vertexarrayobject';
import { Submesh } from './submesh';
import { ConstantBuffers } from './constantbuffers';
import { ShaderType, ShaderTech } from './shader';
import { RenderTargetState } from './rendertarget';
import { Texture } from './texture';
import * as settings from './settings';
import { Renderer } from './glrenderer';
import { VertexBase } from './vertex';

export interface Viewport {
	x: number;
	y: number;
	width: number;
	height: number;
}

export class Context {

	constructor(gl: WebGL2RenderingContext) {
		this.gl = gl;
		this.setupGL();
	}

	setupGL() {
		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.depthFunc(this.gl.LESS);

		if (settings.enableBlending) {
			this.gl.enable(this.gl.BLEND);
		} else {
			this.gl.disable(this.gl.BLEND);

		}


		this.screenViewPort = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };

		// disable depth writes for actual render after prepass
		//	this.gl.depthMask(false);
		// disable color writes for depth texture prepass
		// gl.colorMask(red, green, blue, alpha); false all + possibly null fragment shader

	}

	resize(width: number, height: number) {
		this.setViewport({ x: 0, y: 0, width, height });
	}

	clear(flags: number) {
		this.gl.clear(flags);
	}

	clearColor(red: number, green: number, blue: number, alpha: number) {
		this.gl.clearColor(red, green, blue, alpha);
	}

	viewport() {
		this.gl.viewport(this.screenViewPort.x, this.screenViewPort.y, this.screenViewPort.width, this.screenViewPort.height);
	}

	setViewport(viewport: Viewport) {
		this.screenViewPort = viewport;
		this.viewport();
	}

	drawIndexed(mode: number, shader: ShaderType, tech: ShaderTech) {

		ConstantBuffers.Syncronize(this.gl, shader, tech);
		Renderer.numDrawCallsPerFrame++;

		this.gl.bindVertexArray(this.vertexArrayObject.vao);
		this.gl.drawElements(mode, this.numIndices, this.gl.UNSIGNED_SHORT, 0);
		this.gl.bindVertexArray(null);
	}

	draw(mode: number, shader: ShaderType, tech: ShaderTech) {

		ConstantBuffers.Syncronize(this.gl, shader, tech);
		Renderer.numDrawCallsPerFrame++;

		this.gl.bindVertexArray(this.vertexArrayObject.vao);
		this.gl.drawArrays(mode, 0, this.numVertices);
		this.gl.bindVertexArray(null);
	}

	setVertexAndIndexBuffers(submesh: Submesh<VertexBase>) {
		if (this.vertexArrayObject !== submesh.vertexArrayObject) {
			this.numIndices = submesh.indices.length;
			this.numVertices = submesh.vertices.length;
			this.vertexArrayObject = submesh.vertexArrayObject;
		}
	}

	renderTargetBegin(rts: RenderTargetState) {

		RenderTargetState.renderTargetStack.push(rts);

		let numColorAttachments = 0;

		for (let index = 0; index < RenderTargetState.NUM_RENDERTARGETS; index++) {
			if (rts.colorTargets[index]) {
				numColorAttachments++;
			}
		}

		let colorAttachments: number[] = [];

		for (let index = 0; index < numColorAttachments; index++) {
			colorAttachments.push(this.gl.COLOR_ATTACHMENT0 + index);
		}

		this.gl.drawBuffers(colorAttachments.length === 0 ? [this.gl.BACK] : colorAttachments);


		// set render targets (max 4)
		rts.setRenderTarget(this.gl);

		// set view port
		this.gl.viewport(rts.viewport.x, rts.viewport.y, rts.viewport.width, rts.viewport.height);
	}

	renderTargetEnd() {

		const previous = RenderTargetState.renderTargetStack.pop();
		this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
		previous.destroy(this.gl);

		// if there are still render targets states
		if (RenderTargetState.renderTargetStack.length > 0) {

			const renderTargetState = RenderTargetState.renderTargetStack[RenderTargetState.renderTargetStack.length - 1];

			// set render targets
			renderTargetState.setRenderTarget(this.gl);


			let numColorAttachments = 0;

			for (let index = 0; index < RenderTargetState.NUM_RENDERTARGETS; index++) {
				if (renderTargetState.colorTargets[index]) {
					numColorAttachments++;
				}
			}

			let colorAttachments: number[] = [];

			for (let index = 0; index < numColorAttachments; index++) {
				colorAttachments.push(this.gl.COLOR_ATTACHMENT0 + index);
			}

			this.gl.drawBuffers(colorAttachments.length === 0 ? [this.gl.NONE] : colorAttachments);

			// set viewport
			this.gl.viewport(renderTargetState.viewport.x, renderTargetState.viewport.y,
				renderTargetState.viewport.width, renderTargetState.viewport.height);

		} else {
			// there are no render targets left so bind to back buffer
			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		}

	}

	renderToCubeMapFace(colorTargetIndex: number, faceIndex: number, mipLevel: number, targetCubeMapTexture: Texture, render: () => void) {
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0 + colorTargetIndex,
			this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, targetCubeMapTexture.textureId, mipLevel);
		render();
	}

	vertexArrayObject: VertexArrayObject<VertexBase>;
	numIndices: number;
	numVertices: number;

	screenViewPort: Viewport;

	gl: WebGL2RenderingContext;

}