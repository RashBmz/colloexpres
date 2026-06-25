(function () {
  if (window.COLLO_LANG !== 'ar') return;

  const TEXT = {
    'Collo Skikda': 'القل سكيكدة',
    'COLLO': 'القل',
    'EXPRESS': 'إكسبريس',
    'Livraison rapide à': 'توصيل سريع في',
    'Paiement cash à la livraison. Simple & fiable.': 'الدفع نقدا عند الاستلام. بسيط وموثوق.',
    'Connexion / Inscription client': 'دخول / تسجيل الزبون',
    'Espace Livreur': 'فضاء عامل التوصيل',
    'Un seul accès pour commander, suivre vos livraisons et gérer votre compte client.': 'من مكان واحد اطلب، تابع التوصيل، وسير حسابك.',
    'Livreurs': 'عمال التوصيل',
    'Délai moyen': 'المدة المتوسطة',
    'Paiement': 'الدفع',
    'Pourquoi nous choisir': 'لماذا تختارنا',
    'Livraison simple &': 'توصيل بسيط و',
    '100% locale': 'محلي 100%',
    'Réponse instantanée': 'استجابة فورية',
    'Paiement à la livraison': 'الدفع عند الاستلام',
    'Suivi en direct': 'متابعة مباشرة',
    'Équipe locale': 'فريق محلي',
    'Administration': 'الإدارة',

    'Connexion Client': 'دخول الزبون',
    'Administration ⚙️': 'الإدارة',
    'Bienvenue sur ColloExpress': 'مرحبا بك في ColloExpress',
    'Identifiant': 'المعرف',
    'Téléphone': 'الهاتف',
    'Mot de passe': 'كلمة المرور',
    'Se connecter': 'تسجيل الدخول',
    'Créer un compte': 'إنشاء حساب',
    'Nom complet': 'الاسم الكامل',
    'Confirmer le mot de passe': 'تأكيد كلمة المرور',

    'Accueil': 'الرئيسية',
    'Restaurants': 'المطاعم',
    'Commandes': 'الطلبات',
    'Commander': 'اطلب',
    'Déco': 'خروج',
    'Stats': 'الإحصائيات',
    'Cmdes': 'الطلبات',
    'Restos': 'المطاعم',
    'Clients': 'الزبائن',
    'Livreurs actifs': 'عمال التوصيل النشطون',
    'Commandes récentes': 'آخر الطلبات',
    'Top livreurs': 'أفضل عمال التوصيل',
    'Ajouter le restaurant': 'إضافة المطعم',
    'Modifier le restaurant': 'تعديل المطعم',
    'Enregistrer': 'حفظ',
    'Supprimer': 'حذف',
    'Ouvert': 'مفتوح',
    'Ferme': 'مغلق',
    'Fermé': 'مغلق',
    'Menu du restaurant': 'قائمة المطعم',
    'Ajouter le livreur': 'إضافة عامل توصيل',

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
    'Commander -': 'اطلب -',
    'Continuer les achats': 'مواصلة الشراء',
    'Mon panier': 'سلتي',
    'Sous-total': 'المجموع الفرعي',
    'Frais de livraison': 'رسوم التوصيل',
    'Total': 'المجموع',
    'Paiement cash à la livraison': 'الدفع نقدا عند الاستلام',
    'Itinéraire': 'المسار',
    'Facture': 'الفاتورة',
    'Détails': 'التفاصيل',
    'Votre livreur': 'عامل التوصيل الخاص بك',
    'Annulation': 'إلغاء',
    'Annuler la commande': 'إلغاء الطلب',

    'Disponibles': 'المتاحة',
    'Livraisons': 'التوصيلات',
    'Historique': 'السجل',
    'Notifications': 'الإشعارات',
    'Aucune commande en attente': 'لا توجد طلبات في الانتظار',
    'Retour au tableau de bord': 'العودة إلى لوحة التحكم',
    'En attente': 'في الانتظار',
    'Accepter cette livraison': 'قبول هذا التوصيل',
    'Trajet': 'المسار',
    'Depart': 'الانطلاق',
    'Demande': 'الطلب',
    'Livraison': 'التوصيل',
    'Type': 'النوع',
    'Client': 'الزبون',
    'Telephone': 'الهاتف',
    'Details': 'التفاصيل',
    'Heure Algerie': 'توقيت الجزائر',
    'Date inconnue': 'تاريخ غير معروف',
    'Courses / achats': 'مشتريات',
    'Restaurant': 'مطعم',
    'Colis': 'طرد',
    'Standard': 'عادي',

    'Toutes': 'الكل',
    'Attente': 'انتظار',
    'Livrées': 'تم التوصيل',
    'Aucune commande': 'لا توجد طلبات',
    'Annuler': 'إلغاء',
    'Commandes disponibles': 'الطلبات المتاحة',
  };

  const PLACEHOLDERS = {
    'Nom du restaurant': 'اسم المطعم',
    'Identifiant URL (optionnel)': 'معرف الرابط (اختياري)',
    'Categorie (Pizza, Tacos...)': 'الفئة (بيتزا، تاكوس...)',
    'Description': 'الوصف',
    'Adresse': 'العنوان',
    'Latitude': 'خط العرض',
    'Longitude': 'خط الطول',
    'Note': 'التقييم',
    'Temps livraison': 'مدة التوصيل',
    'Frais livraison': 'رسوم التوصيل',
    'Commande minimum': 'الحد الأدنى للطلب',
    'Tags separes par virgule: Populaire, Pizza': 'وسوم مفصولة بفاصلة: مشهور، بيتزا',
    'URL image': 'رابط الصورة',
    'URL image couverture (optionnel)': 'رابط صورة الغلاف (اختياري)',
    'Nom categorie': 'اسم الفئة',
    'Cle URL': 'مفتاح الرابط',
    'Nom article': 'اسم المنتج',
    'Prix DA': 'السعر دج',
    'ID article': 'معرف المنتج',
    'Image article URL': 'رابط صورة المنتج',
    'Nom option': 'اسم الخيار',
    'Cle option': 'مفتاح الخيار',
    'Choix': 'اختيار',
    'Prix +/−': 'السعر +/-',
    'Prix supplement': 'سعر الإضافة',
    'Votre adresse...': 'عنوانك...',
    'Quartier...': 'الحي...',
    'Notes pour le livreur (ex: sonnette 2eme etage...)': 'ملاحظات لعامل التوصيل',
    'Téléphone client': 'هاتف الزبون',
    'Nouveau mot de passe (optionnel)': 'كلمة مرور جديدة (اختياري)',
    'Rechercher...': 'بحث...',
  };

  function norm(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function translateTextNode(node) {
    const original = norm(node.nodeValue);
    if (!original) return;
    if (TEXT[original]) {
      node.nodeValue = node.nodeValue.replace(original, TEXT[original]);
      return;
    }
    Object.keys(TEXT).forEach((key) => {
      if (original.includes(key)) {
        node.nodeValue = node.nodeValue.replace(key, TEXT[key]);
      }
    });
  }

  function walk(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) {
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
    root.querySelectorAll('input, textarea, button, a, img').forEach((el) => {
      ['placeholder', 'title', 'aria-label', 'alt'].forEach((attr) => {
        const value = el.getAttribute(attr);
        const key = norm(value);
        if (key && (PLACEHOLDERS[key] || TEXT[key])) {
          el.setAttribute(attr, PLACEHOLDERS[key] || TEXT[key]);
        }
      });
      if ((el.tagName === 'INPUT' || el.tagName === 'BUTTON') && el.value) {
        const key = norm(el.value);
        if (TEXT[key]) el.value = TEXT[key];
      }
    });
  }

  function apply(root) {
    walk(root);
    translateAttributes(root);
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
