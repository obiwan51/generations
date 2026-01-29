/**
 * Component - Pure data attached to entities.
 * Components have no behavior; they only store data.
 * Systems are responsible for the logic that operates on components.
 */
export declare class Component {
    readonly id: string;
    isDeleted: boolean;
    constructor();
    /**
     * Mark this component for deletion.
     * The owning system will remove it at the end of the frame.
     */
    delete(): void;
}
export default Component;
