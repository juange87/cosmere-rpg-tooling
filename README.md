# Cosmere RPG Tooling

![Foundry Version](https://img.shields.io/badge/Foundry-v12-informational)
![Module Version](https://img.shields.io/badge/version-1.0.0-blue)

Módulo para Foundry VTT que proporciona herramientas esenciales para el Cosmere RPG, incluyendo tablas aleatorias para la creación de personajes según el método "First Step" y generadores de nombres para las diferentes culturas de Roshar.

## 📚 Contenido del Módulo

Este módulo incluye **11 tablas aleatorias** organizadas en dos categorías:

### ⚔️ Character Creation Tables (3 tablas)

Tablas para la creación de personajes usando el método "First Step" del Cosmere RPG:

- **Character Goals Table** - 20 objetivos de personaje
- **Character Obstacles Table** - 20 obstáculos personales
- **Radiant Purpose Table** - 20 propósitos de Radiantes (con sus órdenes asociadas)

### 🌍 Name Generators (8 tablas)

Generadores de nombres para cada cultura principal de Roshar:

- **Alethi Names** - Nombres de estilo Alethi
- **Azish Names** - Nombres de estilo Azish
- **Herdazian Names** - Nombres de estilo Herdaziano
- **Reshi Names** - Nombres de estilo Reshi
- **Shin Names** - Nombres de estilo Shin
- **Thaylen Names** - Nombres de estilo Thaylen
- **Unkalaki Names** - Nombres de estilo Unkalaki (Horneater)
- **Veden Names** - Nombres de estilo Veden

Cada tabla de nombres contiene 20 opciones únicas basadas en las convenciones de nomenclatura del Cosmere.

## 🚀 Instalación

### Instalación Manual

1. Descarga la última versión del módulo desde [Releases](https://github.com/juange87/cosmere-rpg-tooling/releases)
2. Extrae el archivo `.zip` en tu carpeta de módulos de Foundry VTT:
   - Windows: `%localappdata%/FoundryVTT/Data/modules/`
   - macOS: `~/Library/Application Support/FoundryVTT/Data/modules/`
   - Linux: `~/.local/share/FoundryVTT/Data/modules/`
3. Reinicia Foundry VTT
4. Ve a **Game Settings** → **Manage Modules**
5. Activa **Cosmere RPG Tooling**

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

## 🎲 Macros Recomendadas

Puedes crear macros para agilizar el proceso de creación:

### Macro: First Step Character Creation

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

## 📁 Estructura del Módulo

```
cosmere-rpg-tooling/
├── module.json          # Manifest del módulo
├── README.md            # Este archivo
├── LICENSE              # Licencia del módulo
└── scripts/
    └── init.js          # Script que crea las tablas automáticamente
```

## 🔧 Compatibilidad

- **Foundry VTT**: v12 (mínimo y verificado)
- **Sistema**: Agnóstico (funciona con cualquier sistema de juego)
- **Recomendado para**: Cosmere RPG, pero adaptable a cualquier campaña

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

- [ ] Tablas adicionales de creación de personajes (Connections, Personality Traits)
- [ ] Interfaz visual para First Step Character Creation
- [ ] Tablas de eventos aleatorios del Cosmere
- [ ] Generador de nombres compuestos (nombre + apellido)
- [ ] Soporte para más culturas (Iriali, Sinking, etc.)
- [ ] Traducción a otros idiomas
- [ ] Integración con sistemas específicos del Cosmere

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Si quieres colaborar:

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
- Contacta al autor en [GitHub](https://github.com/juange87)

## ⚠️ Disclaimer

Este es un proyecto de fans no oficial. Cosmere RPG y todos los elementos relacionados son propiedad de Brotherwise Games y Brandon Sanderson. Este módulo se distribuye de forma gratuita para uso personal en Foundry VTT.

---

**Journey before destination, Radiant!** ⚔️✨