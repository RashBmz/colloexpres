# 🛵 ColloExpress — Plateforme de Livraison

Plateforme de livraison mobile-first pour **Collo, Skikda, Algérie**.  
Paiement **cash à la livraison**, notifications en temps réel via **Socket.IO**.

---

## 🚀 Installation

```bash
# 1. Aller dans le dossier
cd colloexpress

# 2. Installer les dépendances
npm install

# 3. Démarrer le serveur
npm start
# ou en développement avec auto-reload:
npm install -g nodemon
npm run dev
```

Le site sera accessible sur **http://localhost:3000**

---

## 🔑 Comptes de démonstration

| Rôle | Identifiant | Mot de passe |
|------|-------------|--------------|
| Admin | `admin` | `admin123` |
| Livreur 1 | `livreur01` | `1234` |
| Livreur 2 | `livreur02` | `1234` |
| Livreur 3-6 | `livreur03` ... `livreur06` | `1234` |
| Client démo | `0555000001` | `1234` |

---

## 📱 Fonctionnalités

### Client
- Créer un compte avec numéro de téléphone
- Commander une livraison (adresse ramassage → livraison)
- Choisir la taille du colis (Petit 150 DA / Moyen 250 DA / Grand 400 DA)
- Suivi en temps réel de la commande via Socket.IO
- Historique des commandes

### Livreur
- Connexion avec identifiant et mot de passe
- Toggle disponibilité ON/OFF
- **Notification popup en temps réel** dès qu'une nouvelle commande arrive
- **Système "premier arrivé premier servi"** — atomique (transaction SQLite)
- Timer de 30 secondes sur la notification
- Mise à jour du statut étape par étape (Accepté → Récupéré → En livraison → Livré)
- Tableau des gains du jour
- Historique des livraisons

### Admin
- Tableau de bord avec statistiques (commandes, revenus, livreurs actifs)
- Créer des commandes manuellement
- Voir toutes les commandes avec filtres
- Gérer les livreurs (ajouter, supprimer)
- Voir la liste des clients
- Notifications temps réel de l'activité

---

## 🏗️ Architecture

```
colloexpress/
├── server.js              # Point d'entrée + Socket.IO
├── models/
│   └── database.js        # SQLite (better-sqlite3) + seed data
├── middleware/
│   └── auth.js            # Middleware auth + rôles
├── routes/
│   ├── index.js           # Page d'accueil
│   ├── auth.js            # Login/Register/Logout
│   ├── client.js          # Routes client
│   ├── livreur.js         # Routes livreur
│   └── admin.js           # Routes admin
├── views/
│   ├── partials/          # head.ejs, flash.ejs, bottom-nav.ejs
│   ├── landing.ejs        # Page d'accueil
│   ├── auth/              # login.ejs, register.ejs
│   ├── client/            # dashboard, new-order, orders, order-detail
│   ├── livreur/           # dashboard, order-detail, available-orders, historique, notifications
│   └── admin/             # dashboard, orders, livreurs, clients
└── public/
    ├── css/main.css       # Design system complet
    └── js/landing.js      # Animations landing

Base de données: colloexpress.db (SQLite, créé automatiquement)
```

---

## 🔧 Stack technique

- **Node.js** + **Express.js** — Serveur HTTP
- **Socket.IO** — Notifications temps réel
- **SQLite** (better-sqlite3) — Base de données locale
- **EJS** — Templates HTML
- **bcryptjs** — Hash des mots de passe
- **express-session** — Sessions utilisateur

---

## 📲 Pour aller plus loin (idées)

- [ ] Notifications push mobiles (OneSignal / FCM)
- [ ] Intégration Google Maps pour l'itinéraire
- [ ] SMS de confirmation (API Infobip/Twilio)
- [ ] Export Excel des livraisons du jour
- [ ] Application mobile React Native

---

*Développé pour ColloExpress, Collo 🇩🇿*
