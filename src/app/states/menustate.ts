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

    public handleInput(dt: number, keys: { [id: string]: boolean }) {

    }


	public enableInput(fsm: StateMachine) {

    }
	public disableInput(fsm: StateMachine) {
        
    }

    public exit(fsm: StateMachine, to?: State) {
        this.disableInput(fsm);
    }

    public postExit(fsm: StateMachine) {
    
    }

    public update(dt: number, time: number, inputDt: number) {
        
    }
    public onResize(size: Size) {
    }
}