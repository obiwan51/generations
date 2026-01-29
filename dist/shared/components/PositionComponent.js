import { Component } from '../ecs/Component.js';
/**
 * PositionComponent - Stores spatial position data.
 * Used by players, projectiles, animals, and world objects.
 */
export class PositionComponent extends Component {
    x;
    y;
    constructor(x = 0, y = 0) {
        super();
        this.x = x;
        this.y = y;
    }
    /**
     * Set position to new coordinates.
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    /**
     * Move by a delta amount.
     */
    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }
    /**
     * Calculate distance to another position component.
     */
    distanceTo(other) {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
    }
}
export default PositionComponent;
//# sourceMappingURL=PositionComponent.js.map