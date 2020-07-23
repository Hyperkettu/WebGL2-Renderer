import { StaticMesh } from "./mesh";
import { Renderer } from "./glrenderer";
import { GeometryGenerator } from "./geometrygenerator";
import * as material from "./material";
import { Scene } from "./scene";
import { SceneNode } from "./scenenode";
import { Layer } from "./batchrenderer";
import * as math from './util/math';
import { Vertex, VertexBase } from "./vertex";
import { MeshComponent } from "./meshcomponent";
import { Submesh } from "./submesh";
import { Transform } from "stream";
import { SceneGraph } from "./scenegraph";
import { mat4, vec3, vec4, vec2 } from "gl-matrix";

type Rules = { [id: string]: string };
type LSystemVariable = string;

class LSystem {
    constructor(init: LSystemVariable, variables: LSystemVariable[]) {
        this.rules = {};
        this.init = init;
        this.variables = variables;   
    }

    addRule(start: string, end: string) {
        this.rules[start] = end;
    }

   get(variable: LSystemVariable) {
        return this.rules[variable];
    }

    init: LSystemVariable;
    variables: LSystemVariable[];
    rules: Rules;
}

export class Foliage {
    constructor(renderer: Renderer) {
        this.lSystem = new LSystem('A', ['A', 'B', 'C']);
        this.lSystem.addRule( 'A', 'B');
        this.lSystem.addRule('B', 'BCB');
        this.lSystem.addRule('C', 'CB');
        this.create(renderer);
    }

    async create(renderer: Renderer) {
        this.trunk = new StaticMesh('plant');
        await material.loadMaterial('materials/bark1.mat.json', true, renderer.gl);

        const node = new SceneNode('node', renderer.currentScene);
        node.transform.setPosition(0, 0, 0);
       // renderer.currentScene.addObject(node);

        this.generateTrunk(renderer, this.trunk, node, 0, 7);

        const staticMesh = this.createBatch(renderer.gl, node.children[0]);

        const node2 = new SceneNode('node2', renderer.currentScene);
        node2.transform.setPosition(0, 0.5, 0);
        node2.transform.setRotation(0, 0, 0);
        node2.addMesh(staticMesh.getSubmesh('foliage'), Layer.OPAQUE);
        renderer.currentScene.addObject(node2);

        console.log(renderer.currentScene.sceneGraph);
    }

    createBatch(gl: WebGL2RenderingContext, node: SceneNode) {

        const vertices: Vertex[] = [];

        const sceneGraph = new SceneGraph();
        sceneGraph.root.addChild(node);
        sceneGraph.updateGraph(0);

        const newPosition = vec3.create();
        const newNormal = vec4.create();
        const newTangent = vec4.create();

        const indices: number[] = [];
        let offset = 0;

        sceneGraph.forEach(node => {

            if(node !== sceneGraph.root) {
                const transform = node.transform;
                const submesh = (node.getComponent('meshComponent') as MeshComponent<Vertex>).mesh;

                if(submesh) {
                    for(let vertex of submesh.vertices) {
                        vec3.transformMat4(newPosition, vertex.position, transform.world);
                        vec4.transformMat4(newNormal, vec4.fromValues(vertex.normal[0], vertex.normal[1], vertex.normal[2], 0), transform.world);
                        vec4.transformMat4(newTangent, vec4.fromValues(vertex.tangent[0], vertex.tangent[1], vertex.tangent[2], 0), transform.world);
                     /*   newPosition[0] = vertex.position[0];
                        newPosition[1] = vertex.position[1];
                        newPosition[2] = vertex.position[2];

                        newNormal[0] = vertex.normal[0];
                        newNormal[1] = vertex.normal[1];
                        newNormal[2] = vertex.normal[2];

                        newTangent[0] = vertex.tangent[0];
                        newTangent[1] = vertex.tangent[1];
                        newTangent[2] = vertex.tangent[2]; */

                        const newVertex = new Vertex();
                        newVertex.position = vec3.fromValues(newPosition[0], newPosition[1], newPosition[2]);
                        newVertex.normal = vec3.fromValues(newNormal[0], newNormal[1], newNormal[2]);
                        newVertex.tangent = vec3.fromValues(newTangent[0], newTangent[1], newTangent[2]);
                        newVertex.textureCoords = vec2.fromValues(vertex.textureCoords[0], vertex.textureCoords[1]);
                        vertices.push(newVertex);
                    }

                    let maxindex = 0;

                    for(let index of submesh.indices) {
                        indices.push(index + offset);

                        if(index > maxindex) {
                            maxindex = index;
                        }
                    }
                    console.log(maxindex, submesh.vertices.length, submesh.indices.length);
                    console.log('offset', offset);

                    offset += submesh.vertices.length;
                }
            }
        });

        const lSystem = new StaticMesh('lsystem');
        lSystem.createSubmesh(gl, 'foliage', vertices, indices, 'bark1-with-displacement');
        console.log(vertices.length, indices.length, 'lens');

    //    const mesh = GeometryGenerator.GenerateCylinder(gl, 'cyl', 'foliage', 0.5, 0.3, 32, 2, 1);
     //   mesh.getSubmesh('foliage').materialID = 'bark1-with-displacement';
      //  return mesh;
        return lSystem;
    }


