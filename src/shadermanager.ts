
import { Shader, ShaderType, ShaderTech } from './shader';
import { getShaderSource, init } from './shaders/shadersources';

const shaders: { [id: number]: Shader } = {};

function LoadShader(gl: WebGL2RenderingContext, vertexPrefix: string, fragmentPrefix: string, type: ShaderType) {
	const shader = new Shader(type);

	if (type === ShaderType.PBR) {
		const techs = ShaderTech.permutePBRShaders();
		for (let techName of techs) {
			shader.addTechnique(gl, techName, getShaderSource(`${vertexPrefix}/${techName}`), getShaderSource(`${fragmentPrefix}/${techName}`));
			shader.techniques[techName].bindTo(gl, 'MatricesPerFrame', 0);
			shader.techniques[techName].bindTo(gl, 'PerObject', 1);
			shader.techniques[techName].bindTo(gl, 'Lights', 2);
		}
	} else if(type === ShaderType.MORPHED_PBR) {
		const techs = ShaderTech.permutePBRShaders();
		for(let techName of techs) {
			shader.addTechnique(gl, techName, getShaderSource(`${vertexPrefix}/${techName}`), getShaderSource(`${fragmentPrefix}/${techName}`));
			shader.techniques[techName].bindTo(gl, 'MatricesPerFrame', 0);
			shader.techniques[techName].bindTo(gl, 'PerObject', 1);
			shader.techniques[techName].bindTo(gl, 'Lights', 2);
			shader.techniques[techName].bindTo(gl, 'Data', 3);
		}
	} else {

		if (type === ShaderType.VISUALIZE_NORMALS) {
			shader.addTechnique(gl, 'normals', getShaderSource(vertexPrefix), getShaderSource(`${fragmentPrefix}/normals`));
			shader.addTechnique(gl, 'normalMap', getShaderSource(vertexPrefix), getShaderSource(`${fragmentPrefix}/normalMap`));
			shader.techniques['normals'].bindTo(gl, 'MatricesPerFrame', 0);
			shader.techniques['normals'].bindTo(gl, 'PerObject', 1);

			shader.techniques['normalMap'].bindTo(gl, 'MatricesPerFrame', 0);
			shader.techniques['normalMap'].bindTo(gl, 'PerObject', 1);

		} else if (type === ShaderType.PARTICLE_UPDATE) {

			shader.addTechnique(gl, 'default', getShaderSource(vertexPrefix), getShaderSource(fragmentPrefix), [
				'positionW',
				'velocityW',
				'currentAge',
				'currentLife'
			]);

			shader.techniques['default'].bindTo(gl, 'Particle', 4);

		} else if (type === ShaderType.BILLBOARD_PARTICLE) {
			shader.addTechnique(gl, 'default', getShaderSource(vertexPrefix), getShaderSource(fragmentPrefix));
			shader.techniques['default'].bindTo(gl, 'MatricesPerFrame', 0);
			shader.techniques['default'].bindTo(gl, 'Lights', 2);
		} else if (type === ShaderType.TERRAIN) {
			const techs = ShaderTech.permutePBRShaders();
			for(let techName of techs) {
				shader.addTechnique(gl, techName, getShaderSource(`${vertexPrefix}/${techName}`), getShaderSource(`${fragmentPrefix}/${techName}`));
				shader.techniques[techName].bindTo(gl, 'MatricesPerFrame', 0);
				shader.techniques[techName].bindTo(gl, 'PerObject', 1);
				shader.techniques[techName].bindTo(gl, 'Lights', 2);
				shader.techniques[techName].bindTo(gl, 'Data', 3);
			}

		} else if (type === ShaderType.VISUALIZE_NORMALS_TERRAIN) {

			shader.addTechnique(gl, 'default', getShaderSource(vertexPrefix), getShaderSource(fragmentPrefix));
			shader.techniques['default'].bindTo(gl, 'MatricesPerFrame', 0);
			shader.techniques['default'].bindTo(gl, 'PerObject', 1);
			shader.techniques['default'].bindTo(gl, 'Data', 3);
		} else {
			shader.addTechnique(gl, 'default', getShaderSource(vertexPrefix), getShaderSource(fragmentPrefix));
		}
	}

	if (type === ShaderType.SHADOW_MAP) {
		shader.techniques['default'].bindTo(gl, 'MatricesPerFrame', 0);
		shader.techniques['default'].bindTo(gl, 'PerObject', 1);
	}

	if (type === ShaderType.SKYBOX || type === ShaderType.VISUALIZE_CUBEMAP_DEPTH ||
		type === ShaderType.IRRADIANCE || type === ShaderType.PREFILTER_ENV_MAP) {
		shader.techniques['default'].bindTo(gl, 'MatricesPerFrame', 0);
	}

	if (type === ShaderType.PREFILTER_ENV_MAP || type === ShaderType.IRRADIANCE || type === ShaderType.GAUSSIAN_BLUR ||
		type === ShaderType.SHADOW_MAP || type === ShaderType.VISUALIZE_CUBEMAP_DEPTH ||
		type === ShaderType.VISUALIZE_DEPTH || type === ShaderType.TONEMAPPING || type === ShaderType.SKYBOX) {
		shader.techniques['default'].bindTo(gl, 'Data', 3);
	}

	if(type === ShaderType.OVERLAY) {
		shader.addTechnique(gl, 'default', getShaderSource(vertexPrefix), getShaderSource(fragmentPrefix));
		shader.techniques['default'].bindTo(gl, 'OverlayMatrices', 5);
	}

	shaders[type as number] = shader;
}

