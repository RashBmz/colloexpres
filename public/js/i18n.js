(function () {
  if (location.pathname.startsWith('/admin')) return;
  if (window.COLLO_LANG !== 'ar') return;

  const TEXT = {
    // Accueil
    'Kolo Go': 'Kolo Go',
    'KOLO': 'كولو',
    'GO': 'غو',
    'COLLO': 'كولو',
    'EXPRESS': 'غو',
    'Livraison rapide à Collo et ses environs.': 'توصيل سريع في القل وضواحيها.',
    'Paiement cash à la livraison. Simple & fiable.': 'الدفع نقدا عند الاستلام. بسيط وموثوق.',
    "Télécharger l'application": 'تحميل التطبيق',
    'Connexion / Inscription client': 'دخول / تسجيل الزبون',
    'Espace Livreur': 'فضاء عامل التوصيل',
    'Un seul accès pour commander, suivre vos livraisons et gérer votre compte client.': 'من مكان واحد يمكنك الطلب وتتبع التوصيل وتسيير حسابك.',
    'Livreurs': 'عمال التوصيل',
    'Délai moyen': 'المدة المتوسطة',
    'Paiement': 'الدفع',
    'Pourquoi nous choisir': 'لماذا تختارنا',
    'Livraison simple &': 'توصيل بسيط و',
    '100% locale': 'محلي 100%',
    'Livraison simple & 100% locale': 'توصيل بسيط ومحلي 100%',
    'Réponse instantanée': 'استجابة فورية',
    'Le premier livreur disponible prend votre commande en temps réel.': 'أول عامل توصيل متاح يستلم طلبك مباشرة.',
    'Paiement à la livraison': 'الدفع عند الاستلام',
    'Aucun paiement en ligne. Vous réglez directement à la réception.': 'لا يوجد دفع إلكتروني. تدفع مباشرة عند الاستلام.',
    'Suivi en direct': 'متابعة مباشرة',
    'Suivez votre colis étape par étape depuis votre téléphone.': 'تابع طلبك خطوة بخطوة من هاتفك.',
    'Équipe locale': 'فريق محلي',
    'Des livreurs de Collo qui connaissent chaque rue de la ville.': 'عمال توصيل من القل يعرفون شوارع المدينة جيدا.',
    'Administration': 'الإدارة',

    // Auth
    'Connexion': 'تسجيل الدخول',
    'Connexion Client': 'دخول الزبون',
    'Nouveau compte': 'حساب جديد',
    'Créez votre compte client gratuitement': 'أنشئ حسابك كزبون مجانا',
    'Creez votre compte client gratuitement': 'أنشئ حسابك كزبون مجانا',
    'Connectez-vous avec votre identifiant livreur': 'سجل الدخول بمعرف عامل التوصيل',
    'Acces reserve aux administrateurs': 'الدخول مخصص للمسيرين فقط',
    'Accès réservé aux administrateurs': 'الدخول مخصص للمسيرين فقط',
    'Bienvenue sur Kolo Go': 'مرحبا بك في Kolo Go',
    'Retour': 'رجوع',
    '<- Retour': 'رجوع',
    'Identifiant': 'المعرف',
    'Identifiant admin': 'معرف الإدارة',
    'Identifiant (ex: livreur01)': 'المعرف (مثال: livreur01)',
    'Numero de telephone': 'رقم الهاتف',
    'Numéro de téléphone': 'رقم الهاتف',
    'Téléphone': 'الهاتف',
    'Telephone': 'الهاتف',
    'Mot de passe': 'كلمة المرور',
    'Confirmer le mot de passe': 'تأكيد كلمة المرور',
    'Se connecter': 'تسجيل الدخول',
    'Se connecter ->': 'تسجيل الدخول',
    'Créer un compte': 'إنشاء حساب',
    'Creer un compte': 'إنشاء حساب',
    'Creer mon compte ->': 'إنشاء حسابي',
    'Créer mon compte ->': 'إنشاء حسابي',
    'Creer un compte gratuit': 'إنشاء حساب مجاني',
    'Créer un compte gratuit': 'إنشاء حساب مجاني',
    'Pas encore de compte ?': 'ليس لديك حساب بعد؟',
    'Deja un compte ?': 'لديك حساب؟',
    'Déjà un compte ?': 'لديك حساب؟',
    'Nom complet': 'الاسم الكامل',
    'Comptes demo :': 'حسابات تجريبية:',
    'Comptes démo :': 'حسابات تجريبية:',
    'Demo :': 'تجربة:',
    'Demo client :': 'تجربة الزبون:',
    'mot de passe :': 'كلمة المرور:',

    // Navigation
    'Accueil': 'الرئيسية',
    'Restaurants': 'المطاعم',
    'Restaurant': 'مطعم',
    'Commandes': 'الطلبات',
    'Commander': 'اطلب',
    'Stats': 'الإحصائيات',
    'Cmdes': 'الطلبات',
    'Restos': 'المطاعم',
    'Clients': 'الزبائن',
    'Livreurs': 'عمال التوصيل',
    'Compta': 'المحاسبة',
    'Déco': 'خروج',
    'Deco': 'خروج',
    'Gérer': 'تسيير',
    'Tout voir': 'عرض الكل',
    'Voir': 'عرض',

    // Client
    'Tableau de bord': 'لوحة التحكم',
    'Livraison rapide': 'توصيل سريع',
    'Commander maintenant': 'اطلب الآن',
    'Mes commandes': 'طلباتي',
    'Nouvelle commande': 'طلب جديد',
    'Colis & courses': 'طرود ومشتريات',
    'Envoyer la demande': 'إرسال الطلب',
    'Point de ramassage': 'نقطة الاستلام',
    'Adresse de livraison': 'عنوان التوصيل',
    'Description': 'الوصف',
    'Taille': 'الحجم',
    'Petit': 'صغير',
    'Moyen': 'متوسط',
    'Grand': 'كبير',
    'Votre panier est vide': 'السلة فارغة',
    'Ajouter au panier': 'أضف إلى السلة',
    'Continuer les achats': 'مواصلة الشراء',
    'Mon panier': 'سلتي',
    'Sous-total': 'المجموع الفرعي',
    'Frais de livraison': 'رسوم التوصيل',
    'Total': 'المجموع',
    'Paiement cash à la livraison': 'الدفع نقدا عند الاستلام',
    'Itinéraire': 'المسار',
    'Facture': 'الفاتورة',
    'Détails': 'التفاصيل',
    'Details': 'التفاصيل',
    'Votre livreur': 'عامل التوصيل الخاص بك',
    'Annulation': 'الإلغاء',
    'Annuler la commande': 'إلغاء الطلب',
    'Utiliser ma position actuelle': 'استعمال موقعي الحالي',
    'Trouver ma position': 'تحديد موقعي',
    'Notes pour le livreur': 'ملاحظات لعامل التوصيل',
    'Commander -': 'اطلب -',

    // Livreur
    'Disponibles': 'المتاحة',
    'Commandes disponibles': 'الطلبات المتاحة',
    'Livraisons': 'التوصيلات',
    'Historique': 'السجل',
    'Notifications': 'الإشعارات',
    'Aucune commande en attente': 'لا توجد طلبات في الانتظار',
    'Retour au tableau de bord': 'العودة إلى لوحة التحكم',
    'En attente': 'في الانتظار',
    'Accepter cette livraison': 'قبول هذا التوصيل',
    'Trajet': 'المسار',
    'Depart': 'الانطلاق',
    'Départ': 'الانطلاق',
    'Demande': 'الطلب',
    'Livraison': 'التوصيل',
    'Type': 'النوع',
    'Client': 'الزبون',
    'Heure Algerie': 'توقيت الجزائر',
    'Heure Algérie': 'توقيت الجزائر',
    'Date inconnue': 'تاريخ غير معروف',
    'Courses / achats': 'مشتريات',
    'Colis': 'طرد',
    'Standard': 'عادي',
    'En ligne': 'متصل',
    'Hors ligne': 'غير متصل',
    'Disponible': 'متاح',
    'Indisponible': 'غير متاح',
    'Gain': 'الربح',
    'Gains': 'الأرباح',
    'Livrées': 'تم توصيلها',
    'Livré': 'تم التوصيل',
    'Livré ✓': 'تم التوصيل',
    'En livraison': 'قيد التوصيل',
    'Accepté': 'مقبول',
    'Récupéré': 'تم الاستلام',
    'Annulé': 'ملغى',
    'Annulées': 'ملغاة',
    'Aucune commande': 'لا توجد طلبات',
    'Toutes': 'الكل',
    'Attente': 'انتظار',
    'Annuler': 'إلغاء',

    // Admin dashboard
    'Administration ⚙️': 'الإدارة',
    'Total commandes': 'إجمالي الطلبات',
    "Livrées aujourd'hui": 'الموصلة اليوم',
    'Livreurs actifs': 'عمال التوصيل النشطون',
    "Gains livraison aujourd'hui": 'أرباح التوصيل اليوم',
    'Total encaissé': 'إجمالي المقبوض',
    'Total encaisse': 'إجمالي المقبوض',
    'Gains livraison total': 'إجمالي أرباح التوصيل',
    'Vue détaillée': 'عرض مفصل',
    'Commandes aujourd\'hui': 'طلبات اليوم',
    'Commandes aujourd’hui': 'طلبات اليوم',
    'Cette semaine': 'هذا الأسبوع',
    'Ce mois': 'هذا الشهر',
    'Livraisons actives': 'توصيلات نشطة',
    'Livrées total': 'إجمالي الموصلة',
    'Commandes resto': 'طلبات المطاعم',
    'Commandes colis': 'طلبات الطرود',
    'Clients total': 'إجمالي الزبائن',
    'Livreurs hors ligne': 'عمال غير متصلين',
    'Ticket moyen': 'متوسط الطلب',
    'Gain moyen': 'متوسط الربح',
    'Créer une livraison': 'إنشاء توصيل',
    'Creer une livraison': 'إنشاء توصيل',
    'Envoyer aux livreurs': 'إرسال إلى عمال التوصيل',
    'Commandes récentes': 'آخر الطلبات',
    'Commandes recentes': 'آخر الطلبات',
    'Top livreurs': 'أفضل عمال التوصيل',
    'En attente': 'في الانتظار',
    'Toutes': 'الكل',

    // Admin restaurants
    'Gestion rapide': 'تسيير سريع',
    'Ajoute un restaurant complet sans toucher au code': 'أضف مطعما كاملا دون تعديل الكود',
    "Remplis les infos, charge un modele de carte, modifie les noms/prix/options, puis enregistre. Les clients verront directement le restaurant dans l'app.": 'املأ المعلومات، اختر نموذج قائمة، عدل الأسماء والأسعار والخيارات، ثم احفظ. سيظهر المطعم مباشرة للزبائن في التطبيق.',
    'Nouveau restaurant': 'مطعم جديد',
    'Ajouter le restaurant': 'إضافة المطعم',
    'Modifier le restaurant': 'تعديل المطعم',
    'Supprimer le restaurant': 'حذف المطعم',
    'Restaurant visible': 'المطعم ظاهر',
    'Informations': 'المعلومات',
    'Carte': 'القائمة',
    'Menu': 'القائمة',
    'Menu du restaurant': 'قائمة المطعم',
    'Modele rapide': 'نموذج سريع',
    'Modèle rapide': 'نموذج سريع',
    'Fast-food': 'وجبات سريعة',
    'Pizza': 'بيتزا',
    'Tacos': 'تاكوس',
    'Cafe': 'مقهى',
    'Café': 'مقهى',
    'Categories': 'الفئات',
    'Catégories': 'الفئات',
    'Articles': 'المنتجات',
    'Options': 'الخيارات',
    'Ajouter une categorie': 'إضافة فئة',
    'Ajouter une catégorie': 'إضافة فئة',
    'Nouvelle categorie': 'فئة جديدة',
    'Nouvelle catégorie': 'فئة جديدة',
    'Articles de cette categorie': 'منتجات هذه الفئة',
    'Articles de cette catégorie': 'منتجات هذه الفئة',
    'Ajouter un article': 'إضافة منتج',
    'Nouvel article': 'منتج جديد',
    'Options / supplements': 'خيارات / إضافات',
    'Options / suppléments': 'خيارات / إضافات',
    'Ajouter option': 'إضافة خيار',
    'Ajouter choix': 'إضافة اختيار',
    'Supplement oui/non': 'إضافة نعم/لا',
    'Supplément oui/non': 'إضافة نعم/لا',
    'Requis': 'إجباري',
    'Aucune categorie. Clique sur un modele ou ajoute une categorie.': 'لا توجد فئات. اختر نموذجا أو أضف فئة.',
    'Aucun article ici.': 'لا توجد منتجات هنا.',
    'Pas d option. Exemple: taille, viande, sauce, supplement fromage.': 'لا توجد خيارات. مثال: الحجم، اللحم، الصلصة، إضافة الجبن.',
    'Suppr.': 'حذف',
    'Supprimer': 'حذف',
    'Enregistrer': 'حفظ',
    'Ouvert': 'مفتوح',
    'Ferme': 'مغلق',
    'Fermé': 'مغلق',
    'Adresse': 'العنوان',
    'Note': 'التقييم',
    'Temps livraison': 'وقت التوصيل',
    'Commande minimum': 'الحد الأدنى للطلب',

    // Admin livreurs / clients / commandes
    'Ajouter un livreur': 'إضافة عامل توصيل',
    'Ajouter le livreur': 'إضافة عامل توصيل',
    'Identifiant (ex: livreur07)': 'المعرف (مثال: livreur07)',
    'Voiture': 'سيارة',
    'Vélo': 'دراجة',
    'Moto': 'دراجة نارية',
    'Modifier le profil': 'تعديل الملف',
    'Fiche compta': 'صفحة المحاسبة',
    'Profil livreur': 'ملف عامل التوصيل',
    'Sans livreur': 'بدون عامل توصيل',
    'Assigner': 'تعيين',
    'Supprimer définitivement cette commande ?': 'حذف هذا الطلب نهائيا؟',
    'Annuler cette commande ?': 'إلغاء هذا الطلب؟',
    'Rechercher': 'بحث',
    'Tous les clients': 'كل الزبائن',
    'Aucun client': 'لا يوجد زبائن',

    // Comptabilite
    'Comptabilite livreurs': 'محاسبة عمال التوصيل',
    'Comptabilité livreurs': 'محاسبة عمال التوصيل',
    'Commissions livreurs': 'عمولات عمال التوصيل',
    "Choisis une periode et ton pourcentage. Le calcul se fait sur les frais de livraison du livreur, puis tu marques quand l'argent est encaisse.": 'اختر مدة ونسبة العمولة. الحساب يكون على رسوم التوصيل، ثم علم عندما تستلم المال.',
    'Periode': 'المدة',
    'Période': 'المدة',
    'Commission %': 'نسبة العمولة %',
    'Fin de periode': 'نهاية المدة',
    'Fin de période': 'نهاية المدة',
    'Actualiser': 'تحديث',
    'A demander': 'المطلوب استلامه',
    'A récupérer': 'المطلوب استلامه',
    'A recuperer': 'المطلوب استلامه',
    'Commission totale': 'إجمالي العمولة',
    'Deja encaisse': 'تم استلامه',
    'Déjà encaissé': 'تم استلامه',
    'Livraisons': 'التوصيلات',
    'Frais livraison': 'رسوم التوصيل',
    'Total encaisse client': 'المبلغ المقبوض من الزبائن',
    'Total encaissé client': 'المبلغ المقبوض من الزبائن',
    'Ta commission': 'عمولتك',
    'Reste a recuperer': 'الباقي للاستلام',
    'Reste à récupérer': 'الباقي للاستلام',
    'Dernier encaissement': 'آخر استلام',
    'Encaisse': 'استلام',
    'Encaissé': 'تم الاستلام',
    'Partiel': 'جزئي',
    'Rien': 'لا شيء',
    'Voir la fiche complete': 'عرض الصفحة الكاملة',
    'Voir la fiche complète': 'عرض الصفحة الكاملة',
    'Historique encaissements': 'سجل الاستلامات',
    'Aucun reglement enregistre': 'لا يوجد أي تسوية مسجلة',
    'Aucun règlement enregistré': 'لا يوجد أي تسوية مسجلة',
    'Fiche livreur': 'صفحة عامل التوصيل',
    'Livraisons total': 'إجمالي التوصيلات',
    'Periodes rapides': 'مدد سريعة',
    'Périodes rapides': 'مدد سريعة',
    'derniers jours': 'آخر أيام',
    'Encaissement': 'استلام المال',
    "Quand tu recuperes l'argent de ce livreur, indique le montant puis valide. L'historique gardera la trace.": 'عندما تستلم المال من هذا العامل، أدخل المبلغ ثم أكد. السجل سيحفظ العملية.',
    'Marquer encaisse': 'تأكيد الاستلام',
    'Marquer encaissé': 'تأكيد الاستلام',
    'Rien a recuperer pour le moment.': 'لا يوجد مبلغ للاستلام حاليا.',
    'Dernieres livraisons': 'آخر التوصيلات',
    'Dernières livraisons': 'آخر التوصيلات',
    'Aucune livraison terminee': 'لا توجد توصيلات مكتملة',
    'Aucune livraison terminée': 'لا توجد توصيلات مكتملة',
    'Pourcentage commission': 'نسبة العمولة',
    'Changer %': 'تغيير النسبة',

    // Generic words used everywhere
    'Oui': 'نعم',
    'Non': 'لا',
    'Sauce': 'الصلصة',
    'Viande': 'اللحم',
    'Poulet': 'دجاج',
    'Viande hachee': 'لحم مفروم',
    'Viande hachée': 'لحم مفروم',
    'Fromage': 'جبن',
    'Boisson': 'مشروب',
    'Menus': 'وجبات',
    'Boissons': 'مشروبات',
    'Desserts': 'حلويات',
    'Choix': 'اختيار',
    'Prix': 'السعر',
    'Prix DA': 'السعر دج',
    'Prix supplement': 'سعر الإضافة',
    'Prix supplément': 'سعر الإضافة',
    'Description courte': 'وصف قصير',
    'ID article': 'معرف المنتج',
    'Image URL optionnelle': 'رابط صورة اختياري',
    'Nom option': 'اسم الخيار',
    'Cle option': 'مفتاح الخيار',
    'Clé option': 'مفتاح الخيار',
    'Nom article': 'اسم المنتج',
    'Nom categorie': 'اسم الفئة',
    'Nom catégorie': 'اسم الفئة',
    'Cle': 'المفتاح',
    'Clé': 'المفتاح',
    'Retour Admin': 'رجوع للإدارة',
    'Retour admin': 'رجوع للإدارة',
    'Chargement...': 'جاري التحميل...',
    'Aucun': 'لا يوجد',
    'Aucune': 'لا توجد',
    'Jour': 'اليوم',
    'Semaine': 'الأسبوع',
    'Mois': 'الشهر',
    'Année': 'السنة',
    'Annee': 'السنة',
  };

  const PLACEHOLDERS = {
    'Votre nom et prenom': 'اسمك ولقبك',
    'Votre nom et prénom': 'اسمك ولقبك',
    '05 XX XX XX XX': '05 XX XX XX XX',
    'Minimum 6 caracteres': '6 أحرف على الأقل',
    'Minimum 6 caractères': '6 أحرف على الأقل',
    'Repetez le mot de passe': 'أعد كتابة كلمة المرور',
    'Répétez le mot de passe': 'أعد كتابة كلمة المرور',
    'Nom du client': 'اسم الزبون',
    'Téléphone client': 'هاتف الزبون',
    'Telephone client': 'هاتف الزبون',
    'Adresse ramassage': 'عنوان الاستلام',
    'Adresse livraison': 'عنوان التوصيل',
    'Prix livraison personnalisé (optionnel)': 'سعر توصيل مخصص (اختياري)',
    'Prix livraison personnalise (optionnel)': 'سعر توصيل مخصص (اختياري)',
    'Description ou instructions': 'الوصف أو التعليمات',
    'Rechercher...': 'بحث...',
    'Votre adresse...': 'عنوانك...',
    'Quartier...': 'الحي...',
    'Notes pour le livreur (ex: sonnette 2eme etage...)': 'ملاحظات لعامل التوصيل (مثال: الطابق الثاني...)',
    'Nom du restaurant': 'اسم المطعم',
    'Identifiant URL (optionnel)': 'معرف الرابط (اختياري)',
    'Categorie (Pizza, Tacos...)': 'الفئة (بيتزا، تاكوس...)',
    'Catégorie (Pizza, Tacos...)': 'الفئة (بيتزا، تاكوس...)',
    'Description': 'الوصف',
    'Adresse': 'العنوان',
    'Latitude': 'خط العرض',
    'Longitude': 'خط الطول',
    'Note': 'التقييم',
    'Temps livraison': 'وقت التوصيل',
    'Frais livraison DA': 'رسوم التوصيل دج',
    'Commande minimum DA': 'الحد الأدنى للطلب دج',
    'Tags separes par virgule: Populaire, Pizza': 'وسوم مفصولة بفاصلة: مشهور، بيتزا',
    'Tags séparés par virgule: Populaire, Pizza': 'وسوم مفصولة بفاصلة: مشهور، بيتزا',
    'URL image': 'رابط الصورة',
    'URL image couverture (optionnel)': 'رابط صورة الغلاف (اختياري)',
    'Nom complet': 'الاسم الكامل',
    'Identifiant (ex: livreur07)': 'المعرف (مثال: livreur07)',
    'Nouveau mot de passe (optionnel)': 'كلمة مرور جديدة (اختياري)',
    'Mot de passe': 'كلمة المرور',
    'Montant encaisse': 'المبلغ المستلم',
    'Montant encaissé': 'المبلغ المستلم',
    'Pourcentage commission': 'نسبة العمولة',
    'Nom categorie': 'اسم الفئة',
    'Nom catégorie': 'اسم الفئة',
    'Cle URL': 'مفتاح الرابط',
    'Clé URL': 'مفتاح الرابط',
    'Nom article': 'اسم المنتج',
    'Prix DA': 'السعر دج',
    'ID article': 'معرف المنتج',
    'Image article URL': 'رابط صورة المنتج',
    'Nom option': 'اسم الخيار',
    'Cle option': 'مفتاح الخيار',
    'Clé option': 'مفتاح الخيار',
    'Choix': 'اختيار',
    'Prix +': 'السعر +',
    'Prix +/-': 'السعر +/-',
    'Prix supplement': 'سعر الإضافة',
    'Prix supplément': 'سعر الإضافة',
    'Description courte': 'وصف قصير',
    'Image URL optionnelle': 'رابط صورة اختياري',
  };

  const PREFIXES = [
    ['Total encaisse:', 'إجمالي المقبوض:'],
    ['Total encaissé:', 'إجمالي المقبوض:'],
    ['Gains:', 'الأرباح:'],
    ['Gain:', 'الربح:'],
    ['Encaisse:', 'المقبوض:'],
    ['Encaissé:', 'المقبوض:'],
    ['Note:', 'التقييم:'],
    ['ID:', 'المعرف:'],
    ['Client:', 'الزبون:'],
    ['Type:', 'النوع:'],
    ['Téléphone:', 'الهاتف:'],
    ['Telephone:', 'الهاتف:'],
    ['Dernier encaissement:', 'آخر استلام:'],
    ['Dernier encaissement :', 'آخر استلام:'],
    ['Ta commission', 'عمولتك'],
  ];

  function stripDecor(text) {
    return String(text || '')
      .replace(/[\u{1F000}-\u{1FAFF}\u2600-\u27BF]/gu, '')
      .replace(/[→←↓↩✓⚙️]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function norm(text) {
    return stripDecor(text)
      .replace(/\u00a0/g, ' ')
      .replace(/\s+([:?!])/g, '$1')
      .trim();
  }

  function translatePlain(text) {
    const raw = String(text || '');
    const key = norm(raw);
    if (!key) return raw;
    if (TEXT[key]) return raw.replace(stripDecor(raw), TEXT[key]);

    let translated = raw;
    const sortedKeys = Object.keys(TEXT).sort((a, b) => b.length - a.length);
    sortedKeys.forEach((source) => {
      if (!source || source.length < 3) return;
      const target = TEXT[source];
      translated = translated.split(source).join(target);
      const normalizedSource = norm(source);
      if (normalizedSource !== source) translated = translated.split(normalizedSource).join(target);
    });

    PREFIXES.forEach(([source, target]) => {
      translated = translated.split(source).join(target);
    });

    translated = translated
      .replace(/(\d+)\s*jours/g, '$1 أيام')
      .replace(/(\d+)\s*jour/g, '$1 يوم')
      .replace(/(\d+)\s*livraison\(s\)/g, '$1 توصيل')
      .replace(/(\d+)\s*livraisons/g, '$1 توصيل')
      .replace(/(\d+)\s*livraison/g, '$1 توصيل')
      .replace(/Du\s+(.+?)\s+au\s+/g, 'من $1 إلى ')
      .replace(/\s+-\s+encaisse le\s+/g, ' - تم الاستلام في ')
      .replace(/\s+-\s+encaissé le\s+/g, ' - تم الاستلام في ');

    return translated;
  }

  function translateTextNode(node) {
    const original = node.nodeValue;
    const translated = translatePlain(original);
    if (translated !== original) node.nodeValue = translated;
  }

  function walk(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || ['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE'].includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(translateTextNode);
  }

  function translateAttributes(root) {
    root.querySelectorAll('input, textarea, button, a, img, select, option').forEach((el) => {
      ['placeholder', 'title', 'aria-label', 'alt'].forEach((attr) => {
        const value = el.getAttribute(attr);
        const key = norm(value);
        if (key && (PLACEHOLDERS[key] || TEXT[key])) {
          el.setAttribute(attr, PLACEHOLDERS[key] || TEXT[key]);
        } else if (value) {
          const translated = translatePlain(value);
          if (translated !== value) el.setAttribute(attr, translated);
        }
      });
      if ((el.tagName === 'INPUT' || el.tagName === 'BUTTON') && el.value) {
        const key = norm(el.value);
        if (TEXT[key]) el.value = TEXT[key];
      }
    });
  }

  function translateSelectOptions(root) {
    root.querySelectorAll('option').forEach((option) => {
      const translated = translatePlain(option.textContent);
      if (translated !== option.textContent) option.textContent = translated;
    });
  }

  function apply(root) {
    walk(root);
    translateAttributes(root);
    translateSelectOptions(root);
  }

  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';

  document.addEventListener('DOMContentLoaded', () => {
    apply(document.body);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) apply(node);
          if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
