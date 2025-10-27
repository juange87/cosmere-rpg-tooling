# Cosmere RPG Tooling

![Foundry Version](https://img.shields.io/badge/Foundry-v12-informational)
![Module Version](https://img.shields.io/badge/version-1.0.0-blue)

Módulo para Foundry VTT que proporciona herramientas esenciales para el Cosmere RPG, incluyendo tablas aleatorias para la creación de personajes (basandose en la información de los documentos proporcionados por Brotherwise para crear personajes de forma rápida) y macros útiles para jugadores y GMs.

## 📚 Contenido del Módulo

Este módulo incluye:
- **11 tablas aleatorias** para creación de personajes y nombres
- **2 compendios de macros** con 38 macros en total (20 para jugadores, 18 para GM)

### ⚔️ Character Creation Tables (3 tablas)

Tablas para la creación de personajes usando el método "First Step" del Cosmere RPG:

- **Character Goals Table** - 20 objetivos de personaje
- **Character Obstacles Table** - 20 obstáculos personales
- **Radiant Purpose Table** - 20 propósitos de Radiantes (con sus órdenes asociadas)

### 🌍 Name Generators (8 tablas)

Generadores de nombres para cada cultura de Roshar:

- **Alethi Names** - Nombres de estilo Alethi
- **Azish Names** - Nombres de estilo Azish
- **Herdazian Names** - Nombres de estilo Herdaziano
- **Reshi Names** - Nombres de estilo Reshi
- **Shin Names** - Nombres de estilo Shin
- **Thaylen Names** - Nombres de estilo Thaylen
- **Unkalaki Names** - Nombres de estilo Unkalaki (Horneater)
- **Veden Names** - Nombres de estilo Veden

### 🎭 Compendios de Macros

#### CosmereRPG: Player Macros (20 macros)

Macros para jugadores que facilitan las tiradas de habilidad en el sistema Cosmere RPG:

- **Roll Skill** - Diálogo interactivo para seleccionar y tirar cualquier habilidad
- **Tiradas de Habilidad individuales** (19 macros):
  - Agilidad, Atletismo, Sigilo, Hurto/Thievery
  - Armas Pesadas (Heavy Weapons), Armas Ligeras (Light Weapons)
  - Artesanía/Crafting, Deducción, Disciplina, Saber/Lore
  - Medicina, Perspicacia/Insight, Percepción
  - Engaño/Deception, Intimidación, Liderazgo/Leadership, Persuasión
  - Supervivencia
  - Hook (macro especial)

#### CosmereRPG: GM Macros (18 macros)

Macros para el GM que incluyen gestión de recursos y animaciones visuales. **⚠️ Requiere el módulo JB2A_DnD5e** para las animaciones.

**Gestión de Recursos:**
- **Incrementar Foco** 🎨 *[Usa JB2A]* - Añade 1 punto de foco con efecto visual de aura
- **Reducir Foco** 🎨 *[Usa JB2A]* - Resta 1 punto de foco con animación
- **Incrementar Salud** 🎨 *[Usa JB2A]* - Añade 1 punto de salud con efecto visual
- **Reducir Salud** 🎨 *[Usa JB2A]* - Resta 1 punto de salud con animación

**Ataques y Efectos de Combate:**
- **Strike Hammer** 🎨 *[Usa JB2A]* - Animación de ataque con martillo
- **Longspear Strike** 🎨 *[Usa JB2A]* - Animación de ataque con lanza larga
- **Unarmed Strike** 🎨 *[Usa JB2A]* - Animación de ataque sin armas
- **Knife** 🎨 *[Usa JB2A]* - Animación de ataque con cuchillo
- **Bomb Throw** 🎨 *[Usa JB2A]* - Animación de lanzamiento de bomba
- **Weapon Throw with Return** 🎨 *[Usa JB2A]* - Animación de arma arrojadiza que regresa

**Efectos Especiales:**
- **Critical Miss animation** 🎨 *[Usa JB2A]* - Animación para fallos críticos
- **Hook 20 Natural** 🎨 *[Usa JB2A]* - Efecto visual para críticos naturales
- **Hook Critical Failure** 🎨 *[Usa JB2A]* - Efecto visual para fallos críticos
- **Teleport** 🎨 *[Usa JB2A]* - Animación de teletransporte
- **Spreen flight** 🎨 *[Usa JB2A]* - Animación de vuelo de spren

**Utilidades:**
- **Show Token** - Alterna visibilidad de tokens seleccionados
- **Pedir Tirada** - Solicita tiradas a los jugadores
- **Send message** - Envía mensajes personalizados

## 🚀 Instalación

### ⚠️ Requisitos

Este módulo requiere:
- **Foundry VTT v12** o superior
- **Sistema Cosmere RPG** (para que los macros funcionen correctamente)
- **JB2A_DnD5e** (módulo requerido para las animaciones de los macros de GM)

El módulo JB2A_DnD5e se instalará automáticamente como dependencia al activar este módulo.

## Disponibilidad en la tienda de modulos

Una vez se encuentre disponible en la tienda, podrás instalar el modulo desde [este enlace de la tienda de Foundry VTT](https://foundryvtt.com/packages/cosmere-rpg-gm-tooling)


### Instalación Manual

1. Descarga la última versión del módulo desde [Releases](https://github.com/juange87/cosmere-rpg-tooling/releases)
2. Extrae el archivo `.zip` en tu carpeta de módulos de Foundry VTT:
   - Windows: `%localappdata%/FoundryVTT/Data/modules/`
   - macOS: `~/Library/Application Support/FoundryVTT/Data/modules/`
   - Linux: `~/.local/share/FoundryVTT/Data/modules/`
3. Reinicia Foundry VTT
4. Ve a **Game Settings** → **Manage Modules**
5. Activa **CosmereRPG GM Tools**

### Instalación desde Manifest URL

1. En Foundry VTT, ve a **Add-on Modules**
2. Haz clic en **Install Module**
3. Pega la siguiente URL en el campo "Manifest URL":
   ```
   https://github.com/juange87/cosmere-rpg-tooling/releases/latest/download/module.json
   ```
4. Haz clic en **Install**

## 💡 Cómo Usar

### Acceso a las Tablas

Una vez activado el módulo (requiere ser GM la primera vez para crear las tablas):

1. Abre el sidebar de Foundry VTT
2. Ve a la pestaña **Roll Tables** (icono de dados)
3. Encontrarás todas las 11 tablas disponibles
4. Haz clic en el icono del dado en cualquier tabla para obtener un resultado aleatorio

### Creación Rápida de Personajes

Para generar los tres componentes principales de un personaje:

1. Rolla en **Character Goals Table** para determinar el objetivo del personaje
2. Rolla en **Character Obstacles Table** para descubrir su obstáculo personal
3. Rolla en **Radiant Purpose Table** para encontrar su propósito (si es un Radiante)

### Generación de Nombres

1. Selecciona la tabla de nombres según la cultura de tu personaje
2. Haz clic en el icono del dado para obtener un nombre aleatorio
3. Puedes rollear múltiples veces hasta encontrar uno que te guste

### Uso de los Macros

#### Para Jugadores

1. Abre el sidebar de Foundry VTT
2. Ve a la pestaña **Compendium**
3. Busca **CosmereRPG: Player Macros**
4. Arrastra los macros que necesites a tu barra de macros
5. **Recomendación**: Arrastra "Roll Skill" para tener acceso rápido a todas las tiradas

**Uso del Selector de Habilidades:**
1. Selecciona tu token en el mapa
2. Ejecuta el macro "Roll Skill"
3. Selecciona la habilidad del menú desplegable
4. El sistema realizará la tirada automáticamente

**Uso de Macros Individuales:**
1. Selecciona tu token
2. Ejecuta el macro de la habilidad específica
3. La tirada se realizará automáticamente

#### Para Game Masters

1. Abre el sidebar de Foundry VTT
2. Ve a la pestaña **Compendium**
3. Busca **CosmereRPG: GM Macros**
4. Arrastra los macros que necesites a tu barra de macros

**Gestión de Recursos:**
- Selecciona el token del personaje
- Ejecuta el macro correspondiente (Incrementar/Reducir Foco o Salud)
- El valor se actualizará automáticamente con una animación visual 🎨

**Efectos de Combate:**
- Selecciona el token atacante
- Ejecuta el macro del tipo de ataque
- La animación JB2A se reproducirá automáticamente 🎨

**Ejemplo de uso - Incrementar Foco:**
```javascript
// El macro hace esto automáticamente:
// 1. Verifica que hay un token seleccionado
// 2. Incrementa el foco en 1 (respetando el máximo)
// 3. Muestra un efecto visual de aura JB2A
// 4. Notifica el cambio en el chat
```

## 🎲 Macros Adicionales (Opcional)

Además de los macros incluidos, puedes crear macros personalizadas para automatizar tareas adicionales:

### Macro: Character Creation

```javascript
// Genera un personaje completo con Goal, Obstacle y Purpose
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
// Diálogo para seleccionar cultura y generar nombre
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


## 🔧 Compatibilidad

- **Foundry VTT**: v12 (mínimo y verificado)
- **Sistema**: Cosmere RPG (los macros están diseñados específicamente para este sistema)
- **Módulos requeridos**: JB2A_DnD5e (se instala automáticamente como dependencia)
- **Tablas aleatorias**: Funcionan con cualquier sistema de juego

## 🛠️ Desarrollo

### Clonar el repositorio

```bash
git clone https://github.com/juange87/cosmere-rpg-tooling.git
cd cosmere-rpg-tooling
```

### Añadir nuevas tablas

Para añadir nuevas tablas, edita `scripts/init.js` y añade un nuevo objeto al array `tables`:

```javascript
{
  name: "Mi Nueva Tabla",
  formula: "1d20",
  results: [
    { text: "Resultado 1", weight: 1, range: [1, 1] },
    { text: "Resultado 2", weight: 1, range: [2, 2] },
    // ... más resultados
  ]
}
```

## 📝 Roadmap

Funcionalidades planeadas para futuras versiones:

... 

## 🤝 Contribuir

Si quieres colaborar:

1. Haz un fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añade nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request
   

## 📄 Licencia

Este módulo está bajo la licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Créditos

- **Autor**: JuanGeKal
- **Inspirado en**: El universo del Cosmere de Brandon Sanderson
- **Sistema base**: Cosmere RPG por Brotherwise Games

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias:

- Abre un [Issue en GitHub](https://github.com/juange87/cosmere-rpg-tooling/issues)

## ⚠️ Disclaimer

Este es un proyecto de fans no oficial. Cosmere RPG y todos los elementos relacionados son propiedad de Brotherwise Games y Brandon Sanderson. Este módulo se distribuye de forma gratuita para uso personal en Foundry VTT.

### ⚠️ Disclaimer IA

Todo el contenido que contiene este modulo y que contendrá en un futuro ha sido y será generado a raíz de mi esfuerzo y trabajo peleandome con Foundry VTT (ahora solo hay rolltables, pero habrá mucho más).

Ahora, si he usado la IA para ayudarme a crear este modulo (basicamente para orientarme en la mejor forma de agregar las rolltables que tenía en este modulo) y para hacer consultas puntuales sobre los entresijos de Foundry VTT y Javascript.


---

**Journey before destination, Radiant!** ⚔️✨
