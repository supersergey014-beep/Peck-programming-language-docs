(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector('#theme-toggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const searchInput = document.querySelector('#docs-search');
  const searchWrap = document.querySelector('#search-wrap');
  const searchResults = document.querySelector('#search-results');
  const navLinks = [...document.querySelectorAll('.nav-link')];
  const menuToggle = document.querySelector('#menu-toggle');
  const sidebar = document.querySelector('#sidebar');
  const mobileScrim = document.querySelector('#mobile-scrim');
  const accountDialog = document.querySelector('#account-dialog');
  const accountOpen = document.querySelector('#account-open');
  const accountOpenMobile = document.querySelector('#account-open-mobile');
  const accountClose = document.querySelector('#account-close');
  const authTabs = [...document.querySelectorAll('.auth-tab')];
  const authForm = document.querySelector('#auth-form');
  const nameField = document.querySelector('#name-field');
  const nameInput = authForm.querySelector('[name="name"]');
  const passwordInput = authForm.querySelector('[name="password"]');
  const authSubmit = authForm.querySelector('.auth-submit');
  const formMessage = document.querySelector('#form-message');
  const sections = [...document.querySelectorAll('section[data-searchable]')];
  const sectionIndex = sections.map((section) => ({
    id: section.id,
    title: section.querySelector('h1, h2')?.textContent.trim() || section.id,
    text: section.textContent.toLowerCase()
  }));

  function setTheme(theme) {
    const isLight = theme === 'light';
    root.dataset.theme = isLight ? 'light' : 'dark';
    themeToggle.setAttribute('aria-checked', String(isLight));
    themeToggle.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} theme`);
    themeMeta.setAttribute('content', isLight ? '#f4f7f3' : '#111513');
    try {
      localStorage.setItem('hypha-docs-theme', root.dataset.theme);
    } catch {
      // Theme still works when browser storage is disabled.
    }
  }

  try {
    const storedTheme = localStorage.getItem('hypha-docs-theme');
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    setTheme(storedTheme || (systemPrefersLight ? 'light' : 'dark'));
  } catch {
    setTheme('dark');
  }

  themeToggle.addEventListener('click', () => {
    setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  function closeSearch() {
    searchResults.hidden = true;
    searchInput.setAttribute('aria-expanded', 'false');
  }

  function openSearch() {
    searchResults.hidden = false;
    searchInput.setAttribute('aria-expanded', 'true');
  }

  function renderSearch(query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      closeSearch();
      searchResults.replaceChildren();
      return;
    }

    const matches = sectionIndex.filter((item) =>
      item.title.toLowerCase().includes(normalized) || item.text.includes(normalized)
    ).slice(0, 6);
    searchResults.replaceChildren();

    if (matches.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'search-empty';
      empty.textContent = 'No matching sections';
      searchResults.append(empty);
      openSearch();
      return;
    }

    for (const [index, item] of matches.entries()) {
      const result = document.createElement('button');
      result.className = 'search-result';
      result.type = 'button';
      result.setAttribute('role', 'option');
      const number = document.createElement('span');
      number.className = 'search-result-index';
      number.textContent = String(index + 1).padStart(2, '0');
      const title = document.createElement('span');
      title.textContent = item.title;
      result.append(number, title);
      result.addEventListener('click', () => {
        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', `#${item.id}`);
        searchInput.value = '';
        closeSearch();
        searchInput.blur();
      });
      searchResults.append(result);
    }
    openSearch();
  }

  searchInput.addEventListener('input', () => renderSearch(searchInput.value));
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) renderSearch(searchInput.value);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!searchWrap.contains(event.target)) closeSearch();
  });
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    if (event.key === 'Escape') {
      closeSearch();
      closeMenu();
      if (accountDialog.open) accountDialog.close();
    }
  });

  function setActiveSection(id) {
    navLinks.forEach((link) => {
      const isActive = link.dataset.section === id;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: '-18% 0px -68% 0px', threshold: [0, .15, .4, .7] });
    navLinks.forEach((link) => {
      const section = document.getElementById(link.dataset.section);
      if (section) observer.observe(section);
    });
  }

  function closeMenu() {
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open documentation menu');
    mobileScrim.hidden = true;
  }

  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closeMenu();
    } else {
      document.body.classList.add('menu-open');
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Close documentation menu');
      mobileScrim.hidden = false;
    }
  });
  mobileScrim.addEventListener('click', closeMenu);
  sidebar.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  document.querySelectorAll('.copy-button').forEach((button) => {
    button.addEventListener('click', async () => {
      const code = button.closest('.code-window')?.querySelector('pre code')?.innerText || '';
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = 'Copied';
        button.classList.add('copied');
      } catch {
        const selection = window.getSelection();
        const range = document.createRange();
        const codeElement = button.closest('.code-window')?.querySelector('pre code');
        if (codeElement) {
          range.selectNodeContents(codeElement);
          selection.removeAllRanges();
          selection.addRange(range);
          button.textContent = 'Select to copy';
        }
      }
      window.setTimeout(() => {
        button.textContent = 'Copy';
        button.classList.remove('copied');
      }, 1800);
    });
  });

  function openAccountDialog() {
    formMessage.textContent = '';
    closeMenu();
    accountDialog.showModal();
    authTabs[0].focus();
  }
  accountOpen.addEventListener('click', openAccountDialog);
  accountOpenMobile.addEventListener('click', openAccountDialog);
  accountClose.addEventListener('click', () => accountDialog.close());

  authTabs.forEach((tab) => tab.addEventListener('click', () => {
    const signup = tab.dataset.mode === 'signup';
    authTabs.forEach((item) => {
      const selected = item === tab;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-selected', String(selected));
    });
    nameField.hidden = !signup;
    nameInput.required = signup;
    nameInput.autocomplete = signup ? 'name' : 'off';
    passwordInput.autocomplete = signup ? 'new-password' : 'current-password';
    authSubmit.innerHTML = signup
      ? 'Create demo account <span aria-hidden="true">→</span>'
      : 'Log in to demo <span aria-hidden="true">→</span>';
    formMessage.textContent = '';
  }));

  authForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!authForm.reportValidity()) return;
    formMessage.textContent = 'Demo only: no account was created and no data was sent.';
  });
})();
