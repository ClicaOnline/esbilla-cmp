// Asturianu - Idioma por defectu
import type { Translations } from './types';

export const ast: Translations = {
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
    organizations: 'Organizaciones',
    sites: 'Sitios',
    users: 'Usuarios',
    footprint: 'Buscar Footprint',
    urlStats: 'URLs',
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
    organizations: 'Organizaciones',
    sites: 'Sitios',
    allSites: 'Tolos sitios',
    noAccess: 'Ensin accesu',
    addToOrg: 'Añadir a organización',
    addToSite: 'Añadir a sitiu',
    selectOrganization: 'Escoyer organización',
    selectSite: 'Escoyer sitiu',
    accessLevel: 'Nivel d\'accesu',
    roles: {
      superadmin: 'Superadmin',
      pending: 'Pendiente',
      org_owner: 'Propietariu',
      org_admin: 'Admin Org',
      org_viewer: 'Viewer Org',
      site_admin: 'Admin Sitiu',
      site_viewer: 'Viewer Sitiu',
    },
  },

  // Organizations page
  organizations: {
    title: 'Xestión d\'Organizaciones',
    subtitle: 'Alministra les entidaes fiscales y los sos dominios',
    createOrg: 'Crear Organización',
    editOrg: 'Editar Organización',
    deleteOrg: 'Eliminar Organización',
    confirmDelete: '¿Tas seguru d\'eliminar esta organización? Tolos sitios y configuraciones van perdese.',
    name: 'Nome',
    namePlaceholder: 'La mio empresa',
    legalName: 'Razón Social',
    taxId: 'NIF/CIF',
    plan: 'Plan',
    billingEmail: 'Email de facturación',
    plans: {
      free: 'Gratis',
      pro: 'Pro',
      enterprise: 'Enterprise',
    },
    noOrgs: 'Nun hai organizaciones',
    noOrgsMessage: 'Entovía nun creaste nenguna organización.',
    sitesCount: 'sitios',
    usersCount: 'usuarios',
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

  // Sites page
  sites: {
    title: 'Xestión de Sitios',
    subtitle: 'Alministra los sitios web y dominios que uses Esbilla CMP',
    createSite: 'Crear Sitiu',
    editSite: 'Editar Sitiu',
    deleteSite: 'Eliminar Sitiu',
    confirmDelete: '¿Tas seguru d\'eliminar esti sitiu? Tola configuración y estadístiques van perdese.',
    name: 'Nome',
    namePlaceholder: 'El mio sitiu web',
    domains: 'Dominios',
    domainsPlaceholder: 'example.com, www.example.com',
    domainsHelp: 'Dominios asociaos a esti sitiu (separaos por comes)',
    apiKey: 'API Key',
    apiKeyHelp: 'Usa esta clave pa integrar el SDK nel to sitiu',
    copyApiKey: 'Copiar API Key',
    copied: 'Copiáu',
    regenerateKey: 'Rexenerar Clave',
    confirmRegenerate: '¿Tas seguru de rexenerar la clave API? La clave anterior va dexar de funcionar.',
    noSites: 'Nun hai sitios',
    noSitesMessage: 'Entovía nun creaste dengún sitiu. Crea\'l primeru pa empezar.',
    integration: 'Integración',
    integrationCode: 'Códigu d\'integración',
    stats: 'Estadístiques',
    totalConsents: 'Total consentimientos',
    lastConsent: 'Caberu consentimientu',
    never: 'Enxamás',
    viewStats: 'Ver estadístiques',
    configure: 'Configurar',
  },

  // URL Stats page
  urlStats: {
    title: 'Estadístiques por URL',
    subtitle: 'Consentimientos agrupaos por páxina',
    uniqueUrls: 'URLs úniques',
    totalEvents: 'eventos totales',
    exportCsv: 'Esportar CSV',
    acceptAll: 'Aceptar',
    rejectAll: 'Refugar',
    customize: 'Personalizar',
    lastEvent: 'Caberu eventu',
    noData: 'Ensin datos',
    noDataMessage: 'Nun hai eventos de consentimientu nesti periodu',
    showing: 'Amosando',
  },

  // Settings page
  settings: {
    title: 'Configuración del Banner',
    subtitle: 'Personaliza l\'aspeutu y comportamientu del banner de cookies',

    // Layout section
    layoutSection: 'Diseñu del Banner',
    layoutDescription: 'Escueyi cómo se va presentar el banner de cookies',
    layoutModal: 'Modal centráu',
    layoutModalDesc: 'Apaez nel centru de la pantalla con fondu escurecíu',
    layoutBar: 'Barra inferior',
    layoutBarDesc: 'Barra fixa na parte inferior de la pantalla',
    layoutCorner: 'Esquina',
    layoutCornerDesc: 'Pequeñu diálogu nuna esquina de la pantalla',

    // Colors section
    colorsSection: 'Esquema de Colores',
    colorsDescription: 'Axusta los colores del banner pa que concuayen cola to marca',
    primaryColor: 'Color Primariu',
    primaryColorDesc: 'Color principal pa botones destacaos',
    secondaryColor: 'Color Secundariu',
    secondaryColorDesc: 'Color pa botones secundarios',
    backgroundColor: 'Fondu',
    backgroundColorDesc: 'Color de fondu del banner',
    textColor: 'Testu',
    textColorDesc: 'Color del testu principal',

    // Fonts section
    fontsSection: 'Tipografía',
    fontsDescription: 'Escueyi la fonte pa los testos del banner',
    fontFamily: 'Familia de Fonte',
    fontFamilies: {
      system: 'Sistema (por defectu)',
      inter: 'Inter',
      roboto: 'Roboto',
      opensans: 'Open Sans',
      lato: 'Lato',
      montserrat: 'Montserrat',
    },

    // Buttons section
    buttonsSection: 'Estilu de Botones',
    buttonsDescription: 'Configura l\'aspeutu de los botones del banner',
    buttonStyle: 'Estilu de botones',
    buttonStyles: {
      equal: 'Mesmu pesu visual',
      equalDesc: 'Aceptar y Refugar tienen el mesmu tamañu y contraste',
      acceptHighlight: 'Destacar Aceptar',
      acceptHighlightDesc: 'El botón d\'aceptar destaca sobre\'l de refugar',
    },
    acceptAllLabel: 'Testu "Aceptar toes"',
    rejectAllLabel: 'Testu "Refugar toes"',
    customizeLabel: 'Testu "Personalizar"',
    acceptEssentialLabel: 'Testu "Namás esenciales"',

    // Legal notice section
    legalSection: 'Avisu Llegal',
    legalDescription: 'Configura l\'avisu llegal que s\'amosará como modal',
    legalTitle: 'Títulu del avisu',
    legalContent: 'Conteníu del avisu llegal',
    legalPlaceholder: 'Escribe equí l\'avisu llegal...',
    previewModal: 'Previsualizar Modal',

    // Preview
    preview: 'Vista previa',
    previewDescription: 'Asina se verá\'l banner colos axustes actuales',

    // Actions
    saveChanges: 'Guardar Cambeos',
    resetDefaults: 'Restaurar por Defectu',
    saved: 'Cambeos guardaos',
  },
};
