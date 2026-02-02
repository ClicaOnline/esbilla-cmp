// English
import type { Translations } from './types';

export const en: Translations = {
  // Common
  common: {
    loading: 'Loading...',
    search: 'Search',
    searching: 'Searching...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    you: 'You',
    unknown: 'Unknown',
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    users: 'Users',
    footprint: 'Search Footprint',
    settings: 'Settings',
    logout: 'Log out',
    controlPanel: 'Control Panel',
  },

  // Login page
  login: {
    title: 'Control Panel',
    continueWithGoogle: 'Continue with Google',
    onlyAuthorized: 'Only authorized users can access',
    pendingApproval: 'Pending Approval',
    pendingMessage: 'Your account is pending approval by an administrator. You will receive access once it is approved.',
    checkAgain: 'Check again',
    useOtherAccount: 'Use another account',
  },

  // Dashboard page
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Consent statistics for the last 30 days',
    totalConsents: 'Total Consents',
    accepted: 'Accepted',
    rejected: 'Rejected',
    customized: 'Customized',
    vsLastWeek: 'vs last week',
    ofTotal: 'of total',
    dailyEvolution: 'Daily Evolution',
    distribution: 'Distribution',
    today: 'Today',
    consentsRegistered: 'consents recorded',
    total: 'Total',
  },

  // Users page
  users: {
    title: 'User Management',
    subtitle: 'Manage users who can access the panel',
    pendingApproval: 'Pending Approval',
    activeUsers: 'Active Users',
    user: 'User',
    role: 'Role',
    lastAccess: 'Last Access',
    actions: 'Actions',
    approve: 'Approve',
    approveViewer: 'Approve (Viewer)',
    reject: 'Reject',
    confirmDelete: 'Are you sure you want to delete this user?',
    roles: {
      superadmin: 'Superadmin',
      admin: 'Admin',
      viewer: 'Viewer',
      pending: 'Pending',
    },
  },

  // Footprint page
  footprint: {
    title: 'Search by Footprint',
    subtitle: 'Search a user\'s consent history by their footprint ID',
    searchPlaceholder: 'E.g.: ESB-A7F3B2C1 or part of the ID...',
    whatIsFootprint: 'What is the Footprint ID?',
    footprintExplanation: 'It is a unique identifier generated for each browser/device. Users can find their ID in the cookie banner by clicking "Customize". This ID allows exercising ARCO rights (Access, Rectification, Cancellation, Opposition).',
    recordsFound: 'Found',
    records: 'records',
    exportJSON: 'Export JSON',
    allAccepted: 'All accepted',
    allRejected: 'All rejected',
    customized: 'Customized',
    site: 'Site',
    analytics: 'Analytics',
    marketing: 'Marketing',
    language: 'Language',
    noRecords: 'No records found',
    noRecordsMessage: 'There are no consents recorded with that footprint ID',
    browser: 'Browser',
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
    title: 'Banner Settings',
    subtitle: 'Customize the appearance and behavior of the cookie banner',

    // Layout section
    layoutSection: 'Banner Layout',
    layoutDescription: 'Choose how the cookie banner will be displayed',
    layoutModal: 'Centered modal',
    layoutModalDesc: 'Appears in the center of the screen with darkened background',
    layoutBar: 'Bottom bar',
    layoutBarDesc: 'Fixed bar at the bottom of the screen',
    layoutCorner: 'Corner',
    layoutCornerDesc: 'Small dialog in a corner of the screen',

    // Colors section
    colorsSection: 'Color Scheme',
    colorsDescription: 'Adjust the banner colors to match your brand',
    primaryColor: 'Primary Color',
    primaryColorDesc: 'Main color for highlighted buttons',
    secondaryColor: 'Secondary Color',
    secondaryColorDesc: 'Color for secondary buttons',
    backgroundColor: 'Background',
    backgroundColorDesc: 'Banner background color',
    textColor: 'Text',
    textColorDesc: 'Main text color',

    // Fonts section
    fontsSection: 'Typography',
    fontsDescription: 'Choose the font for banner texts',
    fontFamily: 'Font Family',
    fontFamilies: {
      system: 'System (default)',
      inter: 'Inter',
      roboto: 'Roboto',
      opensans: 'Open Sans',
      lato: 'Lato',
      montserrat: 'Montserrat',
    },

    // Buttons section
    buttonsSection: 'Button Style',
    buttonsDescription: 'Configure the appearance of banner buttons',
    buttonStyle: 'Button style',
    buttonStyles: {
      equal: 'Equal visual weight',
      equalDesc: 'Accept and Reject have the same size and contrast',
      acceptHighlight: 'Highlight Accept',
      acceptHighlightDesc: 'The accept button stands out over the reject button',
    },
    acceptAllLabel: '"Accept all" text',
    rejectAllLabel: '"Reject all" text',
    customizeLabel: '"Customize" text',
    acceptEssentialLabel: '"Essential only" text',

    // Legal notice section
    legalSection: 'Legal Notice',
    legalDescription: 'Configure the legal notice that will be shown as a modal',
    legalTitle: 'Notice title',
    legalContent: 'Legal notice content',
    legalPlaceholder: 'Write the legal notice here...',
    previewModal: 'Preview Modal',

    // Preview
    preview: 'Preview',
    previewDescription: 'This is how the banner will look with current settings',

    // Actions
    saveChanges: 'Save Changes',
    resetDefaults: 'Reset to Defaults',
    saved: 'Changes saved',
  },
};
