// Español
import type { Translations } from './ast';

export const es: Translations = {
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
    no: 'No',
    you: 'Tú',
    unknown: 'Desconocido',
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    users: 'Usuarios',
    footprint: 'Buscar Footprint',
    settings: 'Configuración',
    logout: 'Cerrar sesión',
    controlPanel: 'Panel de Control',
  },

  // Login page
  login: {
    title: 'Panel de Control',
    continueWithGoogle: 'Continuar con Google',
    onlyAuthorized: 'Solo usuarios autorizados pueden acceder',
    pendingApproval: 'Pendiente de Aprobación',
    pendingMessage: 'Tu cuenta está pendiente de aprobación por un administrador. Recibirás acceso una vez que sea aprobada.',
    checkAgain: 'Comprobar de nuevo',
    useOtherAccount: 'Usar otra cuenta',
  },

  // Dashboard page
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Estadísticas de consentimiento de los últimos 30 días',
    totalConsents: 'Total Consentimientos',
    accepted: 'Aceptados',
    rejected: 'Rechazados',
    customized: 'Personalizados',
    vsLastWeek: 'vs semana anterior',
    ofTotal: 'del total',
    dailyEvolution: 'Evolución Diaria',
    distribution: 'Distribución',
    today: 'Hoy',
    consentsRegistered: 'consentimientos registrados',
    total: 'Total',
  },

  // Users page
  users: {
    title: 'Gestión de Usuarios',
    subtitle: 'Administra los usuarios que pueden acceder al panel',
    pendingApproval: 'Pendientes de Aprobación',
    activeUsers: 'Usuarios Activos',
    user: 'Usuario',
    role: 'Rol',
    lastAccess: 'Último Acceso',
    actions: 'Acciones',
    approve: 'Aprobar',
    approveViewer: 'Aprobar (Viewer)',
    reject: 'Rechazar',
    confirmDelete: '¿Estás seguro de eliminar este usuario?',
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
    subtitle: 'Busca el historial de consentimiento de un usuario por su ID de footprint',
    searchPlaceholder: 'Ej: ESB-A7F3B2C1 o parte del ID...',
    whatIsFootprint: '¿Qué es el Footprint ID?',
    footprintExplanation: 'Es un identificador único generado para cada navegador/dispositivo. Los usuarios pueden encontrar su ID en el banner de cookies al hacer clic en "Personalizar". Este ID permite ejercer los derechos ARCO (Acceso, Rectificación, Cancelación, Oposición).',
    recordsFound: 'Se encontraron',
    records: 'registros',
    exportJSON: 'Exportar JSON',
    allAccepted: 'Todas aceptadas',
    allRejected: 'Todas rechazadas',
    customized: 'Personalizado',
    site: 'Sitio',
    analytics: 'Analíticas',
    marketing: 'Marketing',
    language: 'Idioma',
    noRecords: 'No se encontraron registros',
    noRecordsMessage: 'No hay consentimientos registrados con ese ID de footprint',
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
};
