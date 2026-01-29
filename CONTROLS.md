# One Life - Simplified Controls

## Contextual Mouse Click System

The game now uses **contextual mouse clicks** that intelligently determine what action to perform based on:
- What you're clicking on
- What you're holding
- Distance to the target
- Whether Shift is held

### Mouse Click Actions

#### **Left Click** (Contextual)
- **Click on nearby object** (< 80 pixels away):
  - **Empty hands** → Pick up or Eat (if edible)
  - **Holding tool/item** → Use/Craft with target
  
- **Click on empty ground** (< 80 pixels away):
  - **Holding item** → Drop/Place item
  
- **Click far away** (> 80 pixels):
  - **Move towards that location**

#### **Shift + Left Click** (Attack)
- **Holding BOW or SPEAR** → Shoot/Throw at target

### Keyboard Controls

- **W/A/S/D** or **Arrow Keys**: Move character
- **E**: Quick eat (consume food in hand or nearby)
- **R**: Toggle recipe book
- **T** or **Enter**: Open chat
- **Shift**: Hold while clicking to attack

### Examples

1. **Gathering berries**: Click on berry bush → Picks berries
2. **Chopping tree**: Hold sharp stone, click on tree → Chops tree
3. **Crafting spear**: Hold sharp stone, click on log → Creates spear
4. **Dropping item**: Hold item, click on nearby empty ground → Drops item
5. **Hunting rabbit**: Hold bow/spear, Shift+Click on rabbit → Shoots
6. **Moving**: Click far away on ground → Character moves there

### Benefits

- **One button does everything** - No need to remember G for pickup, F for use, Q for drop
- **Intuitive** - Click what you want to interact with
- **Context-aware** - The game figures out what you want to do
- **Simpler UI** - Fewer buttons to explain to new players
- **Mobile-friendly** - Can easily be adapted for touch controls

### Technical Details

The InputSystem now:
- Tracks player position and world state
- Calculates distance to clicked object
- Determines object type and properties
- Selects appropriate action based on context
- Provides audio feedback for each action type
