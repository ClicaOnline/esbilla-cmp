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
