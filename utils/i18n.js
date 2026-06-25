const SUPPORTED_LANGS = new Set(['fr', 'ar']);

function getLang(req) {
  const rawCookie = String(req.headers.cookie || '');
  const cookieLang = rawCookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('collo_lang='))
    ?.split('=')[1];
  const lang = req.session?.lang || cookieLang || 'fr';
  return SUPPORTED_LANGS.has(lang) ? lang : 'fr';
}

function setLang(req, res, lang) {
  const nextLang = SUPPORTED_LANGS.has(lang) ? lang : 'fr';
  if (req.session) req.session.lang = nextLang;
  res.cookie('collo_lang', nextLang, {
    maxAge: 1000 * 60 * 60 * 24 * 365,
    httpOnly: false,
    sameSite: 'lax',
  });
  return nextLang;
}

function i18nMiddleware(req, res, next) {
  const lang = getLang(req);
  res.locals.lang = lang;
  res.locals.isArabic = lang === 'ar';
  res.locals.langDir = lang === 'ar' ? 'rtl' : 'ltr';
  res.locals.langSwitchLabel = lang === 'ar' ? 'Français' : 'العربية';
  res.locals.langSwitchTarget = lang === 'ar' ? 'fr' : 'ar';
  next();
}

module.exports = {
  getLang,
  i18nMiddleware,
  setLang,
};
