
Hooks.once('ready', async () => {
  // Solo el GM puede crear las tablas
  if (!game.user.isGM) {
    return;
  }

  console.log("Cosmere RPG Tooling | Verificando tablas...");

  // Array con todas las tablas a crear
  const tables = [
    {
      name: "Character Goals Table",
      formula: "1d20",
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
    },
    {
      name: "Character Obstacles Table",
      formula: "1d20",
      results: [
        { text: "I thirst for revenge against those who wrong me.", weight: 1, range: [1, 1] },
        { text: "I blame myself for a tragedy in my past.", weight: 1, range: [2, 2] },
        { text: "I feel constrained by society's expectations.", weight: 1, range: [3, 3] },
        { text: "I am haunted by traumatic memories.", weight: 1, range: [4, 4] },
        { text: "I am restless, rarely satisfied with my present.", weight: 1, range: [5, 5] },
        { text: "I committed terrible acts in the past and can't forgive myself.", weight: 1, range: [6, 6] },
        { text: "I falsely believe myself to be evil.", weight: 1, range: [7, 7] },
        { text: "My intense curiosity distracts me at crucial moments.", weight: 1, range: [8, 8] },
        { text: "My fear of disappointing my mentor holds me back.", weight: 1, range: [9, 9] },
        { text: "I run headlong into danger.", weight: 1, range: [10, 10] },
        { text: "I rankle in the face of authority.", weight: 1, range: [11, 11] },
        { text: "I want to help, but I feel like I only make things worse.", weight: 1, range: [12, 12] },
        { text: "I can't help myself; when an item catches my interest, I must take it.", weight: 1, range: [13, 13] },
        { text: "I don't value my own time and energy, so I try to do everything myself.", weight: 1, range: [14, 14] },
        { text: "I'm so focused on my objectives that I forget others have goals, too.", weight: 1, range: [15, 15] },
        { text: "I believe I am a burden to everyone around me.", weight: 1, range: [16, 16] },
        { text: "I fear mortality and obsess over safety.", weight: 1, range: [17, 17] },
        { text: "I get stressed and overwhelmed easily.", weight: 1, range: [18, 18] },
        { text: "I tend to instantly regret my decisions.", weight: 1, range: [19, 19] },
        { text: "I will accept any challenge—and I mean any challenge.", weight: 1, range: [20, 20] }
      ]
    },
    {
      name: "Radiant Purpose Table",
      formula: "1d20",
      results: [
        { text: "Acknowledge my self-worth [Elsecaller]", weight: 1, range: [1, 1] },
        { text: "Face my fears [Lightweaver]", weight: 1, range: [2, 2] },
        { text: "Reject Odium's influence [Dustbringer]", weight: 1, range: [3, 3] },
        { text: "Bring order to a chaotic world [Skybreaker]", weight: 1, range: [4, 4] },
        { text: "Stand with people in need [Stoneward]", weight: 1, range: [5, 5] },
        { text: "Take down corrupt leaders [Skybreaker]", weight: 1, range: [6, 6] },
        { text: "Seek freedom for the oppressed [Willshaper]", weight: 1, range: [7, 7] },
        { text: "Protect those in need [Windrunner]", weight: 1, range: [8, 8] },
        { text: "Learn to trust others [Lightweaver]", weight: 1, range: [9, 9] },
        { text: "Help others find their purpose [Willshaper]", weight: 1, range: [10, 10] },
        { text: "Bring people together [Stoneward]", weight: 1, range: [11, 11] },
        { text: "Learn self-control [Dustbringer]", weight: 1, range: [12, 12] },
        { text: "Help the forgotten and ignored [Edgedancer]", weight: 1, range: [13, 13] },
        { text: "Make mistakes and learn from them [Elsecaller]", weight: 1, range: [14, 14] },
        { text: "Discover new or lost knowledge [Truthwatcher]", weight: 1, range: [15, 15] },
        { text: "Defend the people I love [Windrunner]", weight: 1, range: [16, 16] },
        { text: "Empathize with others, even enemies [Edgedancer]", weight: 1, range: [17, 17] },
        { text: "Confront my past [Lightweaver]", weight: 1, range: [18, 18] },
        { text: "Create opportunities for the unfortunate [Willshaper]", weight: 1, range: [19, 19] },
        { text: "Expose corruption [Truthwatcher]", weight: 1, range: [20, 20] }
      ]
    },
    {
      name: "Alethi Names",
      formula: "1d20",
      results: [
        { text: "Alarik", weight: 1, range: [1, 1] },
        { text: "Ashlani", weight: 1, range: [2, 2] },
        { text: "Bren", weight: 1, range: [3, 3] },
        { text: "Calinah", weight: 1, range: [4, 4] },
        { text: "Denilor", weight: 1, range: [5, 5] },
        { text: "Elanora", weight: 1, range: [6, 6] },
        { text: "Gavir", weight: 1, range: [7, 7] },
        { text: "Haveron", weight: 1, range: [8, 8] },
        { text: "Islani", weight: 1, range: [9, 9] },
        { text: "Kalilen", weight: 1, range: [10, 10] },
        { text: "Karivah", weight: 1, range: [11, 11] },
        { text: "Kelivar", weight: 1, range: [12, 12] },
        { text: "Malekar", weight: 1, range: [13, 13] },
        { text: "Noravi", weight: 1, range: [14, 14] },
        { text: "Ralador", weight: 1, range: [15, 15] },
        { text: "Rathani", weight: 1, range: [16, 16] },
        { text: "Ravalin", weight: 1, range: [17, 17] },
        { text: "Soran", weight: 1, range: [18, 18] },
        { text: "Tenil", weight: 1, range: [19, 19] },
        { text: "Yashira", weight: 1, range: [20, 20] }
      ]
    },
    {
      name: "Azish Names",
      formula: "1d20",
      results: [
        { text: "Adana", weight: 1, range: [1, 1] },
        { text: "Adebazik", weight: 1, range: [2, 2] },
        { text: "Ajaxir", weight: 1, range: [3, 3] },
        { text: "Baxtol", weight: 1, range: [4, 4] },
        { text: "Chivik", weight: 1, range: [5, 5] },
        { text: "Etosha", weight: 1, range: [6, 6] },
        { text: "Hauzir", weight: 1, range: [7, 7] },
        { text: "Ishola", weight: 1, range: [8, 8] },
        { text: "Ixikiel", weight: 1, range: [9, 9] },
        { text: "Jirana", weight: 1, range: [10, 10] },
        { text: "Kunde", weight: 1, range: [11, 11] },
        { text: "Lexomi", weight: 1, range: [12, 12] },
        { text: "Naxir", weight: 1, range: [13, 13] },
        { text: "Nineka", weight: 1, range: [14, 14] },
        { text: "Olufikki", weight: 1, range: [15, 15] },
        { text: "Quahinda", weight: 1, range: [16, 16] },
        { text: "Raukir", weight: 1, range: [17, 17] },
        { text: "Sigwir", weight: 1, range: [18, 18] },
        { text: "Yawande", weight: 1, range: [19, 19] },
        { text: "Zalron", weight: 1, range: [20, 20] }
      ]
    },
    {
      name: "Herdazian Names",
      formula: "1d20",
      results: [
        { text: "Alvoro", weight: 1, range: [1, 1] },
        { text: "Anelma", weight: 1, range: [2, 2] },
        { text: "Belora", weight: 1, range: [3, 3] },
        { text: "Benquiro", weight: 1, range: [4, 4] },
        { text: "Calispo", weight: 1, range: [5, 5] },
        { text: "Calita", weight: 1, range: [6, 6] },
        { text: "Chalvio", weight: 1, range: [7, 7] },
        { text: "Derena", weight: 1, range: [8, 8] },
        { text: "Dereno", weight: 1, range: [9, 9] },
        { text: "Galisha", weight: 1, range: [10, 10] },
        { text: "Garilo", weight: 1, range: [11, 11] },
        { text: "Henara", weight: 1, range: [12, 12] },
        { text: "Hencho", weight: 1, range: [13, 13] },
        { text: "Hocharo", weight: 1, range: [14, 14] },
        { text: "Jalira", weight: 1, range: [15, 15] },
        { text: "Lencho", weight: 1, range: [16, 16] },
        { text: "Narella", weight: 1, range: [17, 17] },
        { text: "Ornachal", weight: 1, range: [18, 18] },
        { text: "Taviro", weight: 1, range: [19, 19] },
        { text: "Tsupiren", weight: 1, range: [20, 20] }
      ]
    },
    {
      name: "Reshi Names",
      formula: "1d20",
      results: [
        { text: "Alin", weight: 1, range: [1, 1] },
        { text: "Avi-ra", weight: 1, range: [2, 2] },
        { text: "Caresa", weight: 1, range: [3, 3] },
        { text: "Enavi", weight: 1, range: [4, 4] },
        { text: "Fira", weight: 1, range: [5, 5] },
        { text: "Lami-na", weight: 1, range: [6, 6] },
        { text: "Naro", weight: 1, range: [7, 7] },
        { text: "Orin", weight: 1, range: [8, 8] },
        { text: "Ove-lan", weight: 1, range: [9, 9] },
        { text: "Pelan", weight: 1, range: [10, 10] },
        { text: "Quila", weight: 1, range: [11, 11] },
        { text: "Rinor", weight: 1, range: [12, 12] },
        { text: "Rishan", weight: 1, range: [13, 13] },
        { text: "Sela", weight: 1, range: [14, 14] },
        { text: "Selun", weight: 1, range: [15, 15] },
        { text: "Talu-ren", weight: 1, range: [16, 16] },
        { text: "Toru", weight: 1, range: [17, 17] },
        { text: "Varin", weight: 1, range: [18, 18] },
        { text: "Vena-lo", weight: 1, range: [19, 19] },
        { text: "Vesha", weight: 1, range: [20, 20] }
      ]
    },
    {
      name: "Shin Names",
      formula: "1d20",
      results: [
        { text: "Bratha", weight: 1, range: [1, 1] },
        { text: "Dolven", weight: 1, range: [2, 2] },
        { text: "Dren", weight: 1, range: [3, 3] },
        { text: "Eshel", weight: 1, range: [4, 4] },
        { text: "Jorven", weight: 1, range: [5, 5] },
        { text: "Kudeth", weight: 1, range: [6, 6] },
        { text: "Lis", weight: 1, range: [7, 7] },
        { text: "Loruva", weight: 1, range: [8, 8] },
        { text: "Malor", weight: 1, range: [9, 9] },
        { text: "Mereth", weight: 1, range: [10, 10] },
        { text: "Sethi", weight: 1, range: [11, 11] },
        { text: "Shaveth", weight: 1, range: [12, 12] },
        { text: "Talish", weight: 1, range: [13, 13] },
        { text: "Tem", weight: 1, range: [14, 14] },
        { text: "Torl", weight: 1, range: [15, 15] },
        { text: "Tumeshi", weight: 1, range: [16, 16] },
        { text: "Vash", weight: 1, range: [17, 17] },
        { text: "Voro", weight: 1, range: [18, 18] },
        { text: "Zeyra", weight: 1, range: [19, 19] },
        { text: "Zothen", weight: 1, range: [20, 20] }
      ]
    },
    {
      name: "Thaylen Names",
      formula: "1d20",
      results: [
        { text: "Alstrym", weight: 1, range: [1, 1] },
        { text: "Ardben", weight: 1, range: [2, 2] },
        { text: "Bniath", weight: 1, range: [3, 3] },
        { text: "Brekmynv", weight: 1, range: [4, 4] },
        { text: "Brynso", weight: 1, range: [5, 5] },
        { text: "Calkl", weight: 1, range: [6, 6] },
        { text: "Chalrek", weight: 1, range: [7, 7] },
        { text: "Creyn", weight: 1, range: [8, 8] },
        { text: "Crymna", weight: 1, range: [9, 9] },
        { text: "Dralen", weight: 1, range: [10, 10] },
        { text: "Elcryn", weight: 1, range: [11, 11] },
        { text: "Fintr", weight: 1, range: [12, 12] },
        { text: "Grytori", weight: 1, range: [13, 13] },
        { text: "Jarlkv", weight: 1, range: [14, 14] },
        { text: "Klazmn", weight: 1, range: [15, 15] },
        { text: "Lazreb", weight: 1, range: [16, 16] },
        { text: "Mlendl", weight: 1, range: [17, 17] },
        { text: "Rlozvnik", weight: 1, range: [18, 18] },
        { text: "Tnzram", weight: 1, range: [19, 19] },
        { text: "Ylbedr", weight: 1, range: [20, 20] }
      ]
    },
    {
      name: "Unkalaki Names",
      formula: "1d20",
      results: [
        { text: "Ahinaku", weight: 1, range: [1, 1] },
        { text: "Aluni", weight: 1, range: [2, 2] },
        { text: "Fala'noa", weight: 1, range: [3, 3] },
        { text: "Heli'mor", weight: 1, range: [4, 4] },
        { text: "Huneka", weight: 1, range: [5, 5] },
        { text: "Iro'kalin", weight: 1, range: [6, 6] },
        { text: "Kahu'nor", weight: 1, range: [7, 7] },
        { text: "Kaluna", weight: 1, range: [8, 8] },
        { text: "Kamali", weight: 1, range: [9, 9] },
        { text: "Keilani", weight: 1, range: [10, 10] },
        { text: "Laki'nor", weight: 1, range: [11, 11] },
        { text: "Lomakai", weight: 1, range: [12, 12] },
        { text: "Makori", weight: 1, range: [13, 13] },
        { text: "Nefari", weight: 1, range: [14, 14] },
        { text: "Pelinu'a", weight: 1, range: [15, 15] },
        { text: "Senaku", weight: 1, range: [16, 16] },
        { text: "Tanu'kai", weight: 1, range: [17, 17] },
        { text: "Tenali", weight: 1, range: [18, 18] },
        { text: "Tuano", weight: 1, range: [19, 19] },
        { text: "Vumali", weight: 1, range: [20, 20] }
      ]
    },
    {
      name: "Veden Names",
      formula: "1d20",
      results: [
        { text: "Amelith", weight: 1, range: [1, 1] },
        { text: "Batin", weight: 1, range: [2, 2] },
        { text: "Channae", weight: 1, range: [3, 3] },
        { text: "Denash", weight: 1, range: [4, 4] },
        { text: "Elivar", weight: 1, range: [5, 5] },
        { text: "Isha", weight: 1, range: [6, 6] },
        { text: "Jalresh", weight: 1, range: [7, 7] },
        { text: "Jezrel", weight: 1, range: [8, 8] },
        { text: "Kalen", weight: 1, range: [9, 9] },
        { text: "Keralin", weight: 1, range: [10, 10] },
        { text: "Nalek", weight: 1, range: [11, 11] },
        { text: "Narash", weight: 1, range: [12, 12] },
        { text: "Pallara", weight: 1, range: [13, 13] },
        { text: "Ravelor", weight: 1, range: [14, 14] },
        { text: "Relinor", weight: 1, range: [15, 15] },
        { text: "Selvan", weight: 1, range: [16, 16] },
        { text: "Shalinor", weight: 1, range: [17, 17] },
        { text: "Talin", weight: 1, range: [18, 18] },
        { text: "Yelinar", weight: 1, range: [19, 19] },
        { text: "Zarev", weight: 1, range: [20, 20] }
      ]
    }
  ];

  for (const tableData of tables) {
    const exists = game.tables.getName(tableData.name);
    
    if (!exists) {
      console.log(`Cosmere RPG Tooling | Creando ${tableData.name}...`);
      
      const data = {
        name: tableData.name,
        formula: tableData.formula,
        replacement: true,
        displayRoll: true,
        results: tableData.results
      };

      try {
        await RollTable.create(data);
        console.log(`Cosmere RPG Tooling | ${tableData.name} creada`);
      } catch (error) {
        console.error(`Cosmere RPG Tooling | Error al crear ${tableData.name}:`, error);
      }
    }
  }

  // Notificación final
  ui.notifications.info("Cosmere RPG Tooling: Todas las tablas están listas!");
  console.log("Cosmere RPG Tooling | Módulo cargado correctamente - 11 tablas disponibles");
});