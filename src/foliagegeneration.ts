import { Renderer } from "./glrenderer";
import { vec3, vec2, mat4, vec4 } from "gl-matrix";
import { Vertex, VertexBase } from "./vertex";
import * as math from './util/math';
import { StaticMesh } from "./mesh";
import * as mesh from './meshmanager';
import { SceneNode } from "./scenenode";
import { Layer } from "./batchrenderer";
import { GeometryGenerator } from "./geometrygenerator";
import * as material from "./material";

export class HermiteCubicSpline {
    constructor(startPoint: vec3, endPoint: vec3, derivativeStart: vec3, derivativeEnd: vec3) {
        this.startPoint = startPoint;
        this.endPoint = endPoint;
        this.derivativeStart = derivativeStart;
        this.derivativeEnd = derivativeEnd;
    }

    getPosition(t: number) {
        const t3 = t * t * t;
        const t2 = t * t;
        const position = vec3.create();
        vec3.copy(position, this.startPoint);
        vec3.scale(position, position, 2 * t3 - 3 * t2 + 1);
        vec3.scaleAndAdd(position, position, this.derivativeStart, t3  - 2 * t2 + t);
        vec3.scaleAndAdd(position, position, this.derivativeEnd, t3 - t2);
        vec3.scaleAndAdd(position, position, this.endPoint, -2 * t3 + 3 * t2);
        return position;
    }

    getDerivative(t: number) {

        const t2 = t * t;
        const derivative = vec3.create();
        vec3.copy(derivative, this.startPoint);
        vec3.scale(derivative, derivative, 6 * t2 - 6 * t);
        vec3.scaleAndAdd(derivative, derivative, this.derivativeStart, 3 * t2  - 4 * t + 1);
        vec3.scaleAndAdd(derivative, derivative, this.derivativeEnd, 3 * t2 - 2 * t);
        vec3.scaleAndAdd(derivative, derivative, this.endPoint, -6 * t2 + 6 * t);
        return derivative;

    }

    getSecondDerivative(t: number) {
        const derivative = vec3.create();
        vec3.copy(derivative, this.startPoint);
        vec3.scale(derivative, derivative, 12 * t - 6);
        vec3.scaleAndAdd(derivative, derivative, this.derivativeStart, 6 * t  - 4);
        vec3.scaleAndAdd(derivative, derivative, this.derivativeEnd, 6 * t - 2);
        vec3.scaleAndAdd(derivative, derivative, this.endPoint, -12 * t + 6);
        return derivative;
    }

    length() {
        let length = 0;
        for(let dt = 0; dt <= 1; dt += 0.02) {
            const derivative = this.getDerivative(dt);
            const dx = vec3.length(derivative) * dt;
            length += dx;
        }
        return length;
    }

    startPoint: vec3;
    endPoint: vec3;
    derivativeStart: vec3;
    derivativeEnd: vec3;
}

export class FoliageGenerator {

    constructor(renderer: Renderer) {
        this.renderer = renderer;
     //   this.addGrass();
    }

    async addGrass() {



        const grass = new StaticMesh('grass');
        const spline = new HermiteCubicSpline(vec3.fromValues(0, 0, 0), vec3.fromValues(0, 0.6, 0), vec3.fromValues(0, 1, 0), vec3.fromValues(0.02, 1, 0));
        await this.generateGrass(2.5, 2.5, 10, 10, 24, 10, 0.03, spline, grass);

        grass.getSubmesh('grass').materialID = 'grass';

        const node = new SceneNode('node', this.renderer.currentScene);
        node.transform.setPosition(-5, 0.2, 0);
        node.transform.setRotation(0, 0, 0);
        node.addMesh(grass.getSubmesh('grass'), Layer.OPAQUE);
        this.renderer.currentScene.addObject(node);

        mesh.toMeshDataFileMultiSubmesh(grass, 'grass');
    }

