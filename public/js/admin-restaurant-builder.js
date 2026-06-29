(function () {
  if (window.__adminRestaurantBuilderReady) return;
  window.__adminRestaurantBuilderReady = true;

  var CATEGORY_TEMPLATES = {
    tacos: { label: 'Tacos', examples: ['Tacos Poulet', 'Tacos Viande', 'Tacos Mixte'], item: 'Tacos Poulet', options: ['sauce', 'gratinage', 'supplement'] },
    burger: { label: 'Burger', examples: ['Burger Classic', 'Chicken Burger', 'Double Burger'], item: 'Burger Classic', options: ['sauce', 'supplement'] },
    sandwich: { label: 'Sandwich', examples: ['Sandwich Poulet', 'Sandwich Escalope', 'Sandwich Mixte'], item: 'Sandwich Poulet', options: ['sauce', 'supplement'] },
    pizza: { label: 'Pizza', examples: ['Pizza Margherita', 'Pizza Thon', 'Pizza 4 Fromages'], item: 'Pizza Margherita', options: ['taille', 'supplement'] },
    boissons: { label: 'Boissons', examples: ['Coca 33cl', 'Fanta 33cl', 'Eau'], item: 'Boisson 33cl', options: ['boisson'] }
  };

  var PRESETS = {
    fastfood: {
      tacos: category('Tacos', [
        product('Tacos Poulet', 450, 'Poulet, frites, sauce au choix', ['sauce', 'gratinage', 'supplement']),
        product('Tacos Viande', 500, 'Viande hachee, frites, sauce au choix', ['sauce', 'gratinage', 'supplement']),
        product('Tacos Mixte', 600, 'Deux viandes, frites, sauce au choix', ['sauce', 'gratinage', 'supplement'])
      ]),
      burger: category('Burger', [
        product('Burger Classic', 400, 'Steak, fromage, salade, sauce', ['sauce', 'supplement']),
        product('Chicken Burger', 450, 'Poulet pane, fromage, sauce', ['sauce', 'supplement'])
      ]),
      sandwich: category('Sandwich', [
        product('Sandwich Poulet', 350, 'Poulet, frites, sauce', ['sauce', 'supplement']),
        product('Sandwich Escalope', 420, 'Escalope, frites, sauce', ['sauce', 'supplement'])
      ]),
      pizza: category('Pizza', [
        product('Pizza Margherita', 550, 'Tomate, fromage', ['taille', 'supplement']),
        product('Pizza Thon', 700, 'Tomate, fromage, thon', ['taille', 'supplement'])
      ]),
      boissons: category('Boissons', [
        product('Boisson 33cl', 120, 'Boisson au choix', ['boisson']),
        product('Eau', 80, 'Bouteille eau', [])
      ])
    },
    tacos: { tacos: category('Tacos', [
      product('Tacos Poulet', 450, 'Poulet, frites, sauce au choix', ['sauce', 'gratinage', 'supplement']),
      product('Tacos Viande', 500, 'Viande hachee, frites, sauce au choix', ['sauce', 'gratinage', 'supplement']),
      product('Tacos Mixte', 600, 'Poulet et viande, frites, sauce au choix', ['sauce', 'gratinage', 'supplement']),
      product('Tacos Crispy', 550, 'Poulet crispy, frites, sauce au choix', ['sauce', 'gratinage', 'supplement'])
    ]) },
    burger: { burger: category('Burger', [
      product('Burger Classic', 400, 'Steak, fromage, salade, sauce', ['sauce', 'supplement']),
      product('Chicken Burger', 450, 'Poulet pane, fromage, sauce', ['sauce', 'supplement']),
      product('Double Burger', 600, 'Double steak, fromage, sauce', ['sauce', 'supplement'])
    ]) },
    sandwich: { sandwich: category('Sandwich', [
      product('Sandwich Poulet', 350, 'Poulet, frites, sauce', ['sauce', 'supplement']),
      product('Sandwich Viande', 400, 'Viande, frites, sauce', ['sauce', 'supplement']),
      product('Sandwich Mixte', 500, 'Deux viandes, frites, sauce', ['sauce', 'supplement'])
    ]) },
    pizza: { pizza: category('Pizza', [
      product('Pizza Margherita', 550, 'Tomate, fromage', ['taille', 'supplement']),
      product('Pizza Reine', 700, 'Tomate, fromage, champignons', ['taille', 'supplement']),
      product('Pizza Thon', 700, 'Tomate, fromage, thon', ['taille', 'supplement']),
      product('Pizza 4 Fromages', 800, 'Fromages melanges', ['taille', 'supplement'])
    ]) }
  };

  function optionTemplate(type) {
    if (type === 'sauce') return choiceOption('sauce', 'Sauce', false, [['algerienne', 'Algerienne', 0], ['blanche', 'Blanche', 0], ['harissa', 'Harissa', 0], ['bbq', 'BBQ', 0], ['mayonnaise', 'Mayonnaise', 0]]);
    if (type === 'gratinage') return checkOption('gratinage', 'Gratinage fromage', 80);
    if (type === 'taille') return choiceOption('taille', 'Taille', true, [['moyenne', 'Moyenne', 0], ['grande', 'Grande', 150], ['xl', 'XL', 300]]);
    if (type === 'supplement') return choiceOption('supplement', 'Supplement', false, [['fromage', 'Fromage', 80], ['oeuf', 'Oeuf', 80], ['frites', 'Frites', 100], ['viande-extra', 'Viande extra', 180]]);
    if (type === 'boisson') return choiceOption('boisson', 'Boisson', true, [['coca', 'Coca', 0], ['fanta', 'Fanta', 0], ['hamoud', 'Hamoud', 0], ['eau', 'Eau', 0]]);
    return choiceOption('option', 'Option libre', false, [['standard', 'Standard', 0]]);
  }

  function category(label, items) { return { label: label, items: items }; }
  function product(name, price, description, optionKeys) {
    var options = {};
    for (var i = 0; i < optionKeys.length; i += 1) {
      var opt = optionTemplate(optionKeys[i]);
      options[opt.key] = opt.value;
    }
    return { id: slugify(name), name: name, basePrice: price, description: description, image: '', options: options };
  }
  function choiceOption(key, label, required, rows) {
    var choices = [];
    for (var i = 0; i < rows.length; i += 1) choices.push({ id: rows[i][0], label: rows[i][1], price: rows[i][2] });
    return { key: key, value: { label: label, required: required, choices: choices } };
  }
  function checkOption(key, label, price) {
    return { key: key, value: { label: label, required: false, type: 'checkbox', price: price } };
  }
  function slugify(value) {
    return String(value || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'item';
  }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char];
    });
  }
  function closest(el, selector) {
    while (el && el.nodeType === 1) {
      if ((el.matches || el.msMatchesSelector).call(el, selector)) return el;
      el = el.parentElement;
    }
    return null;
  }
  function entries(obj) {
    var out = [];
    for (var key in (obj || {})) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) out.push([key, obj[key]]);
    }
    return out;
  }
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  }
  function menuToState(menu) {
    var result = [];
    var rows = entries(menu);
    for (var i = 0; i < rows.length; i += 1) {
      var key = rows[i][0];
      var cat = rows[i][1] || {};
      var items = [];
      if (Array.isArray(cat.items)) {
        for (var j = 0; j < cat.items.length; j += 1) items.push(itemToState(cat.items[j]));
      }
      result.push({ key: slugify(key), label: String(cat.label || key || 'Categorie'), items: items });
    }
    return result;
  }
  function itemToState(raw) {
    raw = raw || {};
    var opts = [];
    var optEntries = entries(raw.options || {});
    for (var i = 0; i < optEntries.length; i += 1) {
      var key = optEntries[i][0];
      var opt = optEntries[i][1] || {};
      var choices = [];
      if (Array.isArray(opt.choices)) {
        for (var j = 0; j < opt.choices.length; j += 1) {
          choices.push({ id: String(opt.choices[j].id || slugify(opt.choices[j].label)), label: String(opt.choices[j].label || ''), price: Number(opt.choices[j].price || 0) });
        }
      }
      opts.push({ key: slugify(key), label: String(opt.label || key), type: opt.type === 'checkbox' ? 'checkbox' : 'choices', required: Boolean(opt.required), price: Number(opt.price || 0), choices: choices });
    }
    return { id: String(raw.id || slugify(raw.name || 'article')), name: String(raw.name || ''), basePrice: Number(raw.basePrice || 0), description: String(raw.description || ''), image: String(raw.image || ''), options: opts };
  }
  function stateToMenu(state) {
    var menu = {};
    for (var i = 0; i < state.categories.length; i += 1) {
      var cat = state.categories[i];
      var catKey = slugify(cat.key || cat.label || 'categorie-' + (i + 1));
      var items = [];
      for (var j = 0; j < cat.items.length; j += 1) {
        var row = cat.items[j];
        var options = {};
        for (var k = 0; k < row.options.length; k += 1) {
          var opt = row.options[k];
          var optKey = slugify(opt.key || opt.label || 'option-' + (k + 1));
          if (opt.type === 'checkbox') {
            options[optKey] = { label: opt.label || optKey, required: Boolean(opt.required), type: 'checkbox', price: Number(opt.price || 0) };
          } else {
            var choices = [];
            for (var c = 0; c < opt.choices.length; c += 1) choices.push({ id: slugify(opt.choices[c].id || opt.choices[c].label || 'choix-' + (c + 1)), label: opt.choices[c].label || 'Choix', price: Number(opt.choices[c].price || 0) });
            options[optKey] = { label: opt.label || optKey, required: Boolean(opt.required), choices: choices };
          }
        }
        items.push({ id: slugify(row.id || row.name || 'article-' + (j + 1)), name: row.name || 'Article', basePrice: Number(row.basePrice || 0), description: row.description || '', image: row.image || '', options: options });
      }
      menu[catKey] = { label: cat.label || catKey, items: items };
    }
    return menu;
  }
  function sync(builder) {
    var state = builder._restaurantBuilder;
    if (state && state.textarea) state.textarea.value = JSON.stringify(stateToMenu(state), null, 2);
  }
  function render(builder) {
    var state = builder._restaurantBuilder;
    var catCount = state.categories.length;
    var itemCount = 0;
    var optionCount = 0;
    for (var i = 0; i < state.categories.length; i += 1) {
      itemCount += state.categories[i].items.length;
      for (var j = 0; j < state.categories[i].items.length; j += 1) optionCount += state.categories[i].items[j].options.length;
    }
    var html = '<div class="menu-workspace">' +
      '<div class="menu-summary">' + summary(catCount, 'Categories') + summary(itemCount, 'Articles') + summary(optionCount, 'Options') + '</div>' +
      '<div class="quick-cat-row">' + quickCat('tacos') + quickCat('burger') + quickCat('sandwich') + quickCat('pizza') + quickCat('boissons') + '</div>';
    if (!catCount) html += '<div class="builder-empty">Aucune categorie. Clique sur Tacos, Burger ou Pizza.</div>';
    for (var c = 0; c < state.categories.length; c += 1) html += renderCategory(state.categories[c], c);
    html += '</div>';
    builder.innerHTML = html;
    sync(builder);
  }
  function summary(num, label) {
    return '<div class="summary-pill"><div class="summary-num">' + num + '</div><div class="summary-label">' + label + '</div></div>';
  }
  function quickCat(type) {
    return '<button class="small-action" type="button" data-action="add-template-cat" data-template="' + type + '">+ ' + esc(CATEGORY_TEMPLATES[type].label) + '</button>';
  }
  function renderCategory(cat, catIndex) {
    var html = '<section class="cat-card" data-cat="' + catIndex + '">' +
      '<div class="cat-title-line"><div><div class="cat-title">' + esc(cat.label) + '</div><div class="field-help">Chaque ligne est un type separe.</div></div></div>' +
      '<div class="cat-head"><div class="cat-fields">' +
      input('Nom categorie', cat.label, 'label', catIndex) + input('Cle', cat.key, 'key', catIndex) +
      '</div><button class="small-action danger" type="button" data-action="remove-cat" data-cat="' + catIndex + '">Supprimer</button></div>' +
      '<div class="builder-label">Types / articles</div>';
    for (var i = 0; i < cat.items.length; i += 1) html += renderItem(cat.items[i], catIndex, i);
    html += '<button class="small-action accent" type="button" data-action="add-item" data-cat="' + catIndex + '">+ Ajouter un type</button></section>';
    return html;
  }
  function renderItem(row, catIndex, itemIndex) {
    var html = '<div class="item-card">' +
      '<div class="item-title-row"><div class="item-title">Type #' + (itemIndex + 1) + '</div><button class="small-action danger" type="button" data-action="remove-item" data-cat="' + catIndex + '" data-item="' + itemIndex + '">Suppr.</button></div>' +
      '<div class="item-main">' + input('Nom du type: Tacos Poulet', row.name, 'name', catIndex, itemIndex) + input('Prix DA', row.basePrice, 'basePrice', catIndex, itemIndex, null, null, 'number') + '</div>' +
      '<div class="item-extra">' + input('Description courte', row.description, 'description', catIndex, itemIndex) + input('ID automatique', row.id, 'id', catIndex, itemIndex) + '</div>' +
      input('Image URL optionnelle', row.image, 'image', catIndex, itemIndex, null, null, 'url') +
      '<div class="builder-label">Options quand le client choisit cet article</div>' +
      '<div class="quick-option-row">' + quickOption('sauce', 'Sauces', catIndex, itemIndex) + quickOption('gratinage', 'Gratinage', catIndex, itemIndex) + quickOption('taille', 'Tailles', catIndex, itemIndex) + quickOption('supplement', 'Supplements', catIndex, itemIndex) + quickOption('libre', 'Option libre', catIndex, itemIndex) + '</div>';
    for (var i = 0; i < row.options.length; i += 1) html += renderOption(row.options[i], catIndex, itemIndex, i);
    html += '</div>';
    return html;
  }
  function quickOption(template, label, catIndex, itemIndex) {
    return '<button class="small-action" type="button" data-action="add-option-template" data-template="' + template + '" data-cat="' + catIndex + '" data-item="' + itemIndex + '">+ ' + label + '</button>';
  }
  function renderOption(opt, catIndex, itemIndex, optIndex) {
    var html = '<div class="option-card">' +
      '<div class="option-main">' + input('Nom option', opt.label, 'label', catIndex, itemIndex, optIndex) +
      '<label class="checkline"><input type="checkbox" data-field="required" data-cat="' + catIndex + '" data-item="' + itemIndex + '" data-option="' + optIndex + '"' + (opt.required ? ' checked' : '') + '> Requis</label>' +
      '<button class="small-action danger" type="button" data-action="remove-option" data-cat="' + catIndex + '" data-item="' + itemIndex + '" data-option="' + optIndex + '">Suppr.</button></div>' +
      '<div class="item-extra">' + input('Cle option', opt.key, 'key', catIndex, itemIndex, optIndex) +
      '<select class="field-input" data-field="type" data-cat="' + catIndex + '" data-item="' + itemIndex + '" data-option="' + optIndex + '"><option value="choices"' + (opt.type !== 'checkbox' ? ' selected' : '') + '>Liste de choix</option><option value="checkbox"' + (opt.type === 'checkbox' ? ' selected' : '') + '>Oui / non</option></select></div>';
    if (opt.type === 'checkbox') {
      html += input('Prix supplement', opt.price, 'price', catIndex, itemIndex, optIndex, null, 'number');
    } else {
      for (var i = 0; i < opt.choices.length; i += 1) {
        html += '<div class="choice-row">' + input('Choix', opt.choices[i].label, 'label', catIndex, itemIndex, optIndex, i) + input('Prix +', opt.choices[i].price, 'price', catIndex, itemIndex, optIndex, i, 'number') + '<button class="small-action danger" type="button" data-action="remove-choice" data-cat="' + catIndex + '" data-item="' + itemIndex + '" data-option="' + optIndex + '" data-choice="' + i + '">Suppr.</button></div>';
      }
      html += '<button class="small-action" type="button" data-action="add-choice" data-cat="' + catIndex + '" data-item="' + itemIndex + '" data-option="' + optIndex + '">+ Ajouter choix</button>';
    }
    return html + '</div>';
  }
  function input(placeholder, value, field, cat, item, option, choice, type) {
    var attrs = 'data-field="' + esc(field) + '" data-cat="' + esc(cat) + '"';
    if (item != null) attrs += ' data-item="' + esc(item) + '"';
    if (option != null) attrs += ' data-option="' + esc(option) + '"';
    if (choice != null) attrs += ' data-choice="' + esc(choice) + '"';
    return '<input class="field-input" type="' + esc(type || 'text') + '" placeholder="' + esc(placeholder) + '" value="' + esc(value) + '" ' + attrs + '>';
  }
  function num(value) { return value == null || value === '' ? null : Number(value); }
  function getTarget(state, el) {
    var cat = num(el.getAttribute('data-cat'));
    var item = num(el.getAttribute('data-item'));
    var option = num(el.getAttribute('data-option'));
    var choice = num(el.getAttribute('data-choice'));
    var obj = state.categories[cat];
    if (item != null) obj = obj && obj.items[item];
    if (option != null) obj = obj && obj.options[option];
    if (choice != null) obj = obj && obj.choices[choice];
    return obj;
  }
  function onInput(builder, el) {
    var state = builder._restaurantBuilder;
    var field = el.getAttribute('data-field');
    if (!state || !field) return;
    var obj = getTarget(state, el);
    if (!obj) return;
    obj[field] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value || 0) : el.value;
    if (field === 'type') {
      if (obj.type === 'checkbox') obj.choices = [];
      if (obj.type === 'choices' && !obj.choices.length) obj.choices = [{ id: 'standard', label: 'Standard', price: 0 }];
      render(builder);
      return;
    }
    sync(builder);
  }
  function addTemplateCategory(builder, type) {
    var tpl = CATEGORY_TEMPLATES[type] || CATEGORY_TEMPLATES.tacos;
    var cat = { key: uniqueKey(slugify(tpl.label), builder._restaurantBuilder.categories), label: tpl.label, items: [] };
    for (var i = 0; i < tpl.examples.length; i += 1) {
      var row = { id: slugify(tpl.examples[i]), name: tpl.examples[i], basePrice: 0, description: '', image: '', options: [] };
      for (var j = 0; j < tpl.options.length; j += 1) row.options.push(optionToState(optionTemplate(tpl.options[j])));
      cat.items.push(row);
    }
    builder._restaurantBuilder.categories.push(cat);
  }
  function optionToState(opt) {
    var raw = {};
    raw[opt.key] = opt.value;
    return itemToState({ options: raw }).options[0];
  }
  function uniqueKey(base, categories) {
    var clean = slugify(base);
    var key = clean;
    var index = 2;
    var exists = true;
    while (exists) {
      exists = false;
      for (var i = 0; i < categories.length; i += 1) if (categories[i].key === key) exists = true;
      if (exists) {
        key = clean + '-' + index;
        index += 1;
      }
    }
    return key;
  }
  function defaultItem(cat) {
    var tpl = CATEGORY_TEMPLATES[slugify(cat.label)] || { item: 'Nouvel article', options: [] };
    var row = { id: slugify(tpl.item + '-' + (cat.items.length + 1)), name: tpl.item, basePrice: 0, description: '', image: '', options: [] };
    for (var i = 0; i < tpl.options.length; i += 1) row.options.push(optionToState(optionTemplate(tpl.options[i])));
    return row;
  }
  function onAction(builder, button) {
    var state = builder._restaurantBuilder;
    var action = button.getAttribute('data-action');
    var cat = num(button.getAttribute('data-cat'));
    var item = num(button.getAttribute('data-item'));
    var option = num(button.getAttribute('data-option'));
    var choice = num(button.getAttribute('data-choice'));
    if (button.getAttribute('data-preset')) state.categories = menuToState(clone(PRESETS[button.getAttribute('data-preset')]));
    if (action === 'add-template-cat') addTemplateCategory(builder, button.getAttribute('data-template'));
    if (action === 'remove-cat') state.categories.splice(cat, 1);
    if (action === 'add-item') state.categories[cat].items.push(defaultItem(state.categories[cat]));
    if (action === 'remove-item') state.categories[cat].items.splice(item, 1);
    if (action === 'add-option-template') state.categories[cat].items[item].options.push(optionToState(optionTemplate(button.getAttribute('data-template'))));
    if (action === 'remove-option') state.categories[cat].items[item].options.splice(option, 1);
    if (action === 'add-choice') state.categories[cat].items[item].options[option].choices.push({ id: 'choix-' + (state.categories[cat].items[item].options[option].choices.length + 1), label: 'Nouveau choix', price: 0 });
    if (action === 'remove-choice') state.categories[cat].items[item].options[option].choices.splice(choice, 1);
    render(builder);
  }
  function builderFromControl(control) {
    var step = closest(control, '.resto-step');
    if (!step) return null;
    var builder = step.querySelector('[data-menu-builder]');
    return builder && builder._restaurantBuilder ? builder : null;
  }
  window.applyRestaurantPreset = function (button, event) {
    var builder = builderFromControl(button);
    if (!builder) return false;
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    onAction(builder, button);
    return false;
  };
  window.applyRestaurantBuilderAction = function (button, event) {
    var builder = builderFromControl(button);
    if (!builder) return false;
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    onAction(builder, button);
    return false;
  };
  function init() {
    var forms = document.querySelectorAll('.restaurant-form');
    for (var i = 0; i < forms.length; i += 1) {
      var builder = forms[i].querySelector('[data-menu-builder]');
      var textarea = forms[i].querySelector('.menu-json-input');
      if (!builder || !textarea || builder._restaurantBuilder) continue;
      var parsed = {};
      try { parsed = JSON.parse(textarea.value || '{}'); } catch (error) { parsed = {}; }
      var categories = menuToState(parsed);
      if (!categories.length) categories = menuToState(clone(PRESETS[builder.getAttribute('data-default-preset') || 'fastfood']));
      builder._restaurantBuilder = { textarea: textarea, categories: categories };
      render(builder);
      builder.addEventListener('click', function (event) {
        var button = closest(event.target, 'button');
        if (!button || (!button.getAttribute('data-action') && !button.getAttribute('data-preset'))) return;
        event.preventDefault();
        onAction(this, button);
      });
      builder.addEventListener('input', function (event) { onInput(this, event.target); });
      builder.addEventListener('change', function (event) { onInput(this, event.target); });
      forms[i].addEventListener('submit', function () {
        var currentBuilder = this.querySelector('[data-menu-builder]');
        if (currentBuilder) sync(currentBuilder);
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
