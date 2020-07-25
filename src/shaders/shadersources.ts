// overlay
import * as overlayVs from './overlayvs';
import * as overlayFs from './overlayfs';
import * as overlayMaskFS from './overlaywithmask';

// particle systems
import * as billboardParticleFS from './billboardparticlefs';
import * as billboardParticleVS from './billboardparticlevs';
import * as particleUpdateVS from './particleupdatevs';
import * as particleUpdateFS from './particleupdatefs';

// terrain
import * as terrain from './terrain';

// visualization
import * as visualizeTerrainNormalMaps from './visualizenormalmapsterrainfs';
import * as visualizeNormals from './visualizenormalsfs';
import * as visuzalizeDepthCubemapFS from './cubemapdepthfs';
import * as visualizeDepthFS from './visualizedepthfs';
import * as linesVS from './linesvs'
import * as linesFS from './linesfs'


// shadow map
import * as shadowMapVS from './shadowmapvs';
import * as shadowMapFS from './shadowmapfs';
import * as dirLightShadowMapVS from './dirlightshadowmapvs';
import * as dirLightShadowMapFS from './dirlightshadowmapfs';

// post process
import * as sharpEdgeFS from './sharpedgefs';
import * as gaussianBlurFS from './gaussianblurfs';
import * as bloomFS from './bloomfs';
import * as grayScaleFS from './grayscalefs';
import * as toneMappingFS from './tonemappingfs';
import * as inversionFS from './inversionfs';

// fill screen
import * as fillScreenVS from './fillscreenvs';
import * as fillScreenFS from './fillscreenfs';

// skybox
import * as skyboxVS from './skyboxvs';
import * as skyboxFS from './skyboxfs';

// precompute PBR
import * as prefilterVS from './prefiltervs';
import * as prefilterFS from './prefilterfs';
import * as irradianceVS from './irradiancevs';
import * as irradianceFS from './irradiancefs';
import * as brdfFS from './brdffs';

// PBR
import * as pbrStatic from './pbrstatic';
import * as pbrMorphed from './pbrmorphed';
import * as billboard from './billboardvs';

import * as billboardFS from './billboardfs';

// custom
import * as pbrMorphedTextureTransform from './pbr-morphed-texture-transform';

const prefixToShaderSource: {[name: string]: string } = {};

export function getShaderSource(prefix: string) {
	return prefixToShaderSource[prefix];
}

