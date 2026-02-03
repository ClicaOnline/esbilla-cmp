// Type definitions for translations - uses string instead of literal types
export interface Translations {
  common: {
    loading: string;
    search: string;
    searching: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    confirm: string;
    yes: string;
    no: string;
    you: string;
    unknown: string;
  };

  nav: {
    dashboard: string;
    organizations: string;
    sites: string;
    users: string;
    footprint: string;
    urlStats: string;
    settings: string;
    logout: string;
    controlPanel: string;
  };

  login: {
    title: string;
    continueWithGoogle: string;
    onlyAuthorized: string;
    pendingApproval: string;
    pendingMessage: string;
    checkAgain: string;
    useOtherAccount: string;
  };

  dashboard: {
    title: string;
    subtitle: string;
    totalConsents: string;
    accepted: string;
    rejected: string;
    customized: string;
    vsLastWeek: string;
    ofTotal: string;
    dailyEvolution: string;
    distribution: string;
    today: string;
    consentsRegistered: string;
    total: string;
  };

  users: {
    title: string;
    subtitle: string;
    pendingApproval: string;
    activeUsers: string;
    user: string;
    role: string;
    lastAccess: string;
    actions: string;
    approve: string;
    approveViewer: string;
    reject: string;
    confirmDelete: string;
    organizations: string;
    sites: string;
    allSites: string;
    noAccess: string;
    addToOrg: string;
    addToSite: string;
    selectOrganization: string;
    selectSite: string;
    accessLevel: string;
    roles: {
      superadmin: string;
      pending: string;
      org_owner: string;
      org_admin: string;
      org_viewer: string;
      site_admin: string;
      site_viewer: string;
    };
  };

  organizations: {
    title: string;
    subtitle: string;
    createOrg: string;
    editOrg: string;
    deleteOrg: string;
    confirmDelete: string;
    name: string;
    namePlaceholder: string;
    legalName: string;
    taxId: string;
    plan: string;
    billingEmail: string;
    plans: {
      free: string;
      pro: string;
      enterprise: string;
    };
    noOrgs: string;
    noOrgsMessage: string;
    sitesCount: string;
    usersCount: string;
  };

  footprint: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    whatIsFootprint: string;
    footprintExplanation: string;
    recordsFound: string;
    records: string;
    exportJSON: string;
    allAccepted: string;
    allRejected: string;
    customized: string;
    site: string;
    analytics: string;
    marketing: string;
    language: string;
    noRecords: string;
    noRecordsMessage: string;
    browser: string;
  };

  languages: {
    ast: string;
    es: string;
    en: string;
    fr: string;
    pt: string;
    de: string;
    it: string;
    ca: string;
    eu: string;
    gl: string;
  };

  sites: {
    title: string;
    subtitle: string;
    createSite: string;
    editSite: string;
    deleteSite: string;
    confirmDelete: string;
    name: string;
    namePlaceholder: string;
    domains: string;
    domainsPlaceholder: string;
    domainsHelp: string;
    apiKey: string;
    apiKeyHelp: string;
    copyApiKey: string;
    copied: string;
    regenerateKey: string;
    confirmRegenerate: string;
    noSites: string;
    noSitesMessage: string;
    integration: string;
    integrationCode: string;
    stats: string;
    totalConsents: string;
    lastConsent: string;
    never: string;
    viewStats: string;
    configure: string;
  };

  urlStats: {
    title: string;
    subtitle: string;
    uniqueUrls: string;
    totalEvents: string;
    exportCsv: string;
    acceptAll: string;
    rejectAll: string;
    customize: string;
    lastEvent: string;
    noData: string;
    noDataMessage: string;
    showing: string;
  };

  settings: {
    title: string;
    subtitle: string;
    layoutSection: string;
    layoutDescription: string;
    layoutModal: string;
    layoutModalDesc: string;
    layoutBar: string;
    layoutBarDesc: string;
    layoutCorner: string;
    layoutCornerDesc: string;
    colorsSection: string;
    colorsDescription: string;
    primaryColor: string;
    primaryColorDesc: string;
    secondaryColor: string;
    secondaryColorDesc: string;
    backgroundColor: string;
    backgroundColorDesc: string;
    textColor: string;
    textColorDesc: string;
    fontsSection: string;
    fontsDescription: string;
    fontFamily: string;
    fontFamilies: {
      system: string;
      inter: string;
      roboto: string;
      opensans: string;
      lato: string;
      montserrat: string;
    };
    buttonsSection: string;
    buttonsDescription: string;
    buttonStyle: string;
    buttonStyles: {
      equal: string;
      equalDesc: string;
      acceptHighlight: string;
      acceptHighlightDesc: string;
    };
    acceptAllLabel: string;
    rejectAllLabel: string;
    customizeLabel: string;
    acceptEssentialLabel: string;
    legalSection: string;
    legalDescription: string;
    legalTitle: string;
    legalContent: string;
    legalPlaceholder: string;
    previewModal: string;
    preview: string;
    previewDescription: string;
    saveChanges: string;
    resetDefaults: string;
    saved: string;
  };
}
