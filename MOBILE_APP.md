# Application mobile Collo

Cette version mobile utilise Capacitor. L'application Android/iOS ouvre le site Render :

`https://colloexpres.onrender.com`

Les menus, commandes, comptes, restaurants et modifications deployees sur Render restent donc partages entre le site et l'application.

## Commandes utiles

Installer les dependances apres un clone :

```bash
npm install
```

Synchroniser les changements PWA/app vers Android et iOS :

```bash
npm run mobile:sync
```

Ouvrir Android Studio :

```bash
npm run mobile:android
```

Ouvrir Xcode sur Mac :

```bash
npm run mobile:ios
```

## Android APK / Play Store

1. Installe Android Studio.
2. Lance `npm run mobile:android`.
3. Dans Android Studio, attends la synchronisation Gradle.
4. Pour tester sur telephone : `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
5. Pour Play Store : `Build > Generate Signed Bundle / APK`, puis choisis `Android App Bundle (.aab)`.

Le package Android est :

`com.colloexpress.app`

## iPhone / App Store

Apple impose un Mac avec Xcode pour compiler et envoyer l'app.

1. Depuis un Mac, clone le projet.
2. Lance `npm install`.
3. Lance `npm run mobile:sync`.
4. Lance `npm run mobile:ios`.
5. Dans Xcode, connecte ton compte Apple Developer.
6. Archive l'app puis envoie-la vers App Store Connect.

Le Bundle ID iOS est :

`com.colloexpress.app`

## Points importants

- Le GPS necessite l'autorisation localisation du telephone.
- L'app charge le site en HTTPS, donc Render doit etre en ligne.
- Apres chaque changement important cote app native, lance `npm run mobile:sync`.
- Les changements du site deployes sur Render apparaissent dans l'app sans reconstruire l'APK, sauf changement natif comme icones, permissions ou nom de l'app.