export function init() {

	// overlay
	prefixToShaderSource[overlayVs.prefix] = overlayVs.overlayVsSrc;
	prefixToShaderSource[overlayFs.prefix] = overlayFs.overlayFsSrc;
	prefixToShaderSource[overlayMaskFS.prefix] = overlayMaskFS.overlayFsSrc;

	// particle effects
	prefixToShaderSource[billboardParticleVS.prefix] = billboardParticleVS.billboardParticleVsSrc;
	prefixToShaderSource[billboardParticleFS.prefix] = billboardParticleFS.billboardParticleFsSrc;

	prefixToShaderSource[particleUpdateVS.prefix] = particleUpdateVS.particleUpdateVsSrc;
	prefixToShaderSource[particleUpdateFS.prefix] = particleUpdateFS.particleUpdateFsSrc;

	// visualization
	prefixToShaderSource[`${visualizeTerrainNormalMaps.prefix}/VisN`] = visualizeTerrainNormalMaps.visualizeNormalMapsTerrainFsSrc;
	
	const visNormals = visualizeNormals.getVisualizeNormalsShaderSource(false);
	const visNormalMap = visualizeNormals.getVisualizeNormalsShaderSource(true);
	prefixToShaderSource[`${visualizeNormals.prefix}/Vis`] = visNormals;	
	prefixToShaderSource[`${visualizeNormals.prefix}/VisN`] = visNormalMap;

	prefixToShaderSource[visuzalizeDepthCubemapFS.prefix] = visuzalizeDepthCubemapFS.cubemapDepthFsSrc;
	prefixToShaderSource[visualizeDepthFS.prefix] = visualizeDepthFS.visualizeDepthFsSrc;

	prefixToShaderSource[linesVS.prefix] = linesVS.lineVsSrc;
	prefixToShaderSource[linesFS.prefix] = linesFS.lineFsSrc;


	// shadow map
	prefixToShaderSource[`${shadowMapVS.prefix}/V`] = shadowMapVS.getVsSrc(false);
	prefixToShaderSource[`${shadowMapVS.prefix}/VD`] = shadowMapVS.getVsSrc(true);

	prefixToShaderSource[`${shadowMapFS.prefix}/A`] = shadowMapFS.shadowMapFsSrc;
	prefixToShaderSource[`${shadowMapFS.prefix}/AD`] = shadowMapFS.shadowMapFsSrc;


	prefixToShaderSource[`${dirLightShadowMapVS.prefix}/V`] = dirLightShadowMapVS.getVsSrc(false);
	prefixToShaderSource[`${dirLightShadowMapVS.prefix}/VD`] = dirLightShadowMapVS.getVsSrc(true);

	prefixToShaderSource[`${dirLightShadowMapFS.prefix}/A`] = dirLightShadowMapFS.shadowMapFsSrc;
	prefixToShaderSource[`${dirLightShadowMapFS.prefix}/AD`] = dirLightShadowMapFS.shadowMapFsSrc;

	
	prefixToShaderSource[`${pbrMorphed.shadowMapPrefixVS}/V`] = pbrMorphed.getShadowSrc(false, false);
	prefixToShaderSource[`${pbrMorphed.shadowMapPrefixVS}/VD`] = pbrMorphed.getShadowSrc(true, false);

	prefixToShaderSource[`${pbrMorphed.pointLightShadowMapVS}/V`] = pbrMorphed.getShadowSrc(false, true);
	prefixToShaderSource[`${pbrMorphed.pointLightShadowMapVS}/VD`] = pbrMorphed.getShadowSrc(true, true);


	// post process
	prefixToShaderSource[sharpEdgeFS.prefix] = sharpEdgeFS.sharpEdgesFsSrc;
	prefixToShaderSource[gaussianBlurFS.prefix] = gaussianBlurFS.gaussianBlurFsSrc;
	prefixToShaderSource[bloomFS.prefix] = bloomFS.bloomFsSrc;
	prefixToShaderSource[grayScaleFS.prefix] = grayScaleFS.grayScaleFsSrc;
	prefixToShaderSource[toneMappingFS.prefix] = toneMappingFS.tonemappingFsSrc;
	prefixToShaderSource[inversionFS.prefix] = inversionFS.inversionFsSrc;

	// fill screen
	prefixToShaderSource[fillScreenVS.prefix] = fillScreenVS.fillScreenVsSrc;
	prefixToShaderSource[fillScreenFS.prefix] = fillScreenFS.fillScreenFsSrc;

	// skybox
	prefixToShaderSource[skyboxVS.prefix] = skyboxVS.skyboxVsSrc;
	prefixToShaderSource[skyboxFS.prefix] = skyboxFS.skyboxFsSrc;

	// pbr precompute
	prefixToShaderSource[prefilterVS.prefix] = prefilterVS.prefilterVsSrc;
	prefixToShaderSource[prefilterFS.prefix] = prefilterFS.prefilterFsSrc;
	prefixToShaderSource[irradianceVS.prefix] = irradianceVS.irradianceVsSrc;
	prefixToShaderSource[irradianceFS.prefix] = irradianceFS.irradianceFsSrc;
	prefixToShaderSource[brdfFS.prefix] = brdfFS.brdfFsSrc;

	// pbr
	const techs = iteratePBR(terrain.getTerrainSrc);

	for(let technique in techs.fragmentTechSources) {
		const sources = techs.fragmentTechSources[technique];
		prefixToShaderSource[`${terrain.prefixFS}/${technique}`] = sources.fsSrc;
	}

	for(let vertexTechnique in techs.vertexTechSources) {
		const sources = techs.vertexTechSources[vertexTechnique];
		prefixToShaderSource[`${terrain.prefixVS}/${vertexTechnique}`] = sources.vsSrc;
	}


	const staticPbrTechs = iteratePBR(pbrStatic.getPbrSrc);

	for(let technique in staticPbrTechs.fragmentTechSources) {
		const sources = staticPbrTechs.fragmentTechSources[technique];
		prefixToShaderSource[`${pbrStatic.prefixFS}/${technique}`] = sources.fsSrc;
	}

	for(let vertexTechnique in staticPbrTechs.vertexTechSources) {
		const sources = staticPbrTechs.vertexTechSources[vertexTechnique];
		prefixToShaderSource[`${pbrStatic.prefixVS}/${vertexTechnique}`] = sources.vsSrc;
	}


	const morphedPbrTechs = iteratePBR(pbrMorphed.getPbrSrc);

	for(let tech in morphedPbrTechs.fragmentTechSources) {
		const sources = morphedPbrTechs.fragmentTechSources[tech];
		prefixToShaderSource[`${pbrMorphed.prefixFS}/${tech}`] = sources.fsSrc;
	}	

	for(let vertexTechnique in staticPbrTechs.vertexTechSources) {
		const sources = morphedPbrTechs.vertexTechSources[vertexTechnique];
		prefixToShaderSource[`${pbrMorphed.prefixVS}/${vertexTechnique}`] = sources.vsSrc;
	}

	const morphedTextureTransformTechs = iteratePBR(pbrMorphedTextureTransform.getPbrSrc);
	
	for(let tech in morphedTextureTransformTechs.fragmentTechSources) {
		const source = morphedTextureTransformTechs.fragmentTechSources[tech];
		prefixToShaderSource[`${pbrMorphedTextureTransform.prefixFS}/${tech}`] = source.fsSrc;
	}

	for(let vertexTechnique in morphedTextureTransformTechs.vertexTechSources) {
		const source = morphedTextureTransformTechs.vertexTechSources[vertexTechnique];
		prefixToShaderSource[`${pbrMorphedTextureTransform.prefixVS}/${vertexTechnique}`] =  source.vsSrc;
	}

	prefixToShaderSource[`${billboard.prefix}/VN`] = billboard.billboardVsSrc;
	prefixToShaderSource[`${billboard.prefix}/V`] = billboard.billboardVsSrc;
	prefixToShaderSource[`${billboard.prefix}`] = billboard.billboardVsSrc;
	prefixToShaderSource[`${billboardFS.prefix}`] = billboardFS.billboardFsSrc;
	prefixToShaderSource[`${billboardFS.prefix}/A`] = billboardFS.billboardFsSrc;


}

