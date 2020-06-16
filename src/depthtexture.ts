export class DepthTexture {

	constructor() {
		this.isCubeMap = false;
	}

	static create(gl: WebGL2RenderingContext, width: number, height: number) {
		// create a depth texture
		const depthTextureId = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, depthTextureId);

		const depthTexture = new DepthTexture();
		depthTexture.textureId = depthTextureId;
		depthTexture.isCubeMap = false;

		// make a depth buffer and the same size as the targetTexture
		// define size and format of level 0
		const level = 0;
		const internalFormat = gl.DEPTH_COMPONENT24;
		const border = 0;
		const format = gl.DEPTH_COMPONENT;
		const type = gl.UNSIGNED_INT;
		const data = null;
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
			width, height, border,
			format, type, data);

		// set the filtering so we don't need mips
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		gl.bindTexture(gl.TEXTURE_2D, null);


		return depthTexture;
	}

	static createRenderTargetCubeMap(gl: WebGL2RenderingContext, width: number, height: number) {

		const depthTextureId = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, depthTextureId);

		const depthTexture = new DepthTexture();
		depthTexture.textureId = depthTextureId;
		depthTexture.isCubeMap = true;

		const level = 0;
		const internalFormat = gl.DEPTH_COMPONENT24;
		const border = 0;
		const format = gl.DEPTH_COMPONENT;
		const type = gl.UNSIGNED_INT;
		const data = null;

		for (let face = 0; face < 6; face++) {
			gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, level, internalFormat,
				width, height, border,
				format, type, data);
		}

		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

		gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

		return depthTexture;
	}

	destroy(gl: WebGL2RenderingContext) {
		gl.deleteTexture(this.textureId);
	}

	isCubeMap: boolean;
	textureId: WebGLTexture;
}