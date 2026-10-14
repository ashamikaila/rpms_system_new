/* Modal behavior for the shared Help & Support dialog. */
(function () {
  const modal = document.getElementById('supportModal');
  if (!modal) return;
  const $ = (selector, root = modal) => root.querySelector(selector);
  const form = $('#supportForm'), select = $('#supportCategory'), msg = $('#supportMessage');
  const chips = [...modal.querySelectorAll('.sp-chip')], count = $('#spCount');
  let lastTrigger = null;

  function showTab(name) {
    modal.querySelectorAll('[data-sp-tab]').forEach(button => {
      const active = button.dataset.spTab === name;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    $('#spPaneSend').hidden = name !== 'send';
    $('#spPaneHistory').hidden = name !== 'history';
  }

  function openModal(tab) {
    if (!modal.open) modal.showModal();
    document.documentElement.classList.add('sp-lock');
    showTab(tab || 'send');
  }

  modal.addEventListener('close', () => {
    document.documentElement.classList.remove('sp-lock');
    if (lastTrigger) lastTrigger.focus();
  });
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-open-support]');
    if (!trigger) return;
    event.preventDefault();
    lastTrigger = trigger;
    openModal(trigger.dataset.openSupport === 'history' ? 'history' : 'send');
  });
  modal.addEventListener('click', event => {
    if (event.target === modal || event.target.closest('[data-sp-close]')) modal.close();
  });
  if (location.hash === '#help-support') openModal('send');

  modal.querySelectorAll('[data-sp-tab]').forEach(button => {
    button.addEventListener('click', () => showTab(button.dataset.spTab));
  });

  function pick(value) {
    select.value = value;
    chips.forEach(chip => chip.setAttribute('aria-checked', String(chip.dataset.value === value)));
    $('#spChips').classList.remove('err');
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }
  chips.forEach(chip => chip.addEventListener('click', () => pick(chip.dataset.value)));

  function updateCount() {
    const length = msg.value.length, max = Number(msg.maxLength) || 600;
    count.textContent = `${length} / ${max}`;
    count.classList.toggle('near', length >= max * 0.9);
  }
  msg.addEventListener('input', updateCount);
  form.addEventListener('reset', () => setTimeout(() => {
    chips.forEach(chip => chip.setAttribute('aria-checked', 'false'));
    updateCount();
  }));
  form.addEventListener('submit', event => {
    if (!select.value) {
      event.preventDefault();
      $('#spChips').classList.add('err');
      chips[0]?.focus();
    }
  }, true);
})();
