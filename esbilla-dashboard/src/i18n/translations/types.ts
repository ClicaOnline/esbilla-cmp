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
    // New email/password fields
    email: string;
    password: string;
    forgotPassword: string;
    signIn: string;
    signInWith: string;
    noAccount: string;
    startHere: string;
    orContinueWith: string;
  };

  auth: {
    // Register
    register: {
      title: string;
      fullName: string;
      email: string;
      password: string;
      confirmPassword: string;
      passwordStrength: string;
      weak: string;
      medium: string;
      strong: string;
      acceptTerms: string;
      termsLink: string;
      privacyLink: string;
      createAccount: string;
      orSignUpWith: string;
      haveAccount: string;
      signIn: string;
      planSelected: string;
      changePlan: string;
    };

    // Verify Email
    verifyEmail: {
      title: string;
      sentTo: string;
      checkInbox: string;
      clickLink: string;
      didntReceive: string;
      resend: string;
      resendCooldown: string;
      backToLogin: string;
      verifying: string;
      verified: string;
    };

    // Forgot Password
    forgotPassword: {
      title: string;
      enterEmail: string;
      sendLink: string;
      backToLogin: string;
      checkEmail: string;
      emailSent: string;
      genericMessage: string;
    };

    // Reset Password
    resetPassword: {
      title: string;
      newPassword: string;
      confirmPassword: string;
      resetButton: string;
      success: string;
      backToLogin: string;
      invalidLink: string;
      expiredLink: string;
    };

    // Pending Approval
    pending: {
      title: string;
      message: string;
      checkAgain: string;
      useOther: string;
    };

    // Onboarding
    onboarding: {
      welcome: string;
      stepOf: string;
      step1: {
        title: string;
        subtitle: string;
        orgName: string;
        orgNamePlaceholder: string;
        website: string;
        websitePlaceholder: string;
        taxId: string;
        taxIdPlaceholder: string;
        taxIdOptional: string;
        next: string;
      };
      step2: {
        title: string;
        subtitle: string;
        domain: string;
        domainPlaceholder: string;
        siteName: string;
        siteNamePlaceholder: string;
        back: string;
        next: string;
      };
      step3: {
        title: string;
        subtitle: string;
        copyCode: string;
        copied: string;
        goToDashboard: string;
        needHelp: string;
        installGuide: string;
      };
      planSelected: string;
      creating: string;
      error: string;
    };

    // Invitations
    invitation: {
      title: string;
      invitedBy: string;
      invitedTo: string;
      asRole: string;
      acceptWith: string;
      acceptAndSignIn: string;
      noAccount: string;
      createAndAccept: string;
      expired: string;
      expiredMessage: string;
      notFound: string;
      notFoundMessage: string;
      orContinueWith: string;
      accepting: string;
    };

    // Validation errors
    errors: {
      required: string;
      invalidEmail: string;
      passwordTooShort: string;
      passwordRequirements: string;
      passwordsMismatch: string;
      termsRequired: string;
      emailAlreadyExists: string;
      invalidCredentials: string;
      userNotFound: string;
      wrongPassword: string;
      tooManyAttempts: string;
      networkError: string;
      unknownError: string;
      emailNotVerified: string;
      nameTooShort: string;
      invalidDomain: string;
    };
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
    createUser: string;
    createUserDesc: string;
    basicInfo: string;
    displayName: string;
    globalRole: string;
    orgAccess: string;
    siteAccess: string;
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
    recalculateStats: string;
    recalculate: string;
    recalculating: string;
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
