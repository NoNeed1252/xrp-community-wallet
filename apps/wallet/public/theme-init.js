// Anti-flash theme init. Применяет сохранённую тему до React mount.
// Только manual toggle (ADR-050) — prefers-color-scheme не учитываем.
// Файл вынесен из inline <script> ради совместимости с strict CSP (script-src 'self').
(function () {
  try {
    var t = localStorage.getItem('rc:theme');
    if (t === 'dark' || t === 'light') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) {
    /* ignore */
  }
})();
