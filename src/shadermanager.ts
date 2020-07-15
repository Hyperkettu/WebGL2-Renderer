
import { Shader, ShaderType, ShaderTech, TechniqueFile, ShaderData, TechniqueData } from './shader';
import { getShaderSource, init } from './shaders/shadersources';
import { loadFile } from './resource';

const shaders: { [id: number]: Shader } = {};

let techniques: TechniqueFile[] = []; 

function LoadShader(gl: WebGL2RenderingContext, vertexPrefix: string, fragmentPrefix: string, type: ShaderType) {
	const shader = new Shader(type);

	if (type === ShaderType.PARTICLE_UPDATE) {

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
		} else {
			shader.addTechnique(gl, 'default', getShaderSource(vertexPrefix), getShaderSource(fragmentPrefix));
		}

	if (type === ShaderType.GAUSSIAN_BLUR ||
		type === ShaderType.VISUALIZE_DEPTH || type === ShaderType.TONEMAPPING) {
		shader.techniques['default'].bindTo(gl, 'Data', 3);
	}

	shaders[type as number] = shader;
}

export function GetShader(type: ShaderType, techName: string = 'default') {
	return shaders[type].techniques[techName];
}

export function GetShaderOfType(type: ShaderType) {
	return shaders[type];
}

export async function LoadTechniques() {
	const promises: Promise<TechniqueFile>[] = [];
	promises.push(loadFile<TechniqueFile>('techniques/staticpbr.technique'));
	promises.push(loadFile<TechniqueFile>('techniques/morphedpbr.technique'));
	promises.push(loadFile<TechniqueFile>('techniques/visualizenormalsstatic.technique'));
	promises.push(loadFile<TechniqueFile>('techniques/visualizenormalsmorphed.technique'));
	promises.push(loadFile<TechniqueFile>('techniques/terrainpbr.technique'));
	promises.push(loadFile<TechniqueFile>('techniques/visualizenormalsterrain.technique'));
	promises.push(loadFile<TechniqueFile>('techniques/irradiance.technique'));
	promises.push(loadFile<TechniqueFile>('techniques/prefilter.technique'));
	promises.push(loadFile<TechniqueFile>('techniques/skybox.technique'));
	promises.push(loadFile<TechniqueFile>('techniques/visualizecubemapdepth.technique'));
	promises.push(loadFile<TechniqueFile>('techniques/overlay.technique'));
	promises.push(loadFile<TechniqueFile>('techniques/shadowmap.technique'));
	promises.push(loadFile<TechniqueFile>('techniques/tonemapping.technique'));
	promises.push(loadFile<TechniqueFile>('techniques/grayscale.technique'));
	promises.push(loadFile<TechniqueFile>('techniques/bloom.technique'));
	promises.push(loadFile<TechniqueFile>('techniques/sharpedge.technique'));
	promises.push(loadFile<TechniqueFile>('techniques/gaussianblur.technique'));
	promises.push(loadFile<TechniqueFile>('techniques/visualizedepth.technique'));



	techniques = await Promise.all(promises);
}

function permuteShaders(techName:string, permutationVariables: string[]) {
	const permutations: string[] = [];
	permute(permutations, techName, permutationVariables, 0);
	return permutations;
}

function permute(permutations: string[], permutation: string, permutationVariables: string[], index: number) {
	
	if(index === permutationVariables.length) {
		permutations.push(permutation);
		return;
	}
	permute(permutations, permutation, permutationVariables, index + 1);
	permute(permutations, permutation + permutationVariables[index], permutationVariables, index + 1);
}

export function loadShaderFromData(gl: WebGL2RenderingContext, techniqueFile: TechniqueFile) {

	const shader = new Shader(techniqueFile.shaderId);
	const techs = permuteShaders(techniqueFile.technique.name, techniqueFile.technique.permutationVariables);

	for (let techName of techs) {
		for(let pass = 0; pass < techniqueFile.technique.passes.length; pass++) {
			const vertexPrefix = techniqueFile.technique.passes[pass].vertexShader;
			const fragmentPrefix = techniqueFile.technique.passes[pass].fragmentShader;

			let vertexTechName = 'V';

			if(techName.indexOf('D') > -1) {
				if(techName.indexOf('N') > -1) {
					vertexTechName = 'VND';
				} else {
					vertexTechName = 'VD';
				}
			} else {
				if(techName.indexOf('N') > -1) {
					vertexTechName = 'VN';
				} else {
					vertexTechName = 'V';
				}
			}
			let tech: ShaderTech = null; 
			if(techName === 'default') {
				tech = shader.addTechnique(gl, techName, getShaderSource(vertexPrefix), getShaderSource(fragmentPrefix));
			} else {
				tech = shader.addTechnique(gl, techName, getShaderSource(`${vertexPrefix}/${vertexTechName}`), getShaderSource(`${fragmentPrefix}/${techName}`));
			}
			
			let vertexShader: ShaderData = null;
			let fragmentShader: ShaderData = null;

			for(let shaderIndex = 0; shaderIndex < techniqueFile.shaders.length; shaderIndex++) {
				if(techniqueFile.technique.passes[pass].vertexShader == techniqueFile.shaders[shaderIndex].source) {
					vertexShader = techniqueFile.shaders[shaderIndex];
				}
				if(techniqueFile.technique.passes[pass].fragmentShader == techniqueFile.shaders[shaderIndex].source) {
					fragmentShader = techniqueFile.shaders[shaderIndex];
				}
			}

			for(let uniform of vertexShader.uniforms) {
				if(uniform.type === 'buffer') {
				//	console.log('bindto', uniform.name, uniform.bindIndex, vertexShader.source); //, getShaderSource(`${vertexPrefix}/${vertexTechName}`));
					tech.bindTo(gl, uniform.name, uniform.bindIndex);
				}
			}
			for(let uniform of fragmentShader.uniforms) {
				if(uniform.type === 'buffer') {
				//	console.log('bindto', uniform.name, uniform.bindIndex, fragmentShader.source);
					tech.bindTo(gl, uniform.name, uniform.bindIndex);
				}
			}

			tech.vertexShaderData = vertexShader;
			tech.fragmentShaderData = fragmentShader;
		}
	}
	shaders[techniqueFile.shaderId as number] = shader;
}

export function LoadShaders(gl: WebGL2RenderingContext) {

	init();

	for(let technique of techniques) {
		loadShaderFromData(gl, technique);
	}

	LoadShader(gl, 'fillScreenVS', 'fillScreenFS', ShaderType.FILL_SCREEN);
	LoadShader(gl, 'fillScreenVS', 'brdfIntegrationFS', ShaderType.BRDF_INTEGRATION);


	LoadShader(gl, 'particleUpdateVS', 'particleUpdateFS', ShaderType.PARTICLE_UPDATE);
	LoadShader(gl, 'billboardParticleVS', 'billboardParticleFS', ShaderType.BILLBOARD_PARTICLE);
}