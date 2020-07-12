import { vec3 } from "gl-matrix";

export class Spring {
    constructor(factor: number, length: number) {
        this.factor = factor;
        this.length = length;

        this.velocityFirstEnd = vec3.create();
        this.velocitySecondEnd = vec3.create();
    }

    addFirstEnd(position: vec3, mass: number, anchor: boolean) {
        this.firstEndAnchored = anchor;
        this.firstEndMass = mass;
        this.firstEndPosition = position;
    }

    addSecondEnd(position: vec3, mass: number, anchor: boolean) {
        this.secondEndAnchored = anchor;
        this.secondEndMass = mass;
        this.secondEndPosition = position;
    }

    applyForces(gravity: vec3, dt: number) {
        const difference = vec3.create();
        vec3.sub(difference, this.secondEndPosition, this.firstEndPosition);
        const length = vec3.length(difference);

        const force = vec3.fromValues(difference[0], difference[1], difference[2]);
        vec3.normalize(force, force);
        const dx = length - this.length;
        vec3.scale(force, force, -this.factor * dx);

        if(!this.secondEndAnchored) {
            const totalForce = vec3.create();
            vec3.add(totalForce, gravity, force);
            const accelerationSecondEnd = vec3.fromValues(totalForce[0] / this.secondEndMass, totalForce[1] / this.secondEndMass, totalForce[2] / this.secondEndMass);
            const deltaVelocity = vec3.fromValues(accelerationSecondEnd[0] * dt, accelerationSecondEnd[1] * dt, accelerationSecondEnd[2] * dt);
            vec3.scaleAndAdd(this.velocitySecondEnd, this.velocitySecondEnd, deltaVelocity, dt);
            vec3.scaleAndAdd(this.secondEndPosition, this.secondEndPosition, this.velocitySecondEnd, dt);
        }

        if(!this.firstEndAnchored) {
            const totalForce = vec3.create();
            vec3.add(totalForce, gravity, force);
            const accelerationFirstEnd = vec3.fromValues(-force[0] / this.firstEndMass, -force[1] / this.firstEndMass, -force[2] / this.firstEndMass);
            const deltaVelocity = vec3.fromValues(accelerationFirstEnd[0] * dt, accelerationFirstEnd[1] * dt, accelerationFirstEnd[2] * dt);
            vec3.scaleAndAdd(this.velocityFirstEnd, this.velocityFirstEnd, deltaVelocity, dt);
            vec3.scaleAndAdd(this.firstEndPosition, this.firstEndPosition, this.velocityFirstEnd, dt);
        }

    }

    firstEndMass: number;
    firstEndPosition: vec3;
    velocityFirstEnd: vec3;
    secondEndMass: number;
    secondEndPosition: vec3;
    velocitySecondEnd: vec3;

    firstEndAnchored: boolean;
    secondEndAnchored: boolean;

    length: number;
    factor: number;
};