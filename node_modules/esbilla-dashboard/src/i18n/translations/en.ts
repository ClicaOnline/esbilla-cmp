// English
import type { Translations } from './ast';

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
};