export function GetShader(type: ShaderType, techName: string = 'default') {
	return shaders[type].techniques[techName];
}

export function GetShaderOfType(type: ShaderType) {
	return shaders[type];
}

export function LoadShaders(gl: WebGL2RenderingContext) {

	init();

	LoadShader(gl, 'pbrStaticVS', 'pbrStaticFS', ShaderType.PBR);
	LoadShader(gl, 'pbrMorphedVS', 'pbrMorphedFS', ShaderType.MORPHED_PBR);
	LoadShader(gl, 'fillScreenVS', 'fillScreenFS', ShaderType.FILL_SCREEN);
	LoadShader(gl, 'fillScreenVS', 'brdfIntegrationFS', ShaderType.BRDF_INTEGRATION);
	LoadShader(gl, 'skyboxVS', 'skyboxFS', ShaderType.SKYBOX);
	LoadShader(gl, 'irradianceVS', 'irradianceFS', ShaderType.IRRADIANCE);
	LoadShader(gl, 'prefilterVS', 'prefilterFS', ShaderType.PREFILTER_ENV_MAP);
	LoadShader(gl, 'fillScreenVS', 'toneMappingFS', ShaderType.TONEMAPPING);
	LoadShader(gl, 'fillScreenVS', 'grayScaleFS', ShaderType.GRAY_SCALE);
	LoadShader(gl, 'fillScreenVS', 'bloomFS', ShaderType.BLOOM);
	LoadShader(gl, 'fillScreenVS', 'sharpEdgeFS', ShaderType.SHARP_EDGES);
	LoadShader(gl, 'fillScreenVS', 'gaussianBlurFS', ShaderType.GAUSSIAN_BLUR);
	LoadShader(gl, 'fillScreenVS', 'visualizeDepthFS', ShaderType.VISUALIZE_DEPTH);
	LoadShader(gl, 'shadowMapVS', 'shadowMapFS', ShaderType.SHADOW_MAP);
	LoadShader(gl, 'skyboxVS', 'visualizeDepthCubemapFS', ShaderType.VISUALIZE_CUBEMAP_DEPTH);
	LoadShader(gl, 'pbrStaticVS/A', 'visualizeNormalsFS', ShaderType.VISUALIZE_NORMALS);
	LoadShader(gl, 'terrainVS', 'terrainFS', ShaderType.TERRAIN);
	LoadShader(gl, 'pbrStaticVS/A', 'visualizeTerrainNormalMapsFS', ShaderType.VISUALIZE_NORMALS_TERRAIN);
	LoadShader(gl, 'particleUpdateVS', 'particleUpdateFS', ShaderType.PARTICLE_UPDATE);
	LoadShader(gl, 'billboardParticleVS', 'billboardParticleFS', ShaderType.BILLBOARD_PARTICLE);
	LoadShader(gl, 'overlayVS', 'overlayFS', ShaderType.OVERLAY);
}