    generateTrunk(renderer: Renderer, pMesh: StaticMesh, parent: SceneNode, depth: number, maxDepth: number) {
        this.recurseTrunk(renderer, pMesh, 0.2, 0.12, 0.6, 1, parent, depth, maxDepth, this.lSystem.init);
    }

    recurseTrunk(renderer: Renderer, pMesh: StaticMesh, radius: number, endRadius: number, scale: number, height: number, parent: SceneNode, depth: number, maxDepth: number, lSystemVariable: LSystemVariable) {
        
        if(depth === maxDepth) {
            return;
        }

        if(lSystemVariable === 'A') {
            GeometryGenerator.GenerateCylinder(renderer.gl, 'trunk', `trunk-${depth}`, radius, endRadius, 36, 2, height, 
            pMesh) as StaticMesh;
            this.trunk.getSubmesh(`trunk-${depth}`).materialID = 'bark1-with-displacement';

            const node = new SceneNode('node', renderer.currentScene);
            node.transform.setPosition(0, 0, 0);
            node.addMesh(this.trunk.getSubmesh(`trunk-${depth}`), Layer.OPAQUE);
            parent.addChild(node);
            this.recurseTrunk(renderer, pMesh, radius * scale, endRadius * scale, scale, height, node, depth + 1, maxDepth, this.lSystem.get('A'))
        } else if(lSystemVariable === 'B') {
            this.threeBranch(renderer, pMesh, radius, endRadius, scale, height, parent, depth, maxDepth, lSystemVariable);
        } else if(lSystemVariable === 'C') {
            this.twoBranch(renderer, pMesh, radius, endRadius, scale, height, parent, depth, maxDepth, lSystemVariable);
        }

    }

    threeBranch(renderer: Renderer, pMesh: StaticMesh, radius: number, endRadius: number, scale: number, height: number, parent: SceneNode, depth: number, maxDepth: number, lSystemVariable: LSystemVariable) {

        const keys = this.lSystem.get(lSystemVariable);

        for(let index = 0; index < 3; index++) {
            const trunkLength = math.randomFloat(1 / depth *  height, height);
            GeometryGenerator.GenerateCylinder(renderer.gl, 'trunk', `trunk-${depth}-${index}`, radius, endRadius, 36, 2, trunkLength, 
            pMesh) as StaticMesh;
            this.trunk.getSubmesh(`trunk-${depth}-${index}`).materialID = 'bark1-with-displacement';

            const node = new SceneNode('node', renderer.currentScene);
            node.transform.setRotation(45, 120 * index + + math.randomFloat(45, 135), 0);
            node.transform.setPosition(0, height, 0);
            node.addMesh(this.trunk.getSubmesh(`trunk-${depth}-${index}`), Layer.OPAQUE);
            parent.addChild(node);
            this.recurseTrunk(renderer, pMesh, radius * scale, endRadius * scale, scale, trunkLength, node, depth + 1, maxDepth, keys.charAt(index));
        }
    }

    twoBranch(renderer: Renderer, pMesh: StaticMesh, radius: number, endRadius: number, scale: number, height: number, parent: SceneNode, depth: number, maxDepth: number, lSystemVariable: LSystemVariable) {

        const keys = this.lSystem.get(lSystemVariable);

        for(let index = 0; index < 2; index++) {
            const trunkLength = math.randomFloat(1 / depth * height, height);
            GeometryGenerator.GenerateCylinder(renderer.gl, 'trunk', `trunk-${depth}-${index}`, radius, endRadius, 36, 2, trunkLength, 
            pMesh) as StaticMesh;
            this.trunk.getSubmesh(`trunk-${depth}-${index}`).materialID = 'bark1-with-displacement';
            const node = new SceneNode('node', renderer.currentScene);
            node.transform.setRotation(45, 180 * index + math.randomFloat(45, 135), 0);
            node.transform.setPosition(0, height, 0);
            node.addMesh(this.trunk.getSubmesh(`trunk-${depth}-${index}`), Layer.OPAQUE);
            parent.addChild(node);
            this.recurseTrunk(renderer, pMesh, radius * scale, endRadius * scale, scale, trunkLength, node, depth + 1, maxDepth, keys.charAt(index));
        }
    }

    trunk: StaticMesh;
    lSystem: LSystem;
}