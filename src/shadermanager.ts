
import { Shader, ShaderType, ShaderTech } from './shader';
import * as shaderSrc from './shadersources';
//import { vsSource, fsSource } from './uitests/matrixprecalctest';

const shaders: { [id: number]: Shader } = {};

function LoadShader(gl: WebGL2RenderingContext, vertexSrc: string, fragmentSrc: string, type: ShaderType) {
	const shader = new Shader(type);

	if (type === ShaderType.PBR) {
		const techs = ShaderTech.permutePBRShaders({ morphed: false });
		for (let techName in techs) {
			shader.addTechnique(gl, techName, techs[techName].pbrVsSrc, techs[techName].pbrFsSrc);
			shader.techniques[techName].bindTo(gl, 'MatricesPerFrame', 0);
			shader.techniques[techName].bindTo(gl, 'PerObject', 1);
			shader.techniques[techName].bindTo(gl, 'Lights', 2);
		}
	} else if(type === ShaderType.MORPHED_PBR) {
		const techs = ShaderTech.permutePBRShaders({ morphed: true });
		for(let techName in techs) {
			shader.addTechnique(gl, techName, techs[techName].pbrVsSrc, techs[techName].pbrFsSrc);
			shader.techniques[techName].bindTo(gl, 'MatricesPerFrame', 0);
			shader.techniques[techName].bindTo(gl, 'PerObject', 1);
			shader.techniques[techName].bindTo(gl, 'Lights', 2);
			shader.techniques[techName].bindTo(gl, 'Data', 3);
		}
	} else {

		if (type === ShaderType.VISUALIZE_NORMALS) {
			const src = shaderSrc.GetPbrSrc(false, false, false, false, false, false);
			shader.addTechnique(gl, 'default', src.pbrVsSrc, fragmentSrc);
			shader.techniques['default'].bindTo(gl, 'MatricesPerFrame', 0);
			shader.techniques['default'].bindTo(gl, 'PerObject', 1);

		} else if (type === ShaderType.PARTICLE_UPDATE) {

			shader.addTechnique(gl, 'default', vertexSrc, fragmentSrc, [
				'positionW',
				'velocityW',
				'currentAge',
				'currentLife'
			]);

			shader.techniques['default'].bindTo(gl, 'Particle', 4);

		} else if (type === ShaderType.BILLBOARD_PARTICLE) {
			shader.addTechnique(gl, 'default', vertexSrc, fragmentSrc);
			shader.techniques['default'].bindTo(gl, 'MatricesPerFrame', 0);
			shader.techniques['default'].bindTo(gl, 'Lights', 2);
		} else if (type === ShaderType.TERRAIN) {

			const src = shaderSrc.GetTerrainSrc(true, true, true, true, true, false);
			shader.addTechnique(gl, 'default', src.vsSrc, src.fsSrc);
			shader.techniques['default'].bindTo(gl, 'MatricesPerFrame', 0);
			shader.techniques['default'].bindTo(gl, 'PerObject', 1);
			shader.techniques['default'].bindTo(gl, 'Lights', 2);
			shader.techniques['default'].bindTo(gl, 'Data', 3);
		} else if (type === ShaderType.VISUALIZE_NORMALS_TERRAIN) {

			const src = shaderSrc.GetPbrSrc(false, false, false, false, false, false);
			shader.addTechnique(gl, 'default', src.pbrVsSrc, shaderSrc.visualizeNormalMapsTerrainFsSrc);
			shader.techniques['default'].bindTo(gl, 'MatricesPerFrame', 0);
			shader.techniques['default'].bindTo(gl, 'PerObject', 1);
			//	shader.techniques['default'].bindTo(gl, 'Lights', 2);
			shader.techniques['default'].bindTo(gl, 'Data', 3);
		} else {
			shader.addTechnique(gl, 'default', vertexSrc, fragmentSrc);
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
		shader.addTechnique(gl, 'default', vertexSrc, fragmentSrc);
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
	LoadShader(gl, null, null, ShaderType.PBR);
	LoadShader(gl, null, null, ShaderType.MORPHED_PBR);
	LoadShader(gl, shaderSrc.fillScreenVsSrc, shaderSrc.fillScreenFsSrc, ShaderType.FILL_SCREEN);
	LoadShader(gl, shaderSrc.fillScreenVsSrc, shaderSrc.brdfFsSrc, ShaderType.BRDF_INTEGRATION);
	LoadShader(gl, shaderSrc.skyboxVsSrc, shaderSrc.skyboxFsSrc, ShaderType.SKYBOX);
	LoadShader(gl, shaderSrc.irradianceVsSrc, shaderSrc.irradianceFsSrc, ShaderType.IRRADIANCE);
	LoadShader(gl, shaderSrc.prefilterVsSrc, shaderSrc.prefilterFsSrc, ShaderType.PREFILTER_ENV_MAP);
	LoadShader(gl, shaderSrc.fillScreenVsSrc, shaderSrc.tonemappingFsSrc, ShaderType.TONEMAPPING);
	LoadShader(gl, shaderSrc.fillScreenVsSrc, shaderSrc.grayScaleFsSrc, ShaderType.GRAY_SCALE);
	LoadShader(gl, shaderSrc.fillScreenVsSrc, shaderSrc.bloomFsSrc, ShaderType.BLOOM);
	LoadShader(gl, shaderSrc.fillScreenVsSrc, shaderSrc.sharpEdgesFsSrc, ShaderType.SHARP_EDGES);
	LoadShader(gl, shaderSrc.fillScreenVsSrc, shaderSrc.gaussianBlurFsSrc, ShaderType.GAUSSIAN_BLUR);
	LoadShader(gl, shaderSrc.fillScreenVsSrc, shaderSrc.visualizeDepthFsSrc, ShaderType.VISUALIZE_DEPTH);
	LoadShader(gl, shaderSrc.shadowMapVsSrc, shaderSrc.shadowMapFsSrc, ShaderType.SHADOW_MAP);
	LoadShader(gl, shaderSrc.skyboxVsSrc, shaderSrc.skyboxDepthFsSrc, ShaderType.VISUALIZE_CUBEMAP_DEPTH);
	LoadShader(gl, null, shaderSrc.visualizeNormalsFsSrc, ShaderType.VISUALIZE_NORMALS);
	LoadShader(gl, null, null, ShaderType.TERRAIN);
	LoadShader(gl, null, null, ShaderType.VISUALIZE_NORMALS_TERRAIN);
	LoadShader(gl, shaderSrc.particleUpdateVsSrc, shaderSrc.particleUpdateFsSrc, ShaderType.PARTICLE_UPDATE);
	LoadShader(gl, shaderSrc.billboardParticleVsSrc, shaderSrc.billboardParticleFsSrc, ShaderType.BILLBOARD_PARTICLE);
	LoadShader(gl, shaderSrc.overlayVsSrc, shaderSrc.overlayFsSrc, ShaderType.OVERLAY);
}