    async generateGrass(width: number, height: number, numX: number, numZ: number, numSegmentsAngle: number, numSegments: number, radius: number, spline: HermiteCubicSpline, pMesh: StaticMesh) {

        await material.loadMaterial('materials/grass.mat.json', true, this.renderer.gl);

        const endRadius = 0;

        const vertices: Vertex[] = [];
        const indices: number[] = [];
        let offset = 0;

        const dimensionX = width / numX;
        const dimensionZ = height / numZ;

        for(let z = -numZ * 0.5; z < numZ * 0.5; z++) {
            for(let x = - numX * 0.5; x < numX * 0.5; x++) {

                for(let angle = 0; angle <= 2 * Math.PI; angle += (2 * Math.PI) / numSegmentsAngle) {
                    for(let i = 0; i <= numSegments; i++) {
                        const vertex = new Vertex();
                        const dRadius = radius - endRadius;
                        const currentRadius = radius * Math.sin((i / numSegments) * Math.PI);   //math.lerpNumber(radius, endRadius, i / numSegments);

                        const curveTangent = spline.getDerivative(i / numSegments);
                        const secondDerivative = spline.getSecondDerivative(i / numSegments);

                        let curveNormal = vec3.create();

                        vec3.cross(curveNormal, curveTangent, secondDerivative);
                        vec3.cross(curveNormal, curveNormal, curveTangent);
                        vec3.normalize(curveNormal, curveNormal);
                        vec3.normalize(curveTangent, curveTangent);


                    //  curveNormal = vec3.fromValues(-1, 0, 0);

                        vec3.cross(curveNormal, vec3.fromValues(0, 0, 1), curveTangent);
                        vec3.normalize(curveNormal, curveNormal);
                        const normal = vec4.create();

                        const centerPosition = spline.getPosition(i / numSegments);
                        const position = vec3.create();
                        vec3.scaleAndAdd(position, position, curveNormal, currentRadius);
                        const matrix = mat4.create();
                        mat4.fromRotation(matrix, angle, curveTangent);
                        vec4.transformMat4(normal, vec4.fromValues(curveNormal[0], curveNormal[1], curveNormal[2], 0), matrix);


                        vec3.transformMat4(position, position, matrix);
                        vec3.add(position, position, centerPosition);
                        vec3.add(position, position, vec3.fromValues(dimensionX * x, 0, dimensionZ * z));
                        vertex.position = vec3.fromValues(position[0], position[1], position[2]);

                        vertex.normal = vec3.create();

                        const tangent = vec4.create();
                        vec4.transformMat4(tangent, vec4.fromValues(0, 0, 1, 0) , matrix);
                        vertex.tangent = vec3.fromValues(tangent[0], tangent[1], tangent[2]);

                        const bitangent = vec3.create();
                        vec3.scaleAndAdd(bitangent, curveTangent, 
                            vec3.fromValues(normal[0], normal[1], normal[3]), Math.PI * radius * Math.cos((i / numSegments) * Math.PI));

                        vertex.normal = vec3.create(); 
                        vec3.cross(vertex.normal, vertex.tangent, bitangent);
                        vec3.normalize(vertex.normal, vertex.normal);

                        vertex.textureCoords = vec2.fromValues(angle / (2.0 * Math.PI), i / numSegments);
                        vertices.push(vertex);
                    }
                }

            let idx = 0, y = 0;
            for (let i = 0; i < numSegmentsAngle; i++) {
                for (let j = 0; j < numSegments; j++) {

                    let x1  = idx + 1;

                    if(i === numSegmentsAngle - 1){
                        x1 = 0;
                    }

                    // first triangle
                    indices.push(offset + (numSegments + 1) * idx + y);
                    indices.push(offset + (numSegments + 1) * idx + y + 1);
                    indices.push(offset + (numSegments + 1) * x1 + y);
                    // second triangle
                    indices.push(offset + (numSegments + 1) * x1 + y);
                    indices.push(offset + (numSegments + 1) * idx + y + 1);
                    indices.push(offset + (numSegments + 1) * x1 + y + 1);
                    y++;
                }
                y = 0;
                idx++;
            }
            offset = vertices.length;
        }   
    }  

       /* function addIndices(k1: number, k2: number, k3: number) {
			indices.push(k1);
			indices.push(k2);
			indices.push(k3);
		}
*/
		// indices
		//  k1--k1+1
		//  |  / |
		//  | /  |
		//  k2--k2+1
	/*	let k1, k2;
		for (let i = 0; i < numSegmentsAngle; ++i) {
			k1 = i * (numSegments + 1);     // beginning of current stack
			k2 = k1 + numSegments + 1;      // beginning of next stack

			for (let j = 0; j < numSegments; ++j, ++k1, ++k2) {
				// 2 triangles per sector excluding 1st and last stacks
				if (i !== 0) {
					addIndices(k1, k2, k1 + 1);   // k1---k2---k1+1
				}

				if (i !== (numSegmentsAngle - 1)) {
					addIndices(k1 + 1, k2, k2 + 1); // k1+1---k2---k2+1
				}

			}
        }*/
        
       // GeometryGenerator.ComputeNormals(vertices, indices);
       // GeometryGenerator.ComputeTangents(vertices, indices);

       // GeometryGenerator.GenerateSphere(this.renderer.gl, 'grass1', 0.25, 32, 32);
       // const submesh = mesh.GetMesh<StaticMesh>('grass1').getSubmesh('sphere');
		const grassMesh = pMesh || new StaticMesh(name);
		grassMesh.createSubmesh(this.renderer.gl, 'grass', vertices, indices, 'default');
		mesh.SetMesh(name, grassMesh);
		return grassMesh;
    
    }

    renderer: Renderer;
}