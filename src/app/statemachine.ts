import { Renderer } from "../glrenderer";

export interface Size {
	x: number;
	y: number;
}

export interface StateSettings {
	renderer: Renderer;
	mouseMoveCamera: boolean;
}

export abstract class State {

	constructor(name: string, settings: StateSettings) {
		this.name = name;
		this.ready = false;
		this.settings = settings;
	}

	public abstract enter(fsm: StateMachine, from?: State);
	public abstract exit(fsm: StateMachine, to?: State);
	public abstract postExit(fsm: StateMachine);
	public abstract update(dt: number, time: number, inputDt: number);
	public abstract enableInput(fsm: StateMachine);
	public abstract disableInput(fsm: StateMachine);
	public abstract handleInput(dt: number, keys: { [id: string]: boolean });
	public abstract handleKeyPress(key: string);
	public abstract onResize(size: Size);

	public getName() {
		return this.name;
	}

	fsm: StateMachine;
	ready: boolean;

	private name: string;
	public settings: StateSettings;
}


export class StateMachine {

	constructor() {
		this.active = null;
		this.states = {};
	}

	public async set(next: State) {
		if (this.active) {
			this.active.exit(this, next);
		}
		const previous = this.active;
		this.active = next;
		await next.enter(this, previous);
		if (previous) {
			previous.postExit(this);
		}
	}

	public getActiveState() {
		return this.active;
	}

	public getState(name: string) {
		return this.states[name];
	}

	public addState(state: State) {
		this.states[state.getName()] = state;
	}

	active: State;

	states: { [name: string]: State };
}