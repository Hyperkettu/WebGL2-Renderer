import { Spring } from "./util/spring";
import { GeometryGenerator } from "./geometrygenerator";
import { StaticMesh, Mesh } from "./mesh";
import * as mesh from './meshmanager';
import { Submesh } from "./submesh";
import { Vertex } from "./vertex";
import { loadMaterial } from "./material";
import { SceneGraph } from "./scenegraph";
import { SceneNode } from './scenenode';
import { Scene } from './scene';
import { Layer } from './batchrenderer';
import { vec3 } from "gl-matrix";
import { Pendulum } from "./util/pendulum";
import * as math from './util/math';

export class Cloth {

    constructor(gl: WebGL2RenderingContext, scene: Scene) {

        this.init(gl, scene);

    }

    async init(gl: WebGL2RenderingContext, scene: Scene) {
        GeometryGenerator.GenerateSphere(gl, "sphere", 0.1, 32, 32);
        this.sphere = mesh.GetMesh("sphere") as StaticMesh;

		const submesh = this.sphere.getSubmesh('sphere');
			submesh.wireFrame = false;
			submesh.materialID = 'default';
			const node = new SceneNode('sphereNode', scene);
			node.transform.setPosition(0, 0, 0);
			node.transform.setRotation(0, 0, 0);
            node.addMesh(submesh, Layer.OPAQUE);
            this.node = node;
			scene.addObject(node);
            this.submesh = submesh;
            
            this.spring = new Spring(3.0, 0.05);
            this.spring.addFirstEnd(vec3.fromValues(0, 0, 0), 1.0, true);
            this.spring.addSecondEnd(vec3.fromValues(0, -3.0, 0.5), 0.5, false);
            this.node.transform.setPosition(this.spring.secondEndPosition[0], this.spring.secondEndPosition[1], this.spring.secondEndPosition[2]);

            this.gravity = vec3.fromValues(0, this.spring.secondEndMass * -9.81, 0);
    }

    update(gl: WebGL2RenderingContext, dt: number) {
        
        this.spring.applyForces(this.gravity, dt);
        this.node.transform.setPosition(this.spring.secondEndPosition[0], this.spring.secondEndPosition[1], this.spring.secondEndPosition[2]);

    }
    pendulum: Pendulum;
    spring: Spring;
    sphere: StaticMesh;
    submesh: Submesh<Vertex>;
    node: SceneNode;
    gravity: vec3;
}
