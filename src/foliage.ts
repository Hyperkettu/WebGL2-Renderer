import { StaticMesh, Mesh } from "./mesh";
import { Renderer } from "./glrenderer";
import { GeometryGenerator } from "./geometrygenerator";
import * as material from "./material";
import { SceneNode } from "./scenenode";
import { Layer } from "./batchrenderer";
import * as math from './util/math';
import * as batch from './util/graphics/batch';
import * as mesh from './meshmanager';

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
        this.lSystem.addRule('D', 'DCDBDB');
        this.create(renderer);
    }

    async create(renderer: Renderer) {
        this.trunk = new StaticMesh('plant');
        await material.loadMaterial('materials/bark1.mat.json', true, renderer.gl);
        await material.loadMaterial('materials/oak-leaf.mat.json', true, renderer.gl);

        const node = new SceneNode('node', renderer.currentScene);
        node.transform.setPosition(0, 0, 0);
       // renderer.currentScene.addObject(node);

        this.generateTrunk(renderer, this.trunk, node, 0, 7);

        const staticMesh = batch.createBatch(renderer.gl, node.children[0], 'tree', 'trunk', 'bark1-with-displacement', 'plane');

        const node2 = new SceneNode('node2', renderer.currentScene);
        node2.transform.setPosition(0, 0.5, 0);
        node2.transform.setRotation(0, 0, 0);
        node2.addMesh(staticMesh.getSubmesh('trunk'), Layer.OPAQUE);
       // renderer.currentScene.addObject(node2);
        this.trunk = staticMesh;

        const leafMesh = batch.createBatch(renderer.gl, node.children[0], 'leaves', 'leafSubmesh', 'oak-leaf', 'trunk');
        const leaves = new SceneNode('leaves', renderer.currentScene);
        leaves.transform.setPosition(0, 0.5, 0);
        leaves.transform.setRotation(0, 0, 0);
        leaves.addMesh(leafMesh.getSubmesh('leafSubmesh'), Layer.OPAQUE);
     //   renderer.currentScene.addObject(leaves);
        this.leaves = leafMesh;

        
    }


    generateTrunk(renderer: Renderer, pMesh: StaticMesh, parent: SceneNode, depth: number, maxDepth: number) {
        this.recurseTrunk(renderer, pMesh, 0.2, 0.12, 0.6, 2, parent, depth, maxDepth, this.lSystem.init);
    }

    recurseTrunk(renderer: Renderer, pMesh: StaticMesh, radius: number, endRadius: number, scale: number, height: number, parent: SceneNode, depth: number, maxDepth: number, lSystemVariable: LSystemVariable) {

        if(depth === maxDepth) {
            const leafMesh = GeometryGenerator.GeneratePlane(renderer.gl, 'oak-leaf', 0.4, 0.4);
            const leafSubmesh = leafMesh.getSubmesh('plane');
            leafSubmesh.materialID = 'oak-leaf';
            const leafNode = new SceneNode('leafnode', renderer.currentScene);
            leafNode.transform.setPosition(0, height + 0.2, 0);
            leafNode.addMesh(Object.create(leafSubmesh), Layer.OPAQUE);
            parent.addChild(leafNode);
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
            const trunkLength = math.randomFloat(1 / depth *  height * 0.8, height * 0.8);
            GeometryGenerator.GenerateCylinder(renderer.gl, 'trunk', `trunk-${depth}-${index}`, radius, endRadius, 36, 2, trunkLength, 
            pMesh) as StaticMesh;
            this.trunk.getSubmesh(`trunk-${depth}-${index}`).materialID = 'bark1-with-displacement';

            const node = new SceneNode('node', renderer.currentScene);
            node.transform.setRotation(45 + math.randomFloat(-35, 15), 120 * index + + math.randomFloat(45, 135), 0);
            node.transform.setPosition(0, height, 0);
            node.addMesh(this.trunk.getSubmesh(`trunk-${depth}-${index}`), Layer.OPAQUE);
            parent.addChild(node);
            this.recurseTrunk(renderer, pMesh, radius * scale, endRadius * scale, scale, trunkLength, node, depth + 1, maxDepth, keys.charAt(index));
        }
    }

    twoBranch(renderer: Renderer, pMesh: StaticMesh, radius: number, endRadius: number, scale: number, height: number, parent: SceneNode, depth: number, maxDepth: number, lSystemVariable: LSystemVariable) {

        const keys = this.lSystem.get(lSystemVariable);

        for(let index = 0; index < 2; index++) {
            const trunkLength = math.randomFloat(1 / depth * height * 0.8, height * 0.8);
            GeometryGenerator.GenerateCylinder(renderer.gl, 'trunk', `trunk-${depth}-${index}`, radius, endRadius, 36, 2, trunkLength, 
            pMesh) as StaticMesh;
            this.trunk.getSubmesh(`trunk-${depth}-${index}`).materialID = 'bark1-with-displacement';
            const node = new SceneNode('node', renderer.currentScene);
            node.transform.setRotation(45 + math.randomFloat(-35, 0), 180 * index + math.randomFloat(45, 135), 0);
            node.transform.setPosition(0, height, 0);
            node.addMesh(this.trunk.getSubmesh(`trunk-${depth}-${index}`), Layer.OPAQUE);
            parent.addChild(node);
            this.recurseTrunk(renderer, pMesh, radius * scale, endRadius * scale, scale, trunkLength, node, depth + 1, maxDepth, keys.charAt(index));
        }
    }

    leafBranch(renderer: Renderer, pMesh: StaticMesh, radius: number, endRadius: number, scale: number, height: number, parent: SceneNode, depth: number, maxDepth: number, lSystemVariable: LSystemVariable) {

        const keys = this.lSystem.get(lSystemVariable);

        for(let index = 0; index < 6; index++) {
            const trunkLength = math.randomFloat(1 / depth * height * 0.8, height * 0.8);
            GeometryGenerator.GenerateCylinder(renderer.gl, 'trunk', `trunk-${depth}-${index}`, radius, endRadius, 36, 2, trunkLength, 
            pMesh) as StaticMesh;
            this.trunk.getSubmesh(`trunk-${depth}-${index}`).materialID = 'bark1-with-displacement';
            const node = new SceneNode('node', renderer.currentScene);
            node.transform.setRotation(45 + math.randomFloat(-35, 0), 30 * index + math.randomFloat(45, 135), 0);
            node.transform.setPosition(0, height, 0);
            node.addMesh(this.trunk.getSubmesh(`trunk-${depth}-${index}`), Layer.OPAQUE);
            parent.addChild(node);
            this.recurseTrunk(renderer, pMesh, radius * scale, endRadius * scale, scale, trunkLength, node, depth + 1, maxDepth, keys.charAt(index));
        }
    }



    trunk: StaticMesh;
    leaves: StaticMesh;
    lSystem: LSystem;
}