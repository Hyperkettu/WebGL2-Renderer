import { Container } from './container';
import { Sprite } from "./sprite";
import * as math from '../util';
import * as ease from './easing';
import { vec2, vec3 } from 'gl-matrix';


export type AnimationTarget = 'position' | 'angle' | 'scale' | 'alpha' | 'color';
export type Variable = vec3 | vec2 | number;
export type Animator = (from: Variable, to: Variable, t: number, easing: (x: number) => number) => Variable;
export type Easing = 
    'easeInOutElastic' | 
    'easeInOutSine' | 
    'linear' | 
    'easeOutCubic' |
    'easeInOutCubic' |
    'easeInOutQuint' |
    'easeInOutBounce' | 
    'easeInBounce' | 
    'easeOutBounce' |
    'easeInOutBack' |
    'easeInBack' |
    'easeOutBack';


const getAnimator: { [name: string ]: Animator } = {};
const setTarget: { [name: string ]: string } = {};

export class AnimationSystem {

    constructor() {
        this.init();
    }

    init() {
        this.animationSequences = [];
        this.pendingAnimationSequences = {};

        getAnimator['position'] = ease.lerpVec2;
        getAnimator['angle'] = ease.lerpNumber;
        getAnimator['scale'] = ease.lerpVec2;
        getAnimator['alpha'] = ease.lerpNumber;
        getAnimator['color'] = ease.lerpVec3;

        setTarget['position'] = 'setPosition';
        setTarget['angle'] = 'setAngle';
        setTarget['scale'] = 'setScale';
        setTarget['alpha'] = 'setAlpha';
        setTarget['color'] = 'setTintColor';
    }

    startAnimation(animationSequence: Animation[]) {
        this.animationSequences.push(animationSequence);
        Animation.STARTED_ANIMATION_NUMBER++;
    }

    updateAnimations(dt: number) {

        const animations = this.animationSequences;

        for(let animationSequence of animations) {
            if(animationSequence[0].type === 'wait') {
                this.pendingAnimationSequences[animationSequence[0].id] = animationSequence;
                this.animationSequences.splice(this.animationSequences.indexOf(animationSequence), 1);
                const waiting = async () => {
                    await math.wait(animationSequence[0].duration * 1000);
                    animationSequence.shift();
                    this.animationSequences.push(animationSequence);
                    delete this.pendingAnimationSequences[animationSequence[0].id];
                }; 
                waiting();
            } else {
                const animationReady = animationSequence[0].animate(dt);
                if(animationReady) {
                    animationSequence.shift();
                    if(animationSequence.length === 0) {
                        this.animationSequences.splice(this.animationSequences.indexOf(animationSequence), 1);
                    }
            
                }
            }
        }
    }

    pendingAnimationSequences: {[id: string]: (Animation[]) };
    animationSequences: (Animation[])[];

}

export class Animation {

    static STARTED_ANIMATION_NUMBER = 0;

    constructor(element: Sprite | Container, target: AnimationTarget, easing: Easing, duration: number, type: 'animate' | 'wait', delay: number) {
        this.element = element;
        this.time = 0;
        this.duration = duration;
        this.target = target;
        this.id = Animation.STARTED_ANIMATION_NUMBER;
        this.type = type;
        this.delay = delay;

        this.easeFunction = this.getEasing(easing);
    }

    getEasing(easing: Easing) {
        if(easing === 'easeInOutElastic') {
            return ease.easeInOutElastic;
        } else if(easing === 'linear') {
            return undefined;
        } else if(easing === 'easeInOutSine') {
            return ease.easeInOutSine;
        } else if(easing === 'easeOutCubic') {
            return ease.easeOutCubic;
        } else if(easing === 'easeInOutCubic') {
            return ease.easeInOutCubic;
        } else if(easing === 'easeInOutQuint') {
            return ease.easeInOutQuint;
        } else if(easing === 'easeInBounce') {
            return ease.easeInBounce;
        } else if(easing === 'easeOutBounce') {
            return ease.easeOutBounce;
        } else if(easing === 'easeInOutBounce') {
            return ease.easeInOutBounce;
        } else if(easing === 'easeInBack') {
            return ease.easeInBack;
        } else if(easing === 'easeOutBack') {
            return ease.easeOutBack;
        } else if(easing === 'easeInOutBack') {
            return ease.easeInOutBack;
        }
    }

    setValue() {
        (this.element[setTarget[this.target]])(this.value);
    }

    animate(dt: number) {

        this.time += dt;

        const t = math.clamp((this.time - this.delay) / this.duration, 0, 1);
        const animator = getAnimator[this.target];
        this.value = animator(this.from, this.to, t, this.easeFunction);
        this.setValue();
                    
        return (this.time - this.delay) >= this.duration;
    }

    setFrom(from: number[]) {
        if(from.length === 1) {
            this.from = from[0];
        } else if(from.length === 2) {
            this.from = vec2.fromValues(from[0], from[1]);
        } else if(from.length === 3) {
            this.from = vec3.fromValues(from[0], from[1], from[2]);
        }
    }

    setTo(to: number[]) {
        if(to.length === 1) {
            this.to = to[0];
        } else if(to.length === 2) {
            this.to = vec2.fromValues(to[0], to[1]);
        } else if(to.length === 3) {
            this.to = vec3.fromValues(to[0], to[1], to[2]);
        }
    }

    id: number;
    from: Variable;
    to: Variable;
    value: Variable;

    type: 'animate' | 'wait';
    
    easeFunction: (x: number) => number;

    target: AnimationTarget;
    duration: number;
    delay: number;
    time: number;
    element: Sprite | Container;
}