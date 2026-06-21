// ═══════════════════════════════════════════════════════
// RESTAURANTS DE COLLO — DONNÉES COMPLÈTES
// ═══════════════════════════════════════════════════════

const RESTAURANTS = [
  {
    id: 'la-vouteeeeeee',
    name: 'La Voûte',
    emoji: '🏛️',
    category: 'Tacos • Burgers • Pizza',
    description: 'Le meilleur fast food de Collo — Tacos, Burgers & Pizzas maison',
    address: 'Rue Principale, Centre-ville, Collo',
    lat: 37.0014,
    lng: 6.5620,
    rating: 4.8,
    deliveryTime: '20-35 min',
    deliveryFee: 100,
    minOrder: 400,
    open: true,
    tags: ['Populaire', 'Nouveau'],
    cover: '🌯',
    menu: {
      tacos: {
        label: '🌯 Tacos',
        items: [
          {
            id: 'tacos-simple', name: 'Tacos Simple', basePrice: 450,
            description: 'Tortilla grillée, frites, sauce blanche',
            options: {
              viande: { label: 'Viande', required: true, choices: [
                { id: 'poulet', label: 'Poulet', price: 0 },
                { id: 'viande-hachee', label: 'Viande hachée', price: 0 },
                { id: 'kebda', label: 'Kebda (foie)', price: 0 },
                { id: 'mixte', label: 'Mixte (poulet + viande)', price: 50 },
                { id: 'merguez', label: 'Merguez', price: 0 },
              ]},
              gratine: { label: 'Gratiné au fromage', required: false, type: 'checkbox', price: 50 },
              sauce: { label: 'Sauce', required: false, choices: [
                { id: 'blanche', label: 'Sauce blanche', price: 0 },
                { id: 'harissa', label: 'Harissa', price: 0 },
                { id: 'ketchup', label: 'Ketchup', price: 0 },
                { id: 'bbq', label: 'BBQ', price: 0 },
                { id: 'algérienne', label: 'Algérienne', price: 0 },
              ]},
            }
          },
          {
            id: 'tacos-double', name: 'Tacos Double', basePrice: 600,
            description: 'Double viande, frites, fromage fondu',
            options: {
              viande: { label: 'Viande', required: true, choices: [
                { id: 'poulet', label: 'Poulet x2', price: 0 },
                { id: 'viande-hachee', label: 'Viande hachée x2', price: 0 },
                { id: 'kebda', label: 'Kebda x2', price: 0 },
                { id: 'mixte', label: 'Poulet + Viande', price: 0 },
                { id: 'mixte2', label: 'Poulet + Kebda', price: 0 },
              ]},
              gratine: { label: 'Gratiné au fromage', required: false, type: 'checkbox', price: 50 },
              sauce: { label: 'Sauce', required: false, choices: [
                { id: 'blanche', label: 'Sauce blanche', price: 0 },
                { id: 'harissa', label: 'Harissa', price: 0 },
                { id: 'bbq', label: 'BBQ', price: 0 },
                { id: 'algérienne', label: 'Algérienne', price: 0 },
              ]},
            }
          },
          {
            id: 'tacos-maxi', name: 'Tacos Maxi XXL', basePrice: 750,
            description: 'Format XXL, triple garniture, frites maison',
            options: {
              viande: { label: 'Viande', required: true, choices: [
                { id: 'poulet', label: 'Poulet', price: 0 },
                { id: 'viande-hachee', label: 'Viande hachée', price: 0 },
                { id: 'mixte3', label: 'Poulet + Viande + Kebda', price: 50 },
              ]},
              gratine: { label: 'Gratiné au fromage', required: false, type: 'checkbox', price: 50 },
              sauce: { label: 'Sauce', required: false, choices: [
                { id: 'blanche', label: 'Sauce blanche', price: 0 },
                { id: 'harissa', label: 'Harissa', price: 0 },
                { id: 'bbq', label: 'BBQ', price: 0 },
                { id: 'algérienne', label: 'Algérienne', price: 0 },
              ]},
            }
          },
        ]
      },
      burgers: {
        label: '🍔 Burgers',
        items: [
          {
            id: 'burger-poulet', name: 'Burger Poulet', basePrice: 400,
            description: 'Escalope de poulet croustillante, salade, tomate',
            options: {
              cuisson: { label: 'Type de poulet', required: true, choices: [
                { id: 'grille', label: 'Poulet grillé', price: 0 },
                { id: 'crispy', label: 'Poulet Crispy (pané)', price: 0 },
                { id: 'spicy', label: 'Poulet Spicy (épicé)', price: 0 },
              ]},
              sauce: { label: 'Sauce', required: false, choices: [
                { id: 'mayo', label: 'Mayonnaise', price: 0 },
                { id: 'blanche', label: 'Sauce blanche', price: 0 },
                { id: 'bbq', label: 'BBQ', price: 0 },
                { id: 'ketchup', label: 'Ketchup', price: 0 },
                { id: 'algérienne', label: 'Algérienne', price: 0 },
              ]},
              supplement: { label: 'Supplément', required: false, choices: [
                { id: 'fromage', label: '+ Fromage', price: 50 },
                { id: 'bacon', label: '+ Merguez', price: 80 },
                { id: 'oeuf', label: '+ Oeuf', price: 40 },
              ]},
            }
          },
          {
            id: 'burger-viande', name: 'Burger Viande', basePrice: 450,
            description: 'Steak haché 100% bœuf, cheddar, oignons caramélisés',
            options: {
              cuisson: { label: 'Cuisson', required: true, choices: [
                { id: 'bien', label: 'Bien cuit', price: 0 },
                { id: 'moyen', label: 'À point', price: 0 },
              ]},
              sauce: { label: 'Sauce', required: false, choices: [
                { id: 'mayo', label: 'Mayonnaise', price: 0 },
                { id: 'bbq', label: 'BBQ', price: 0 },
                { id: 'algérienne', label: 'Algérienne', price: 0 },
              ]},
              supplement: { label: 'Supplément', required: false, choices: [
                { id: 'fromage', label: '+ Cheddar extra', price: 50 },
                { id: 'merguez', label: '+ Merguez', price: 80 },
                { id: 'oeuf', label: '+ Oeuf', price: 40 },
              ]},
            }
          },
          {
            id: 'burger-double', name: 'Double Burger', basePrice: 600,
            description: 'Double steak, double fromage, sauce maison',
            options: {
              viande: { label: 'Composition', required: true, choices: [
                { id: 'double-viande', label: 'Double viande hachée', price: 0 },
                { id: 'double-poulet', label: 'Double poulet crispy', price: 0 },
                { id: 'mixte', label: 'Viande + Poulet', price: 0 },
              ]},
              sauce: { label: 'Sauce', required: false, choices: [
                { id: 'maison', label: 'Sauce maison', price: 0 },
                { id: 'bbq', label: 'BBQ', price: 0 },
                { id: 'algérienne', label: 'Algérienne', price: 0 },
              ]},
              gratine: { label: 'Double fromage fondu', required: false, type: 'checkbox', price: 80 },
            }
          },
          {
            id: 'crispy-burger', name: 'Crispy Burger', basePrice: 420,
            description: 'Poulet croustillant pané, coleslaw, sauce crispy',
            options: {
              sauce: { label: 'Sauce', required: false, choices: [
                { id: 'crispy', label: 'Sauce crispy maison', price: 0 },
                { id: 'mayo', label: 'Mayonnaise', price: 0 },
                { id: 'harissa', label: 'Harissa', price: 0 },
              ]},
              supplement: { label: 'Supplément', required: false, choices: [
                { id: 'fromage', label: '+ Fromage', price: 50 },
                { id: 'jalapeno', label: '+ Piment jalapeño', price: 30 },
              ]},
            }
          },
        ]
      },
      pizzas: {
        label: '🍕 Pizzas',
        items: [
          {
            id: 'pizza-margherita', name: 'Margherita', basePrice: 600,
            description: 'Sauce tomate, mozzarella, basilic frais',
            options: {
              taille: { label: 'Taille', required: true, choices: [
                { id: 'moyenne', label: '28cm Moyenne', price: 0 },
                { id: 'grande', label: '33cm Grande', price: 150 },
                { id: 'xl', label: '40cm XL', price: 300 },
              ]},
              bord: { label: 'Bord', required: false, choices: [
                { id: 'normal', label: 'Bord normal', price: 0 },
                { id: 'fromage', label: 'Bord fromage', price: 100 },
              ]},
            }
          },
          {
            id: 'pizza-poulet', name: 'Pizza Poulet BBQ', basePrice: 700,
            description: 'Poulet grillé, poivrons, oignons, sauce BBQ',
            options: {
              taille: { label: 'Taille', required: true, choices: [
                { id: 'moyenne', label: '28cm Moyenne', price: 0 },
                { id: 'grande', label: '33cm Grande', price: 150 },
                { id: 'xl', label: '40cm XL', price: 300 },
              ]},
              bord: { label: 'Bord', required: false, choices: [
                { id: 'normal', label: 'Bord normal', price: 0 },
                { id: 'fromage', label: 'Bord fromage', price: 100 },
              ]},
              supplement: { label: 'Supplément', required: false, choices: [
                { id: 'jalapeno', label: '+ Jalapeño', price: 50 },
                { id: 'olive', label: '+ Olives', price: 50 },
                { id: 'mozzarella', label: '+ Mozzarella extra', price: 80 },
              ]},
            }
          },
          {
            id: 'pizza-viande', name: 'Pizza Viande Spéciale', basePrice: 800,
            description: 'Viande hachée, merguez, poivrons, mozzarella',
            options: {
              taille: { label: 'Taille', required: true, choices: [
                { id: 'moyenne', label: '28cm Moyenne', price: 0 },
                { id: 'grande', label: '33cm Grande', price: 150 },
                { id: 'xl', label: '40cm XL', price: 300 },
              ]},
              bord: { label: 'Bord', required: false, choices: [
                { id: 'normal', label: 'Bord normal', price: 0 },
                { id: 'fromage', label: 'Bord fromage', price: 100 },
              ]},
            }
          },
          {
            id: 'pizza-4fromages', name: 'Pizza 4 Fromages', basePrice: 750,
            description: 'Mozzarella, cheddar, emmental, parmesan',
            options: {
              taille: { label: 'Taille', required: true, choices: [
                { id: 'moyenne', label: '28cm Moyenne', price: 0 },
                { id: 'grande', label: '33cm Grande', price: 150 },
                { id: 'xl', label: '40cm XL', price: 300 },
              ]},
            }
          },
          {
            id: 'pizza-orientale', name: 'Pizza Orientale', basePrice: 720,
            description: 'Merguez, harissa, oignons, poivrons grillés',
            options: {
              taille: { label: 'Taille', required: true, choices: [
                { id: 'moyenne', label: '28cm Moyenne', price: 0 },
                { id: 'grande', label: '33cm Grande', price: 150 },
                { id: 'xl', label: '40cm XL', price: 300 },
              ]},
              epicé: { label: 'Niveau épicé', required: false, choices: [
                { id: 'doux', label: 'Doux', price: 0 },
                { id: 'moyen', label: 'Moyen', price: 0 },
                { id: 'fort', label: 'Fort 🌶️', price: 0 },
              ]},
            }
          },
        ]
      },
      sides: {
        label: '🍟 Accompagnements',
        items: [
          { id: 'frites', name: 'Frites Maison', basePrice: 150, description: 'Frites fraîches croustillantes', options: {} },
          { id: 'nuggets', name: 'Nuggets x6', basePrice: 250, description: '6 nuggets de poulet dorés', options: {} },
          { id: 'salade', name: 'Salade Fraîche', basePrice: 120, description: 'Salade maison, vinaigrette', options: {} },
          { id: 'boisson', name: 'Boisson 33cl', basePrice: 80, description: 'Coca, Fanta, eau, jus', options: {
            choix: { label: 'Boisson', required: true, choices: [
              { id: 'coca', label: 'Coca-Cola', price: 0 },
              { id: 'fanta', label: 'Fanta Orange', price: 0 },
              { id: 'sprite', label: 'Sprite', price: 0 },
              { id: 'eau', label: 'Eau minérale', price: -20 },
              { id: 'jus', label: 'Jus de fruits', price: 20 },
            ]}
          }},
        ]
      }
    }
  },

  // ── AUTRES RESTAURANTS ───────────────────────────────
  {
    id: 'collo-burger',
    name: 'Collo Burger',
    emoji: '🍔',
    category: 'Burgers • Sandwichs',
    description: 'Burgers artisanaux et sandwichs chauds',
    address: 'Avenue du 1er Novembre, Collo',
    lat: 37.0025,
    lng: 6.5635,
    rating: 4.5,
    deliveryTime: '25-40 min',
    deliveryFee: 100,
    minOrder: 350,
    open: true,
    tags: ['Burgers'],
    cover: '🍔',
    menu: {
      burgers: { label: '🍔 Burgers', items: [
        { id: 'cb1', name: 'Classic Burger', basePrice: 380, description: 'Steak haché, cheddar, cornichons', options: { sauce: { label: 'Sauce', required: false, choices: [{ id: 'mayo', label: 'Mayo', price: 0 },{ id: 'ketchup', label: 'Ketchup', price: 0 }] } } },
        { id: 'cb2', name: 'Chicken Burger', basePrice: 350, description: 'Poulet grillé, salade, tomate', options: {} },
        { id: 'cb3', name: 'Smash Burger', basePrice: 480, description: 'Double smash, fromage fondu', options: {} },
      ]},
      sides: { label: '🍟 Sides', items: [
        { id: 'cb4', name: 'Frites', basePrice: 130, description: '', options: {} },
        { id: 'cb5', name: 'Onion Rings', basePrice: 180, description: '', options: {} },
      ]},
    }
  },

  {
    id: 'pizza-collo',
    name: 'Pizza Collo',
    emoji: '🍕',
    category: 'Pizzas',
    description: 'Pizzas au feu de bois, pâte fine croustillante',
    address: 'Cité Ennasr, Collo',
    lat: 36.9998,
    lng: 6.5608,
    rating: 4.6,
    deliveryTime: '30-45 min',
    deliveryFee: 120,
    minOrder: 500,
    open: true,
    tags: ['Pizza'],
    cover: '🍕',
    menu: {
      pizzas: { label: '🍕 Pizzas', items: [
        { id: 'pc1', name: 'Reine', basePrice: 650, description: 'Jambon, champignons, mozzarella', options: { taille: { label: 'Taille', required: true, choices: [{ id: 'm', label: 'Moyenne', price: 0 },{ id: 'g', label: 'Grande', price: 150 }] } } },
        { id: 'pc2', name: 'Orientale', basePrice: 700, description: 'Merguez, harissa, oignons', options: { taille: { label: 'Taille', required: true, choices: [{ id: 'm', label: 'Moyenne', price: 0 },{ id: 'g', label: 'Grande', price: 150 }] } } },
        { id: 'pc3', name: 'Végétarienne', basePrice: 600, description: 'Légumes grillés, mozzarella', options: { taille: { label: 'Taille', required: true, choices: [{ id: 'm', label: 'Moyenne', price: 0 },{ id: 'g', label: 'Grande', price: 150 }] } } },
      ]},
    }
  },

  {
    id: 'snack-el-bahar',
    name: 'Snack El Bahar',
    emoji: '🐟',
    category: 'Sandwichs • Poisson',
    description: 'Sandwichs frais et poisson grillé face à la mer',
    address: 'Front de mer, Collo',
    lat: 37.0040,
    lng: 6.5650,
    rating: 4.3,
    deliveryTime: '20-30 min',
    deliveryFee: 80,
    minOrder: 300,
    open: true,
    tags: ['Local', 'Poisson'],
    cover: '🐟',
    menu: {
      sandwichs: { label: '🥖 Sandwichs', items: [
        { id: 'sb1', name: 'Sandwich Thon', basePrice: 250, description: 'Thon, œuf, harissa, frites', options: {} },
        { id: 'sb2', name: 'Sandwich Crevettes', basePrice: 320, description: 'Crevettes grillées, salade, sauce', options: {} },
        { id: 'sb3', name: 'Merguez Frites', basePrice: 220, description: 'Merguez grillée, harissa, frites', options: {} },
      ]},
    }
  },

  {
    id: 'shawarma-palace',
    name: 'Shawarma Palace',
    emoji: '🌮',
    category: 'Shawarma • Tacos',
    description: 'Shawarma libanais authentique et tacos maison',
    address: 'Rue du Commerce, Collo',
    lat: 37.0010,
    lng: 6.5595,
    rating: 4.7,
    deliveryTime: '15-25 min',
    deliveryFee: 100,
    minOrder: 350,
    open: true,
    tags: ['Populaire'],
    cover: '🌮',
    menu: {
      shawarma: { label: '🌮 Shawarma', items: [
        { id: 'sp1', name: 'Shawarma Poulet', basePrice: 280, description: 'Poulet mariné, crudités, sauce toom', options: { sauce: { label: 'Sauce', required: false, choices: [{ id: 'toom', label: 'Sauce Toom (ail)', price: 0 },{ id: 'harissa', label: 'Harissa', price: 0 }] } } },
        { id: 'sp2', name: 'Shawarma Mixte', basePrice: 350, description: 'Viande + Poulet, légumes, sauce', options: {} },
        { id: 'sp3', name: 'Assiette Shawarma', basePrice: 500, description: 'Grande assiette avec frites et salade', options: {} },
      ]},
    }
  },

  {
    id: 'chicken-house',
    name: 'Chicken House',
    emoji: '🍗',
    category: 'Poulet • Crispy',
    description: 'Poulet frit style américain, crispy et juteux',
    address: 'Zone Commerciale, Collo',
    lat: 37.0005,
    lng: 6.5640,
    rating: 4.4,
    deliveryTime: '25-35 min',
    deliveryFee: 100,
    minOrder: 400,
    open: true,
    tags: ['Crispy'],
    cover: '🍗',
    menu: {
      poulet: { label: '🍗 Poulet', items: [
        { id: 'ch1', name: 'Bucket Crispy 4 pièces', basePrice: 680, description: '4 morceaux poulet frit croustillant', options: {} },
        { id: 'ch2', name: 'Bucket Crispy 8 pièces', basePrice: 1200, description: '8 morceaux, idéal famille', options: {} },
        { id: 'ch3', name: 'Crispy Strips x5', basePrice: 450, description: 'Lanières de poulet croustillantes', options: {} },
        { id: 'ch4', name: 'Crispy Burger', basePrice: 400, description: 'Filet crispy, salade, mayo', options: {} },
      ]},
    }
  },

  {
    id: 'le-gourmet',
    name: 'Le Gourmet',
    emoji: '👨‍🍳',
    category: 'Cuisine maison • Sandwichs',
    description: 'Plats cuisinés maison, sandwichs chauds et salades',
    address: 'Quartier El Wiam, Collo',
    lat: 36.9990,
    lng: 6.5610,
    rating: 4.5,
    deliveryTime: '30-45 min',
    deliveryFee: 80,
    minOrder: 300,
    open: true,
    tags: ['Maison'],
    cover: '👨‍🍳',
    menu: {
      plats: { label: '🍽️ Plats', items: [
        { id: 'lg1', name: 'Poulet rôti', basePrice: 800, description: 'Demi-poulet rôti avec accompagnements', options: {} },
        { id: 'lg2', name: 'Sandwich Kefta', basePrice: 250, description: 'Kefta grillée, oignons, harissa', options: {} },
        { id: 'lg3', name: 'Salade César Poulet', basePrice: 350, description: 'Salade romaine, poulet grillé, croutons', options: {} },
      ]},
    }
  },

  {
    id: 'snack-central',
    name: 'Snack Central',
    emoji: '🥙',
    category: 'Sandwichs • Paninis',
    description: 'Paninis chauds et sandwichs baguette généreux',
    address: 'Centre Ville, près du marché',
    lat: 37.0020,
    lng: 6.5615,
    rating: 4.2,
    deliveryTime: '15-25 min',
    deliveryFee: 80,
    minOrder: 250,
    open: true,
    tags: ['Rapide'],
    cover: '🥙',
    menu: {
      paninis: { label: '🥙 Paninis & Sandwichs', items: [
        { id: 'sc1', name: 'Panini Poulet-Fromage', basePrice: 280, description: 'Poulet grillé, fromage fondu, légumes', options: {} },
        { id: 'sc2', name: 'Panini Viande', basePrice: 300, description: 'Viande hachée, fromage, oignons', options: {} },
        { id: 'sc3', name: 'Sandwich Club', basePrice: 320, description: 'Triple couche, poulet, œuf, salade', options: {} },
      ]},
    }
  },

  {
    id: 'pizza-express',
    name: 'Pizza Express',
    emoji: '⚡',
    category: 'Pizza • Livraison rapide',
    description: 'Pizzas livrées en 30 min garanties',
    address: 'Boulevard de la République, Collo',
    lat: 37.0030,
    lng: 6.5625,
    rating: 4.3,
    deliveryTime: '25-35 min',
    deliveryFee: 100,
    minOrder: 500,
    open: false,
    tags: ['Fermé'],
    cover: '⚡',
    menu: {
      pizzas: { label: '🍕 Pizzas', items: [
        { id: 'pe1', name: 'Pizza Thon', basePrice: 650, description: 'Thon, olives, câpres, mozzarella', options: { taille: { label: 'Taille', required: true, choices: [{ id: 'm', label: 'Moyenne', price: 0 },{ id: 'g', label: 'Grande', price: 150 }] } } },
        { id: 'pe2', name: 'Pizza Viande', basePrice: 700, description: 'Viande hachée, poivrons, fromage', options: { taille: { label: 'Taille', required: true, choices: [{ id: 'm', label: 'Moyenne', price: 0 },{ id: 'g', label: 'Grande', price: 150 }] } } },
      ]},
    }
  },

  {
    id: 'fast-delice',
    name: 'Fast Délice',
    emoji: '✨',
    category: 'Burgers • Tacos • Pizza',
    description: 'Tout le fast food en un seul endroit !',
    address: 'Cité 500 Logts, Collo',
    lat: 36.9985,
    lng: 6.5630,
    rating: 4.1,
    deliveryTime: '30-45 min',
    deliveryFee: 120,
    minOrder: 400,
    open: true,
    tags: [],
    cover: '✨',
    menu: {
      mix: { label: '🌟 Menu Mix', items: [
        { id: 'fd1', name: 'Burger Classic', basePrice: 380, description: 'Steak, fromage, sauce maison', options: {} },
        { id: 'fd2', name: 'Tacos Poulet', basePrice: 450, description: 'Poulet, frites, sauce blanche', options: { viande: { label: 'Viande', required: true, choices: [{ id: 'p', label: 'Poulet', price: 0 },{ id: 'v', label: 'Viande', price: 0 }] } } },
        { id: 'fd3', name: 'Pizza Mixte', basePrice: 700, description: 'Viande + légumes, fromage fondu', options: { taille: { label: 'Taille', required: true, choices: [{ id: 'm', label: 'Moyenne', price: 0 },{ id: 'g', label: 'Grande', price: 150 }] } } },
      ]},
    }
  },
];

