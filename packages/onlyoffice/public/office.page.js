import { $ } from '@hydrooj/ui-default';

const { AutoloadPage } = window.Hydro;

let loaded = false;
async function load() {
  if (loaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const scriptElement = document.createElement('script');
    scriptElement.src = UiContext.onlyofficeApi;
    scriptElement.async = true;
    document.head.appendChild(scriptElement);
    scriptElement.onload = resolve;
    scriptElement.onerror = reject;
    loaded = true;
  });
}

const loader = (mode) => async (element) => {
  const id = `${mode}-${Math.random().toString()}`;
  $(element).attr('id', id);
  const url = $(element).text();
  const t = new URL(url, window.location.href).pathname.split('.');
  const n = new URL(url, window.location.href).pathname.split('/');
  const lang = UserContext.viewLang.includes('_') ? UserContext.viewLang.split('_')[0] : UserContext.viewLang;
  // eslint-disable-next-line no-undef
  window.editor = new DocsAPI.DocEditor(id, {
    document: {
      fileType: t[t.length - 1],
      key: Math.random().toString(16),
      title: decodeURIComponent(n[n.length - 1]),
      url: new URL(url, window.location.href),
      permissions: {
        comment: false,
        copy: true,
        download: true,
        edit: false,
        fillForms: false,
        modifyContentControl: false,
        modifyFilter: false,
        print: true,
        protect: false,
        review: false,
      },
    },
    editorConfig: {
      lang,
      mode: 'view',
      user: {
        group: 'Hydro',
        id: UserContext._id.toString(),
        name: UserContext.uname,
      },
      customization: {
        chat: false,
        comments: false,
        help: false,
        hideRulers: true,
        plugins: false,
      },
    },
    documentType: mode,
    height: mode === 'slide' ? '560px' : '900px',
  });
};

const getEles = (types) => {
  const eles = [];
  for (const type of types) eles.push(...$(`div[data-${type}]`).get());
  return eles;
};

const page = new AutoloadPage('onlyoffice', async () => {
  const all = getEles(['doc', 'docx', 'cell', 'xls', 'xlsx', 'slide', 'ppt', 'pptx']);
  if (all.length) await load();
  getEles(['doc', 'docx']).forEach(loader('word'));
  getEles(['cell', 'xls', 'xlsx']).forEach(loader('cell'));
  getEles(['slide', 'ppt', 'pptx']).forEach(loader('slide'));
});

window.Hydro.extraPages.push(page);
