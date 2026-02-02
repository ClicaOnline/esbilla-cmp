// Asturianu - Idioma por defectu
export const ast = {
  // Common
  common: {
    loading: 'Cargando...',
    search: 'Buscar',
    searching: 'Buscando...',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    confirm: 'Confirmar',
    yes: 'Sí',
    no: 'Non',
    you: 'Tu',
    unknown: 'Desconocíu',
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    users: 'Usuarios',
    footprint: 'Buscar Footprint',
    settings: 'Configuración',
    logout: 'Zarrar sesión',
    controlPanel: 'Panel de Control',
  },

  // Login page
  login: {
    title: 'Panel de Control',
    continueWithGoogle: 'Siguir con Google',
    onlyAuthorized: 'Namás usuarios autorizaos pueden acceder',
    pendingApproval: 'Pendiente d\'Aprobación',
    pendingMessage: 'La to cuenta ta pendiente d\'aprobación por un alministrador. Vas recibir accesu una vegada que seya aprobada.',
    checkAgain: 'Comprobar de nuevo',
    useOtherAccount: 'Usar otra cuenta',
  },

  // Dashboard page
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Estadístiques de consentimientu de los caberos 30 díes',
    totalConsents: 'Total Consentimientos',
    accepted: 'Aceptaos',
    rejected: 'Refugaos',
    customized: 'Personalizaos',
    vsLastWeek: 'vs selmana anterior',
    ofTotal: 'del total',
    dailyEvolution: 'Evolución Diaria',
    distribution: 'Distribución',
    today: 'Güei',
    consentsRegistered: 'consentimientos rexistraos',
    total: 'Total',
  },

  // Users page
  users: {
    title: 'Xestión d\'Usuarios',
    subtitle: 'Alministra los usuarios que pueden acceder al panel',
    pendingApproval: 'Pendientes d\'Aprobación',
    activeUsers: 'Usuarios Activos',
    user: 'Usuariu',
    role: 'Rol',
    lastAccess: 'Caberu Accesu',
    actions: 'Aiciones',
    approve: 'Aprobar',
    approveViewer: 'Aprobar (Viewer)',
    reject: 'Refugar',
    confirmDelete: '¿Tas seguru d\'eliminar esti usuariu?',
    roles: {
      superadmin: 'Superadmin',
      admin: 'Admin',
      viewer: 'Viewer',
      pending: 'Pendiente',
    },
  },

  // Footprint page
  footprint: {
    title: 'Buscar por Footprint',
    subtitle: 'Busca l\'historial de consentimientu d\'un usuariu pol so ID de footprint',
    searchPlaceholder: 'Ex: ESB-A7F3B2C1 o parte del ID...',
    whatIsFootprint: '¿Qué ye\'l Footprint ID?',
    footprintExplanation: 'Ye un identificador únicu xeneráu pa cada navegador/dispositivu. Los usuarios pueden alcontrar el so ID nel banner de cookies al facer clic en "Personalizar". Esti ID permite exercer los drechos ARCO (Accesu, Rectificación, Cancelación, Oposición).',
    recordsFound: 'Alcontráronse',
    records: 'rexistros',
    exportJSON: 'Esportar JSON',
    allAccepted: 'Toes aceptaes',
    allRejected: 'Toes refugaes',
    customized: 'Personalizáu',
    site: 'Sitiu',
    analytics: 'Analítiques',
    marketing: 'Marketing',
    language: 'Idioma',
    noRecords: 'Nun s\'alcontraron rexistros',
    noRecordsMessage: 'Nun hai consentimientos rexistraos con esi ID de footprint',
    browser: 'Navegador',
  },

  // Languages
  languages: {
    ast: 'Asturianu',
    es: 'Español',
    en: 'English',
    fr: 'Français',
    pt: 'Português',
    de: 'Deutsch',
    it: 'Italiano',
    ca: 'Català',
    eu: 'Euskara',
    gl: 'Galego',
  },
} as const;

export type Translations = typeof ast;
