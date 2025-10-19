/**
 * Script de inicialización del módulo Character Goals Table
 * Este script crea automáticamente la tabla si no existe
 */

Hooks.once('ready', async () => {
  // Verificar si ya existe la tabla
  const existingTable = game.tables.getName("Character Goals Table");
  
  if (existingTable) {
    console.log("Character Goals Table | La tabla ya existe");
    return;
  }

  // Solo el GM puede crear la tabla
  if (!game.user.isGM) {
    return;
  }

  console.log("Character Goals Table | Creando tabla...");

  // Datos de la tabla
  const tableData = {
    name: "Character Goals Table",
    formula: "1d20",
    replacement: true,
    displayRoll: true,
    results: [
      { text: "Become a noble", weight: 1, range: [1, 1] },
      { text: "Find a missing person", weight: 1, range: [2, 2] },
      { text: "Fulfill a specific oath or promise", weight: 1, range: [3, 3] },
      { text: "Repay a debt of gratitude", weight: 1, range: [4, 4] },
      { text: "Get revenge", weight: 1, range: [5, 5] },
      { text: "Investigate a crime", weight: 1, range: [6, 6] },
      { text: "Earn a Shardblade", weight: 1, range: [7, 7] },
      { text: "Research fabrial technology", weight: 1, range: [8, 8] },
      { text: "Train an apprentice", weight: 1, range: [9, 9] },
      { text: "Secure a wardship", weight: 1, range: [10, 10] },
      { text: "Impress a highprince", weight: 1, range: [11, 11] },
      { text: "Earn a promotion", weight: 1, range: [12, 12] },
      { text: "Explore a new land", weight: 1, range: [13, 13] },
      { text: "Nurse an animal back to health", weight: 1, range: [14, 14] },
      { text: "Secure funding for mission", weight: 1, range: [15, 15] },
      { text: "Obtain a Soulcaster", weight: 1, range: [16, 16] },
      { text: "Hire a loyal bodyguard", weight: 1, range: [17, 17] },
      { text: "Train an axehound", weight: 1, range: [18, 18] },
      { text: "Acquire a high-quality gem", weight: 1, range: [19, 19] },
      { text: "Bond a Ryshadium", weight: 1, range: [20, 20] }
    ]
  };

  try {
    // Crear la tabla
    await RollTable.create(tableData);
    
    ui.notifications.info("Character Goals Table creada exitosamente!");
    console.log("Character Goals Table | Tabla creada exitosamente");
  } catch (error) {
    console.error("Character Goals Table | Error al crear la tabla:", error);
    ui.notifications.error("Error al crear Character Goals Table. Revisa la consola.");
  }
});

// Macro opcional para rollear la tabla rápidamente
Hooks.on('renderMacroDirectory', () => {
  // Agregar un botón en el chat para rollear fácilmente (opcional)
  console.log("Character Goals Table | Módulo cargado correctamente");
});