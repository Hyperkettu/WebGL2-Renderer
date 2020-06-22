import { Texture } from './texture';
import { ShaderType, Shader } from './shader';
import * as texture from './texturemanager';
import * as resource from './resource';

export const materials: { [id: string]: Material } = {};

export function GetMaterial(name: string) {
	return materials[name];
}

export interface Material {
	textures?: Texture[];
	shader?: ShaderType;
	tech?: string;
	name?: string;
}

export interface MaterialFile {
	material: MaterialData;
}

export interface MaterialData {
	name: string;
	shader: 'pbr' | 'morphed-pbr';
	tech: string;
	textures: texture.TextureData[];
}

export async function loadMaterial(path: string, load: boolean = false, gl: WebGL2RenderingContext = null) {
	if (load) {
		await resource.loadFile<MaterialFile>(path);
	}
	const file: MaterialFile = resource.get<MaterialFile>(path);
	const material: Material = {};
	material.name = file.material.name;
	material.shader = file.material.shader === 'pbr' ? ShaderType.PBR : ShaderType.MORPHED_PBR;
	material.tech = file.material.tech;

	material.textures = [];
	for (let textureData of file.material.textures) {
		if (load) {
			await texture.LoadTexture(gl, textureData.path, texture.getType(textureData));
		}
		material.textures[texture.getType(textureData) as number] = texture.GetTexture(textureData.path);
	}
	materials[material.name] = material;
}