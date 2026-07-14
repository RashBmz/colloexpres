const db = require('../models/db');

const images = {
  pizza: '/images/food/pizza.svg',
  tacos: '/images/food/tacos.svg',
  burger: '/images/food/burger.svg',
  sandwich: '/images/food/sandwich.svg',
  fries: '/images/food/fries.svg',
  plate: '/images/food/plate.svg',
  drinks: '/images/food/plate.svg',
  cover: '/images/restaurants/marcimini-cover.jpg',
};

function slug(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function choices(rows, basePrice) {
  return rows.map(([label, finalPrice]) => ({
    id: slug(label),
    label,
    price: Number(finalPrice) - Number(basePrice),
  }));
}

function requiredChoice(label, rows, basePrice) {
  return {
    label,
    required: true,
    choices: choices(rows, basePrice),
  };
}

function optionalChoice(label, rows) {
  return {
    label,
    required: false,
    choices: rows.map(([id, choiceLabel, price]) => ({ id, label: choiceLabel, price })),
  };
}

function item(id, name, basePrice, description, image, options = {}) {
  return { id, name, basePrice, description, image, options };
}

const sauceOption = optionalChoice('Sauce', [
  ['algerienne', 'Algerienne', 0],
  ['andalouse', 'Andalouse', 0],
  ['blanche', 'Blanche', 0],
  ['harissa', 'Harissa', 0],
  ['ketchup', 'Ketchup', 0],
  ['mayo', 'Mayonnaise', 0],
]);

const menu = {
  pizzas: {
    label: 'Pizzas',
    order: 1,
    image: images.pizza,
    items: [
      item('pizza-tomate', 'Pizza tomate', 300, 'Choisis la recette et la taille.', images.pizza, {
        recette: requiredChoice('Recette et taille', [
          ['Margherita L', 300],
          ['Margherita XL', 600],
          ['Margherita XXL', 900],
          ['Poulet L', 400],
          ['Poulet XL', 800],
          ['Poulet XXL', 1200],
          ['Viande L', 450],
          ['Viande XL', 900],
          ['Viande XXL', 1300],
          ['Merguez L', 400],
          ['Merguez XL', 800],
          ['Merguez XXL', 1200],
          ['Vegetarienne L', 400],
          ['Vegetarienne XL', 800],
          ['Vegetarienne XXL', 1200],
          ['Thon L', 400],
          ['Thon XL', 800],
          ['Thon XXL', 1200],
          ['3 fromages L', 500],
          ['3 fromages XL', 1000],
          ['3 fromages XXL', 1500],
          ['Dinde fumee L', 550],
          ['Dinde fumee XL', 1100],
          ['Dinde fumee XXL', 1600],
        ], 300),
      }),
      item('pizza-boisee', 'Pizza boisee', 350, 'Base boisee, recette et taille au choix.', images.pizza, {
        recette: requiredChoice('Recette et taille', [
          ['Boisee Margherita L', 350],
          ['Boisee Margherita XL', 700],
          ['Boisee Margherita XXL', 1000],
          ['Boisee Poulet L', 450],
          ['Boisee Poulet XL', 900],
          ['Boisee Poulet XXL', 1300],
          ['Boisee Viande L', 500],
          ['Boisee Viande XL', 1000],
          ['Boisee Viande XXL', 1500],
          ['Boisee Merguez L', 450],
          ['Boisee Merguez XL', 900],
          ['Boisee Merguez XXL', 1300],
          ['Boisee 3 fromages L', 550],
          ['Boisee 3 fromages XL', 1100],
          ['Boisee 3 fromages XXL', 1600],
          ['Boisee fumee L', 600],
          ['Boisee fumee XL', 1200],
          ['Boisee fumee XXL', 1800],
          ['Panache L', 450],
          ['Panache XL', 900],
          ['Panache XXL', 1300],
          ['4 saisons L', 500],
          ['4 saisons XL', 1000],
          ['4 saisons XXL', 1500],
          ['Marcimini L', 600],
          ['Marcimini XL', 1200],
          ['Marcimini XXL', 1800],
        ], 350),
      }),
    ],
  },
  tacos_wraps: {
    label: 'Tacos & wraps',
    order: 2,
    image: images.tacos,
    items: [
      item('tacos', 'Tacos', 350, 'Tacos avec recette, taille et sauce au choix.', images.tacos, {
        recette: requiredChoice('Recette et taille', [
          ['Poulet L', 350],
          ['Poulet XL', 650],
          ['Viande L', 400],
          ['Viande XL', 750],
          ['Kabab L', 450],
          ['Kabab XL', 850],
          ['Mixte L', 450],
          ['Mixte XL', 850],
          ['Marcimini L', 600],
          ['Marcimini XL', 1100],
        ], 350),
        sauce: sauceOption,
        gratinage: { label: 'Gratinage', type: 'checkbox', price: 100 },
      }),
      item('souffle', 'Souffle', 400, 'Souffle chaud avec recette au choix.', images.tacos, {
        recette: requiredChoice('Recette et taille', [
          ['Poulet L', 400],
          ['Poulet XL', 750],
          ['Viande L', 450],
          ['Viande XL', 850],
          ['Kabab L', 450],
          ['Kabab XL', 850],
          ['Mixte L', 500],
          ['Mixte XL', 950],
          ['Marcimini L', 600],
          ['Marcimini XL', 1100],
        ], 400),
        sauce: sauceOption,
      }),
      item('makloub', 'Makloub', 350, 'Makloub garni et sauce au choix.', images.sandwich, {
        recette: requiredChoice('Recette', [
          ['Poulet', 350],
          ['Viande', 400],
          ['Kabab', 450],
          ['Mixte', 450],
          ['Marcimini', 600],
        ], 350),
        sauce: sauceOption,
      }),
      item('chawarma', 'Chawarma', 300, 'Chawarma servi en rarif, pain ou matlouh.', images.tacos, {
        pain: requiredChoice('Format', [
          ['Rarif', 300],
          ['Pain', 300],
          ['Matlouh', 300],
        ], 300),
        sauce: sauceOption,
      }),
    ],
  },
  burgers_sandwichs: {
    label: 'Burgers & sandwichs',
    order: 3,
    image: images.burger,
    items: [
      item('burger', 'Burger', 200, 'Du simple burger au Marcimini bien charge.', images.burger, {
        recette: requiredChoice('Recette', [
          ['Simple burger', 200],
          ['Chicken burger', 250],
          ['Cheese burger', 300],
          ['King burger', 350],
          ['Big burger', 450],
          ['Burger Marcimini', 600],
        ], 200),
        sauce: sauceOption,
      }),
      item('sandwich', 'Sandwich', 200, 'Sandwich rapide avec garniture au choix.', images.sandwich, {
        recette: requiredChoice('Recette', [
          ['Frit omelette', 200],
          ['Poulet', 250],
          ['Viande', 300],
          ['Merguez', 300],
          ['Kabab', 350],
          ['Mixte', 400],
          ['Marcimini', 500],
        ], 200),
        sauce: sauceOption,
      }),
      item('chapati', 'Chapati', 250, 'Chapati bien garni et grille.', images.sandwich, {
        recette: requiredChoice('Recette', [
          ['Thon', 250],
          ['Poulet', 300],
          ['Viande', 300],
          ['Kabab', 350],
          ['Mixte', 400],
        ], 250),
        sauce: sauceOption,
      }),
    ],
  },
  plats_poutines: {
    label: 'Plats & poutines',
    order: 4,
    image: images.plate,
    items: [
      item('poutine', 'Poutine', 450, 'Poutine chaude et genereuse.', images.fries, {
        recette: requiredChoice('Recette', [
          ['Poulet', 450],
          ['Viande', 500],
          ['Kabda', 550],
          ['Mixte', 600],
        ], 450),
      }),
      item('plat', 'Plat', 500, 'Assiette complete avec frites et garniture.', images.plate, {
        recette: requiredChoice('Recette', [
          ['Chawarma', 500],
          ['Viande', 550],
          ['Kabda', 600],
          ['Mixte', 650],
          ['Marcimini', 700],
        ], 500),
      }),
    ],
  },
  crepes_desserts: {
    label: 'Crepes & desserts',
    order: 5,
    image: images.plate,
    items: [
      item('crepe', 'Crepe sucree', 300, 'Crepe simple, fruit ou mixte.', images.plate, {
        recette: requiredChoice('Recette', [
          ['Simple', 300],
          ['Banane', 350],
          ['Fraise', 400],
          ['Mixte', 450],
        ], 300),
      }),
      item('dessert', 'Dessert', 200, 'Dessert maison selon disponibilite.', images.plate, {
        choix: requiredChoice('Choix', [
          ['Fondant au choco', 200],
          ['Verrine', 250],
          ['Grande verrine', 300],
          ['Tiramisu', 300],
          ['Cheese cake', 350],
        ], 200),
      }),
    ],
  },
  boissons: {
    label: 'Boissons',
    order: 6,
    image: images.drinks,
    items: [
      item('canette-33cl', 'Canette 33cl', 120, 'Choisis ta boisson fraiche.', images.drinks, {
        boisson: requiredChoice('Boisson', [
          ['Coca-Cola', 120],
          ['Fanta', 120],
          ['Sprite', 120],
          ['Hamoud', 120],
          ['Slim', 120],
          ['Selecto', 120],
          ['Ifri', 120],
        ], 120),
      }),
      item('bouteille-1l', 'Bouteille 1L', 220, 'Format familial.', images.drinks, {
        boisson: requiredChoice('Boisson', [
          ['Coca-Cola 1L', 220],
          ['Hamoud 1L', 220],
          ['Slim 1L', 220],
          ['Selecto 1L', 220],
        ], 220),
      }),
      item('eau-minerale', 'Eau minerale', 80, 'Petite ou grande bouteille.', images.drinks, {
        format: requiredChoice('Format', [
          ['Petite bouteille', 80],
          ['Bouteille 1.5L', 150],
        ], 80),
      }),
      item('boisson-chaude', 'Boisson chaude', 100, 'Cafe, the ou cappuccino.', images.drinks, {
        choix: requiredChoice('Choix', [
          ['Cafe', 100],
          ['The', 100],
          ['Cappuccino', 150],
          ['Milkshake', 300],
        ], 100),
      }),
      item('jus-frais', 'Jus frais & mojito', 250, 'Boissons fraiches preparees.', images.drinks, {
        choix: requiredChoice('Choix', [
          ['Mojito', 250],
          ['Jus orange', 250],
          ['Jus banane', 300],
          ['Jus fraise', 300],
          ['Jus cocktail', 300],
        ], 250),
      }),
    ],
  },
};

const marciminiPayload = {
  id: 'marcimini-food',
  name: 'Marcimini Food',
  category: 'Pizza • Tacos • Burger • Chawarma',
  description: 'Fast-food genereux a Collo: pizzas tomate et boisees, tacos, burgers, chawarma, poutines, desserts et boissons.',
  address: 'Collo, Skikda',
  lat: null,
  lng: null,
  rating: 4.8,
  deliveryTime: '25-40 min',
  deliveryFee: 100,
  minOrder: 300,
  open: true,
  tags: ['Pizza', 'Tacos', 'Burger', 'Chawarma', 'Poutine', 'Dessert'],
  image: images.cover,
  coverImage: images.cover,
  menu,
};

async function main() {
  const restaurants = await db.getRestaurants();
  const existing = restaurants.find((restaurant) => {
    const haystack = `${restaurant.id || ''} ${restaurant.name || ''}`.toLowerCase();
    return haystack.includes('marcimini') || haystack.includes('marvimini') || haystack.includes('marcimi');
  });

  if (existing) {
    await db.updateRestaurant(existing.id, { ...marciminiPayload, id: existing.id });
    console.log(`Marcimini Food mis a jour: ${existing.id}`);
    return;
  }

  await db.createRestaurant(marciminiPayload);
  console.log('Marcimini Food cree: marcimini-food');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
