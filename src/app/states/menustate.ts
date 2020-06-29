import { State, StateMachine, Size, StateSettings } from "../statemachine";
import { UILayout } from "../../overlay/ui/layout";
import { SettingsState } from "./settingsstate";

export interface MenuSettings extends StateSettings {
    layout: UILayout;
}

export abstract class MenuState extends State {

    constructor(name: string, settings: StateSettings) {
        super(name, settings);
    }

    public async enter(fsm: StateMachine, from?: State) {
        const settings = this.settings as MenuSettings;
        await settings.renderer.overlay.setAsCurrent(settings.layout, true);
        this.enableInput(fsm);
    }

    public exit(fsm: StateMachine, to?: State) {
        this.disableInput(fsm);
    }

    public abstract handleInput(dt: number, keys: { [id: string]: boolean });
    public abstract handleKeyPress(key: string);
	public abstract enableInput(fsm: StateMachine);
	public abstract disableInput(fsm: StateMachine);

    public abstract postExit(fsm: StateMachine);
    public abstract update(dt: number, time: number, inputDt: number);
    public abstract onResize(size: Size);
}