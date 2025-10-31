# Cosmere RPG Tooling

![Foundry Version](https://img.shields.io/badge/Foundry-v12--v13-informational)
![Module Version](https://img.shields.io/badge/version-1.2.2-blue)

A Foundry VTT module that provides essential tools for Cosmere RPG, including random tables for character creation (based on Brotherwise's quick character creation documents) and useful macros for players and GMs.

## 📚 Module Contents

This module includes:
- **11 random tables** for character creation and name generation
- **2 macro compendiums** with 38 total macros (20 for players, 18 for GMs)

### ⚔️ Character Creation Tables (3 tables)

Tables for character creation using the Cosmere RPG "First Step" method:

- **Character Goals Table** - 20 character goals
- **Character Obstacles Table** - 20 personal obstacles
- **Radiant Purpose Table** - 20 Radiant purposes (with their associated orders)

### 🌍 Name Generators (8 tables)

Name generators for each Roshar culture:

- **Alethi Names** - Alethi-style names
- **Azish Names** - Azish-style names
- **Herdazian Names** - Herdazian-style names
- **Reshi Names** - Reshi-style names
- **Shin Names** - Shin-style names
- **Thaylen Names** - Thaylen-style names
- **Unkalaki Names** - Unkalaki (Horneater) style names
- **Veden Names** - Veden-style names

### 🎭 Macro Compendiums

#### CosmereRPG: Player Macros (20 macros)

Macros for players that facilitate skill rolls in the Cosmere RPG system:

- **Roll Skill** - Interactive dialog to select and roll any skill
- **Individual Skill Rolls** (18 macros):
  - Agility, Athletics, Stealth, Thievery
  - Heavy Weapons, Light Weapons
  - Crafting, Deduction, Discipline, Lore
  - Medicine, Insight, Perception
  - Deception, Intimidation, Leadership, Persuasion
  - Survival
- **Hook** - Responds to GM roll requests automatically (works with the GM's "Request Roll" macro)

#### CosmereRPG: GM Macros (18 macros)

Macros for the GM that include resource management and visual animations. **⚠️ Requires the JB2A_DnD5e module** for animations.

**Resource Management:**
- **Increase Focus** 🎨 *[Uses JB2A]* - Adds 1 focus point with aura visual effect
- **Reduce Focus** 🎨 *[Uses JB2A]* - Subtracts 1 focus point with animation
- **Increase Health** 🎨 *[Uses JB2A]* - Adds 1 health point with visual effect
- **Reduce Health** 🎨 *[Uses JB2A]* - Subtracts 1 health point with animation

**Attacks and Combat Effects:**
- **Strike Hammer** 🎨 *[Uses JB2A]* - Hammer attack animation
- **Longspear Strike** 🎨 *[Uses JB2A]* - Longspear attack animation
- **Unarmed Strike** 🎨 *[Uses JB2A]* - Unarmed attack animation
- **Knife** 🎨 *[Uses JB2A]* - Knife attack animation
- **Bomb Throw** 🎨 *[Uses JB2A]* - Bomb throw animation
- **Weapon Throw with Return** 🎨 *[Uses JB2A]* - Returning weapon animation

**Special Effects:**
- **Critical Miss animation** 🎨 *[Uses JB2A]* - Animation for critical failures
- **Hook 20 Natural** 🎨 *[Uses JB2A]* - Visual effect for natural 20s
- **Hook Critical Failure** 🎨 *[Uses JB2A]* - Visual effect for critical failures
- **Teleport** 🎨 *[Uses JB2A]* - Teleportation animation
- **Spreen flight** 🎨 *[Uses JB2A]* - Spren flight animation

**Utilities:**
- **Show Token** - Toggles visibility of selected tokens
- **Request Roll** - Requests rolls from players (players need the "Hook" macro to respond automatically)
- **Send message** - Sends custom messages

## 🚀 Installation

### ⚠️ Requirements

This module requires:
- **Foundry VTT v12 or v13**
- **Cosmere RPG system** (for macros to work correctly)
- **JB2A_DnD5e** (required module for GM macro animations)

The JB2A_DnD5e module will be installed automatically as a dependency when you activate this module.

## Store Availability

Once available in the store, you can install the module from [this Foundry VTT store link](https://foundryvtt.com/packages/cosmere-rpg-gm-tooling)


### Manual Installation

1. Download the latest module version from [Releases](https://github.com/juange87/cosmere-rpg-tooling/releases)
2. Extract the `.zip` file to your Foundry VTT modules folder:
   - Windows: `%localappdata%/FoundryVTT/Data/modules/`
   - macOS: `~/Library/Application Support/FoundryVTT/Data/modules/`
   - Linux: `~/.local/share/FoundryVTT/Data/modules/`
3. Restart Foundry VTT
4. Go to **Game Settings** → **Manage Modules**
5. Activate **CosmereRPG GM Tools**

### Installation from Manifest URL

1. In Foundry VTT, go to **Add-on Modules**
2. Click **Install Module**
3. Paste the following URL in the "Manifest URL" field:
   ```
   https://github.com/juange87/cosmere-rpg-tooling/releases/latest/download/module.json
   ```
4. Click **Install**

## 💡 How to Use

### Accessing the Tables

Once the module is activated (requires being GM the first time to create the tables):

1. Open the Foundry VTT sidebar
2. Go to the **Roll Tables** tab (dice icon)
3. You'll find all 11 tables available
4. Click the dice icon on any table to get a random result

### Quick Character Creation

To generate the three main components of a character:

1. Roll on **Character Goals Table** to determine the character's goal
2. Roll on **Character Obstacles Table** to discover their personal obstacle
3. Roll on **Radiant Purpose Table** to find their purpose (if they're a Radiant)

### Name Generation

1. Select the name table according to your character's culture
2. Click the dice icon to get a random name
3. You can roll multiple times until you find one you like

### Using the Macros

#### For Players

1. Open the Foundry VTT sidebar
2. Go to the **Compendium** tab
3. Look for **CosmereRPG: Player Macros**
4. Drag the macros you need to your macro bar
5. **Recommendation**: Drag "Roll Skill" for quick access to all rolls

**Using the Skill Selector:**
1. Select your token on the map
2. Execute the "Roll Skill" macro
3. Select the skill from the dropdown menu
4. The system will perform the roll automatically

**Using Individual Macros:**
1. Select your token
2. Execute the specific skill macro
3. The roll will be performed automatically

**Responding to GM Roll Requests:**
- The **Hook** macro allows your character to automatically respond when the GM requests a roll
- Players should have this macro ready in their macro bar
- When the GM uses "Request Roll", players with the Hook macro will be prompted to roll

#### For Game Masters

1. Open the Foundry VTT sidebar
2. Go to the **Compendium** tab
3. Look for **CosmereRPG: GM Macros**
4. Drag the macros you need to your macro bar

**Resource Management:**
- Select the character's token
- Execute the corresponding macro (Increase/Reduce Focus or Health)
- The value will update automatically with a visual animation 🎨

**Combat Effects:**
- Select the attacking token
- Execute the attack type macro
- The JB2A animation will play automatically 🎨

**Requesting Rolls from Players:**
- Use the **Request Roll** macro to ask players for specific rolls
- Players who have the **Hook** macro will automatically receive the request
- This streamlines gameplay by allowing the GM to trigger rolls for multiple players at once

**Example usage - Increase Focus:**
```javascript
// The macro does this automatically:
// 1. Verifies a token is selected
// 2. Increases focus by 1 (respecting maximum)
// 3. Shows a JB2A aura visual effect
// 4. Notifies the change in chat
```

## 🎲 Additional Macros (Optional)

In addition to the included macros, you can create custom macros to automate additional tasks:

### Macro: Character Creation

```javascript
// Generates a complete character with Goal, Obstacle, and Purpose
async function createFirstStepCharacter() {
  const goal = await game.tables.getName("Character Goals Table")?.draw();
  const obstacle = await game.tables.getName("Character Obstacles Table")?.draw();
  const purpose = await game.tables.getName("Radiant Purpose Table")?.draw();

  ChatMessage.create({
    content: `<h2>First Step Character</h2>
    <p><strong>Goal:</strong> ${goal.results[0].text}</p>
    <p><strong>Obstacle:</strong> ${obstacle.results[0].text}</p>
    <p><strong>Purpose:</strong> ${purpose.results[0].text}</p>`,
    speaker: ChatMessage.getSpeaker()
  });
}

createFirstStepCharacter();
```

### Macro: Random Alethi Name

```javascript
game.tables.getName("Alethi Names")?.draw();
```

### Macro: Name Generator Menu

```javascript
// Dialog to select culture and generate name
new Dialog({
  title: "Cosmere Name Generator",
  content: `
    <form>
      <div class="form-group">
        <label>Select Culture:</label>
        <select id="culture-select" name="culture">
          <option value="Alethi Names">Alethi</option>
          <option value="Azish Names">Azish</option>
          <option value="Herdazian Names">Herdazian</option>
          <option value="Reshi Names">Reshi</option>
          <option value="Shin Names">Shin</option>
          <option value="Thaylen Names">Thaylen</option>
          <option value="Unkalaki Names">Unkalaki (Horneater)</option>
          <option value="Veden Names">Veden</option>
        </select>
      </div>
    </form>
  `,
  buttons: {
    generate: {
      icon: '<i class="fas fa-dice"></i>',
      label: "Generate Name",
      callback: async (html) => {
        const culture = html.find('[name="culture"]').val();
        await game.tables.getName(culture)?.draw();
      }
    }
  },
  default: "generate"
}).render(true);
```


## 🔧 Compatibility

- **Foundry VTT**: v12 - v13 (minimum v12, verified up to v13)
- **System**: Cosmere RPG (macros are specifically designed for this system)
- **Required Modules**: JB2A_DnD5e (installed automatically as a dependency)
- **Random Tables**: Work with any game system

## 🛠️ Development

### Clone the repository

```bash
git clone https://github.com/juange87/cosmere-rpg-tooling.git
cd cosmere-rpg-tooling
```

### Adding new tables

To add new tables, edit `scripts/init.js` and add an object to the `tables` array:

```javascript
{
  name: "My New Table",
  formula: "1d20",
  results: [
    { text: "Result 1", weight: 1, range: [1, 1] },
    { text: "Result 2", weight: 1, range: [2, 2] },
    // ... more results
  ]
}
```

## 📝 Roadmap

Features planned for future versions:

...

## 🤝 Contributing

If you want to collaborate:

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request


## 📄 License

This module is under the MIT license. See the [LICENSE](LICENSE) file for more details.

## 🙏 Credits

- **Author**: JuanGeKal
- **Inspired by**: Brandon Sanderson's Cosmere universe
- **Base system**: Cosmere RPG by Brotherwise Games

## 📞 Support

If you find any issues or have suggestions:

- Open an [Issue on GitHub](https://github.com/juange87/cosmere-rpg-tooling/issues)

## ⚠️ Disclaimer

This is an unofficial fan project. Cosmere RPG and all related elements are property of Brotherwise Games and Brandon Sanderson. This module is distributed free of charge for personal use in Foundry VTT.

### ⚠️ AI Disclaimer

All content that this module contains and will contain in the future has been and will be generated from my effort and work wrestling with Foundry VTT (currently there are only roll tables, but there will be much more).

Nevertheless, I have used AI to help me create this module (basically to guide me on the best way to add the roll tables I had in this module) and to make specific queries about the intricacies of Foundry VTT and Javascript.


---

**Journey before destination, Radiant!** ⚔️✨
