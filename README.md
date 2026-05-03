# Cosmere RPG Tooling

![Foundry Version](https://img.shields.io/badge/Foundry-v12--v13-informational)
![Module Version](https://img.shields.io/badge/version-1.2.6-blue)

A Foundry VTT module that provides essential tools for Cosmere RPG, including random tables for character creation (based on Brotherwise's quick character creation documents) and useful macros for players and GMs.

## 📚 Module Contents

This module includes:
- **11 random tables** for character creation and name generation
- **2 macro compendiums** with 65 total macros (21 for players, 44 for GMs)

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

#### CosmereRPG: Player Macros (21 macros)

Macros for players that facilitate skill rolls in the Cosmere RPG system:

- **Roll Skill** - Dropdown dialog to select and roll any skill
- **Roll Skill (Table View)** - Visual table with skills organized by category (Physical, Cognitive, Spiritual), showing associated attributes and total bonuses
- **Individual Skill Rolls** (18 macros):
  - Agility, Athletics, Stealth, Thievery
  - Heavy Weapons, Light Weapons
  - Crafting, Deduction, Discipline, Lore
  - Medicine, Insight, Perception
  - Deception, Intimidation, Leadership, Persuasion
  - Survival
- **Hook** - Responds to GM roll requests automatically (works with the GM's "Request Roll" macro)

#### CosmereRPG: GM Macros (44 macros)

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

**Sound Effects:**
- **Palabras Aceptadas Deluxe** - Plays a dramatic two-part sound effect, lets the GM choose actor, Radiant order, ideal text, optional aura, a real pre-oath player whisper, chat card, and GM-only output
- **Highstorm Toolkit** - Publishes highstorm scene beats with thunder or ambient audio, and generates highstorm calendars with optional chat and Journal output

**Economy:**
- **Distribuir Esferas** - Distributes spheres (currency) to player characters with support for splitting evenly and chat notifications
- **Eliminar Esferas** - Removes spheres from player characters with deficit detection and real-time inventory validation
- **Gestor de Esferas Avanzado** - Shows actor balances, converts infused/dun spheres, spends from the party pool, drains infused spheres after Investiture, detects deficits, and publishes treasury summaries

**Utilities:**
- **Panel GM Cosmere** - Centralizes resource control, spheres, roll requests, private messages, sounds, visual effects, and token visibility
- **Chequeo de Dependencias** - Reports whether JB2A, Sequencer/Sequence, Sequencer.Crosshair, and Dice So Nice are available for optional macro features
- **Gestor de Conversaciones y Endeavors** - Tracks non-combat progress, failures, Opportunity, Complication, and final scene summaries
- **First Step Character Generator** - Generates a quick character seed from the goal, obstacle, purpose, and optional name tables
- **Generador de PNJ Roshar** - Generates a quick Roshar NPC with name, culture, attitude, problem, secret, resource, and scene hook
- **Generador de Localizaciones** - Creates Roshar locations with chat output and optional Journal Entry
- **Compendio de Escenas Rapidas** - Publishes reusable scene structures for chase, infiltration, social duel, discovery, travel, negotiation, and storm preparation
- **Gestor de Plot Die** - Records a Plot Die result, success/failure, Opportunity, Complication, and GM notes in a chat card
- **Control Rapido de Recursos** - Applies health, focus, or Investiture changes and simple narrative states to selected tokens with optional chat summary
- **Surgebinding FX Pack** - Provides narrative/visual cues for the ten Surges while degrading to chat if Sequencer is missing
- **Individual Surge FX macros** - Adhesion, Gravitation, Division, Abrasion, Progression, Illumination, Transformation, Transportation, Cohesion, and Tension
- **Validacion de Macros** - Checks source macro metadata, `_key` consistency, duplicate names, empty commands, and optional dependency references
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

To generate the three main components of a character manually:

1. Roll on **Character Goals Table** to determine the character's goal
2. Roll on **Character Obstacles Table** to discover their personal obstacle
3. Roll on **Radiant Purpose Table** to find their purpose (if they're a Radiant)

Alternatively, GMs can use the **First Step Character Generator** macro from **CosmereRPG: GM Macros** to generate the full seed in one action.

**Using First Step Character Generator:**
1. Open **Compendium Packs**
2. Open **CosmereRPG: GM Macros**
3. Drag **First Step Character Generator** to your macro bar, or execute it from the compendium
4. Choose a culture/name table, or select **Sin nombre** to skip name generation
5. Enable **Enviar solo al GM** if the result should be whispered to GMs only
6. Click **Generar**

The macro publishes a chat card with:
- Optional Rosharan name and culture table
- Character goal
- Character obstacle
- Radiant purpose, including the associated order when present in the table result

This macro creates a narrative character seed in chat. It does not create a Foundry Actor automatically.

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

**Generating First Step Characters:**
- Use **First Step Character Generator** to create a quick character seed from the roll tables
- Select a Rosharan culture if you want the macro to include a random name
- Use **Enviar solo al GM** when preparing NPCs or secrets privately
- The result is posted as a chat card and can be copied into an Actor biography or notes

**Generating Roshar NPCs:**
- Use **Generador de PNJ Roshar** to improvise a quick non-player character during prep or live play
- Choose **Aleatoria** to roll a culture/name table automatically, or select a specific Rosharan culture
- Keep **Enviar solo al GM** enabled when the NPC has secrets or hooks you want to reveal later
- The chat card includes name, culture, attitude, immediate problem, secret, useful resource, and rumor or scene hook
- The macro creates a narrative NPC seed in chat. It does not create a Foundry Actor automatically.

**Checking optional dependencies:**
- Use **Chequeo de Dependencias** from **CosmereRPG: GM Macros** before a session or after enabling modules
- The macro posts a chat card listing the status of JB2A, Sequencer/Sequence, Sequencer.Crosshair, and Dice So Nice
- Missing dependencies are reported with readable details instead of forcing you to hunt through the browser console
- This is especially useful before using animation macros, teleport/crosshair effects, or Dice So Nice hook macros

**Managing Plot Die outcomes:**
- Use **Gestor de Plot Die** to record a Plot Die moment after a roll
- Enter actor/focus, roll label, total, optional difficulty, and Plot Die value
- Leave the narrative result in **Automatico por valor** to treat 6 as Opportunity and 1 as Complication, or override it manually
- Add Opportunity, Complication, and GM note text when useful
- Enable **Enviar solo al GM** for private consequences or prep notes
- The macro publishes a narrative chat card. It does not replace the Cosmere RPG system roll.

**Running Highstorm Toolkit:**
- Use **Highstorm Toolkit** to announce highstorm beats during a scene or generate an upcoming storm calendar
- Choose a moment: approaching, arrival, eye of the storm, or passing
- Set a countdown in minutes if you want the chat card to show when the next change arrives
- Add an optional GM note for scene-specific details
- Toggle **Reproducir sonido** and choose **Trueno** or **Ambiente highstorm** depending on whether you want a one-shot cue or the bundled loop
- Use **Enviar solo al GM** when preparing private storm timing or hidden scene notes
- To generate a calendar, set the starting day/hour, average interval in days, maximum random variation in hours, number of storms, and seed
- Enable **Publicar calendario en chat** to post the schedule as a chat card
- Enable **Crear Journal Entry** to create a persistent calendar handout in the Journal tab

**Using GM Flow tools:**
- Use **Panel GM Cosmere** as the first macro on the GM bar when you want a single launcher for resources, spheres, roll requests, messages, sounds, FX, and token visibility
- Use **Gestor de Conversaciones y Endeavors** for non-combat scenes with progress, failures, Opportunity, Complication, and the **Finalizar con resumen** action when the scene closes
- Use **Palabras Aceptadas Deluxe** for oath moments: choose actor, Radiant order, ideal, optional pre-oath player whisper, audio, aura, and whether the final card is public or GM-only
- Use **Surgebinding FX Pack** for a narrative/visual cue for any of the ten Surges; it posts a chat card even if Sequencer is unavailable
- Use **Generador de Localizaciones** and **Compendio de Escenas Rapidas** when prep needs a quick place or scene structure
- Use **Gestor de Esferas Avanzado** to publish a party treasury summary, convert infused/dun spheres, spend from the group, or drain infused spheres after Investiture
- Use **Control Rapido de Recursos** to apply +/- changes to health, focus, or Investiture across selected tokens, or to apply/remove simple narrative states
- Use **Validacion de Macros** or `npm run validate` before compiling packs or preparing a release

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

To add base character creation tables, edit `scripts/init.js` and add an object to the `tables` array:

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

For thematic GM tables, prefer adding data to `scripts/roshar-roll-tables.js`; `scripts/init.js` calls `ensureRoadmapRollTables()` during GM initialization.

### Creating a new macro

1. Add the macro source JSON to `packs/_source/gm-macros/` or `packs/_source/player-macros/`.
2. Keep `_id` unique and set `_key` to `!macros!{_id}`.
3. Put reusable logic in `scripts/<feature>.js` and keep the macro command as a short dynamic import.
4. Add or update a Node test in `tests/`.
5. Run `npm test`, `npm run validate`, and `npm run compile`.

### Testing macros in Foundry

1. Run `npm run compile`.
2. Link or copy the module directory into your Foundry VTT development `Data/modules/` directory.
3. Enable **CosmereRPG GM Tools** in a test world using the Cosmere RPG system.
4. Open the relevant compendium, drag the macro to the macro bar, and test with selected tokens and missing optional modules.

### Adding sounds

1. Add audio files under `sounds/`.
2. Reference them as `modules/cosmere-rpg-tooling/sounds/<file>`.
3. Keep new sound playback behind a volume setting or macro checkbox when possible.
4. Prefer graceful fallback to chat cards if audio is missing or muted.

### Preparing a release

1. Run `npm test`.
2. Run `npm run validate`.
3. Run `npm run compile`.
4. Create a GitHub release tag such as `v1.3.0`; the workflow replaces manifest placeholders and uploads the compiled module archive.

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
