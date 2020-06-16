
export enum TextureType {
	Albedo = 0,
	Normal,
	Roughness,
	Metallic,
	Ambient_Occlusion,
	Displacement,
	Emission,
	Max_Types
}

export class Texture {
	constructor() { }

	async loadTexture(gl?: WebGL2RenderingContext, path?: string | string[], type?: TextureType, cubeMap: boolean = false) {
		this.isCubeMap = cubeMap;

		if (gl && !cubeMap) {
			this.type = type;
			this.isCubeMap = cubeMap;
			this.textureId = await this.loadTextureInternal(gl, path, gl.RGBA, gl.RGBA, gl.REPEAT, gl.LINEAR_MIPMAP_LINEAR);
		}

	}

	loadTextureInternal(gl: WebGL2RenderingContext, path: string | string[], internalFormatParam?: number, format?: number, wrapModeParam?: number, minificationFilter?: number) {

		const promise = new Promise<WebGLTexture>((resolve, reject) => {

			const textureId = gl.createTexture();
			gl.bindTexture(this.isCubeMap ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, textureId);
			const level = 0;
			const internalFormat = internalFormatParam ? internalFormatParam : gl.RGBA;
			const srcFormat = format ? format : gl.RGBA;
			const border = 0;
			const width = 1;
			const height = 1;
			const srcType = gl.UNSIGNED_BYTE;
			const textureType = this.isCubeMap ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;
			const wrapMode = wrapModeParam ? wrapModeParam : gl.REPEAT;
			const minification = minificationFilter ? minificationFilter : gl.LINEAR_MIPMAP_LINEAR;

			const pixel = internalFormat === gl.RGB ? new Uint8Array([0, 0, 255]) : new Uint8Array([0, 0, 255, 255]);  // opaque blue

			let imagePaths: string[] = [];

			if (this.isCubeMap) {
				imagePaths = path as string[];
			} else {
				imagePaths.push(path as string);
			}

			for (let i = 0; i < imagePaths.length; i++) {

				gl.texImage2D(this.isCubeMap ? gl.TEXTURE_CUBE_MAP_POSITIVE_X + i : gl.TEXTURE_2D, level, internalFormat,
					width, height, border, srcFormat, srcType, pixel);

				let self = this;

				const image = new Image();
				image.onload = function () {
					gl.bindTexture(textureType, textureId);

					if (!self.isCubeMap) {
						gl.texImage2D(textureType, level, internalFormat,
							srcFormat, srcType, image);
					} else {
						gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, level, internalFormat, format, gl.UNSIGNED_BYTE, image);
					}

					gl.texParameteri(textureType, gl.TEXTURE_MIN_FILTER, minification);
					gl.texParameteri(textureType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
					gl.texParameteri(textureType, gl.TEXTURE_WRAP_S, wrapMode);
					gl.texParameteri(textureType, gl.TEXTURE_WRAP_T, wrapMode);
					if (self.isCubeMap) {
						gl.texParameteri(textureType, gl.TEXTURE_WRAP_R, wrapMode);
					} else {

						let ext = (
							gl.getExtension('EXT_texture_filter_anisotropic') ||
							gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
							gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
						);
						if (ext) {
							const maxAnisotropy = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
							gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, maxAnisotropy);
						}

						gl.generateMipmap(gl.TEXTURE_2D);
					}

					self.width = image.width;
					self.height = image.height;

					if (self.isCubeMap && i === 5) {
						resolve(textureId);
					} else {
						resolve(textureId);
					}
				};
				image.src = imagePaths[i];
			}
			if (this.isCubeMap) {
				gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
			}
			this.path = typeof path === 'string' ? path : path[0];

			//	return textureId;
		});

		return promise;
	}


	static createRenderTarget(gl: WebGL2RenderingContext, internalFormat: number, format: number, width: number, height: number, type?: number, minificationFilter?: number, cubeMap: boolean = false, magnificationFilter?: number) {

		const texture = new Texture();

		texture.width = width;
		texture.height = height;

		const texId: WebGLTexture = gl.createTexture();

		if (cubeMap) {
			texture.isCubeMap = true;
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, texId);

			for (let i = 0; i < 6; i++) {
				gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, internalFormat, width, height, 0,
					format, type, null);
			}

		} else {
			gl.bindTexture(gl.TEXTURE_2D, texId);
			gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type ? type : gl.FLOAT, null);
		}
		gl.texParameteri(cubeMap ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(cubeMap ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		if (cubeMap) {
			gl.texParameteri(cubeMap ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
		}
		gl.texParameteri(cubeMap ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(cubeMap ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);



		if (cubeMap) {
			gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, minificationFilter);
			gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
		} else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minificationFilter);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magnificationFilter ? magnificationFilter: gl.LINEAR);
		}

		gl.bindTexture(cubeMap ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, null);

		texture.textureId = texId;
		return texture;
	}

	destroy(gl: WebGL2RenderingContext) {
		gl.deleteTexture(this.textureId);
	}

	static async LoadTexture2DArray(gl: WebGL2RenderingContext, path: string, numImages: number, internalFormatParam?: number, format?: number, wrapModeParam?: number, minificationFilter?: number) {
		const texture = new Texture();
		texture.textureId = await texture.loadTexture2DArray(gl, path, numImages, internalFormatParam, format, wrapModeParam, minificationFilter);
		return texture;
	}

	loadTexture2DArray(gl: WebGL2RenderingContext, path: string, numImages: number, internalFormatParam?: number, format?: number, wrapModeParam?: number, minificationFilter?: number) {

		const promise = new Promise<WebGLTexture>((resolve, reject) => {

			const textureId = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D_ARRAY, textureId);
			const level = 0;
			const internalFormat = internalFormatParam ? internalFormatParam : gl.RGBA;
			const srcFormat = format ? format : gl.RGBA;
			const border = 0;
			const width = 1;
			const height = 1;
			const srcType = gl.UNSIGNED_BYTE;
			const wrapMode = wrapModeParam ? wrapModeParam : gl.REPEAT;
			const minification = minificationFilter ? minificationFilter : gl.LINEAR_MIPMAP_LINEAR;

			const pixel = internalFormat === gl.RGB ? new Uint8Array([0, 0, 255]) : new Uint8Array([0, 0, 255, 255]);  // opaque blue

			gl.texImage3D(gl.TEXTURE_2D_ARRAY, level, internalFormat,
				width, height, numImages, border, srcFormat, srcType, new Uint8Array(internalFormat === gl.RGB ? 3 * numImages : 4 * numImages));

			let self = this;

			const image = new Image();
			image.onload = function () {
				gl.bindTexture(gl.TEXTURE_2D_ARRAY, textureId);

				gl.texImage3D(gl.TEXTURE_2D_ARRAY, level, internalFormat, image.width, image.height / numImages, numImages,
					border, srcFormat, srcType, image);


				gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, minification);
				gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, wrapMode);
				gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, wrapMode);

				let ext = (
					gl.getExtension('EXT_texture_filter_anisotropic') ||
					gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
					gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
				);
				if (ext) {
					const maxAnisotropy = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
					gl.texParameterf(gl.TEXTURE_2D_ARRAY, ext.TEXTURE_MAX_ANISOTROPY_EXT, maxAnisotropy);
				}

				gl.generateMipmap(gl.TEXTURE_2D_ARRAY);


				self.width = image.width;
				self.height = image.height;

				resolve(textureId);

			};
			image.src = path;
			this.path = path;
		});

		return promise;
	}

	width: number;
	height: number;
	path: string;
	type: TextureType;
	textureId: WebGLTexture;
	isCubeMap: boolean;

}