const DEFAULT_RESTAURANT_IMAGE = '/images/food/plate.svg';

const RESTAURANT_IMAGE_BY_ID = {
  'la-voute': '/images/food/tacos.svg',
  'collo-burger': '/images/food/burger.svg',
  'pizza-collo': '/images/food/pizza.svg',
  'snack-el-bahar': '/images/food/fish.svg',
  'shawarma-palace': '/images/food/tacos.svg',
  'chicken-house': '/images/food/chicken.svg',
  'le-gourmet': '/images/food/plate.svg',
  'snack-central': '/images/food/sandwich.svg',
  'pizza-express': '/images/food/pizza.svg',
  'fast-delice': '/images/food/burger.svg',
};

const MENU_IMAGE_BY_KEY = {
  tacos: '/images/food/tacos.svg',
  burgers: '/images/food/burger.svg',
  pizzas: '/images/food/pizza.svg',
  sides: '/images/food/fries.svg',
  sandwichs: '/images/food/sandwich.svg',
  shawarma: '/images/food/tacos.svg',
  poulet: '/images/food/chicken.svg',
  plats: '/images/food/plate.svg',
  paninis: '/images/food/sandwich.svg',
  mix: '/images/food/plate.svg',
};

function cleanLabel(label = '') {
  return label.replace(/^[^A-Za-z0-9À-ÿ]+/, '').trim();
}

module.exports = RESTAURANTS.map((resto) => {
  const restaurantImage = RESTAURANT_IMAGE_BY_ID[resto.id] || DEFAULT_RESTAURANT_IMAGE;

  return {
    ...resto,
    image: restaurantImage,
    coverImage: restaurantImage,
    menu: Object.fromEntries(
      Object.entries(resto.menu).map(([key, cat]) => [
        key,
        {
          ...cat,
          label: cleanLabel(cat.label),
          image: MENU_IMAGE_BY_KEY[key] || DEFAULT_RESTAURANT_IMAGE,
        },
      ])
    ),
  };
});