function iteratePBR(func: (normal: boolean, roughness: boolean, metallic: boolean, ao: boolean, displacement: boolean, emission: boolean) => {vsSrc: string, fsSrc: string } ) {

		const fragmentTechSources: { [name: string]: { fsSrc: string } } = {};
		const vertexTechSources: { [name: string]: { vsSrc: string } } = {};

		for (let emission = 0; emission < 2; emission++) {
			for (let displacement = 0; displacement < 2; displacement++) {
				for (let ao = 0; ao < 2; ao++) {
					for (let metallic = 0; metallic < 2; metallic++) {
						for (let roughness = 0; roughness < 2; roughness++) {
							for (let normal = 0; normal < 2; normal++) {
								let techName = 'A';

								if (normal === 1) {
									techName += 'N';
								}
								if (roughness === 1) {
									techName += 'R';
								}
								if (metallic === 1) {
									techName += 'M';
								}
								if (ao === 1) {
									techName += 'A';
								}
								if (displacement === 1) {
									techName += 'D';
								}
								if (emission === 1) {
									techName += 'E';
								}

								fragmentTechSources[techName] = func(normal === 1,
									roughness === 1, metallic === 1, ao === 1, displacement === 1, emission === 1);
							}
						}
					}
				}
			}
		}

		vertexTechSources['VND'] = func(true, false, false, false, true, false);
		vertexTechSources['VN'] = func(true, false, false, false, false, false);
		vertexTechSources['VD'] = func(false, false, false, false, true, false);
		vertexTechSources['V'] = func(false, false, false, false, false, false);


	return { vertexTechSources, fragmentTechSources };
}

