export const LOGIN_TYPE = {
  MOBILENO: 1,
  GOOGLE: 2,
  APPLE: 3,
  EMAIL_PASSWORD: 4
}

export const CHAT_TYPE = {
  SELLING: 1,
  BUYING: 2
}

export const MESSAGE_TYPE = {
  MESSAGE: 1,
  IMAGE: 2,
  AUDIO: 3,
  VIDEO_CALL: 4,
  ADS: 5
}

export const CALL_TYPE = {
  RECEIVED: 1,
  DECLINED: 2,
  MISCALLED: 3
}

export const VERIFICATION_STATUS = {
  PENDING: 1,
  ACCEPTED: 2,
  DECLINED: 3
}

export const AD_LISTING_TYPE = {
  1: 'UNDER_REVIEW',
  2: 'LIVE', //Live
  3: 'PERMANENT_REJECTED', //Don't Right To Rebubmit The Ads
  4: 'SOFT_REJECTED', //Right To Rebubmit The Ads
  5: 'FEATURED', //If Feature Plan Purchased
  6: 'DEACTIVATE',
  7: 'SOLD_OUT',
  8: 'RESUBMITTED',
  9: 'EXPIRED'
}

export const AD_LISTING_TYPE_COLOR = {
  1: 'info', // UNDER_REVIEW
  2: 'success', // APPROVED (Live)
  3: 'error', // PERMANENT_REJECTED
  4: 'warning', // SOFT_REJECTED
  5: 'primary', // FEATURED
  6: 'secondary', // DEACTIVATED
  7: '#9c27b0', // SOLD_OUT (Purple)
  8: '#009688', // RESUBMITTED (Teal)
  9: '#607d8b' // EXPIRED (Blue Grey)
}

export const AD_LISTING_SALE_TYPE_COLOR = {
  1: 'info', // UNDER_REVIEW
  2: 'success', // APPROVED (Live)
  3: 'error', // PERMANENT_REJECTED
  4: 'warning', // SOFT_REJECTED
  5: 'primary', // FEATURED
  6: 'secondary', // DEACTIVATED
  7: '#9c27b0', // SOLD_OUT (Purple)
  8: '#009688', // RESUBMITTED (Teal)
  9: '#607d8b' // EXPIRED (Blue Grey)
}

export const AD_REVIEW_STATUS = {
  1: 'UNDER_REVIEW',
  2: 'APPROVED',
  4: 'SOFT_REJECTED',
  3: 'PERMANENT_REJECTED'
}

export const SALE_TYPE = {
  1: 'BUY_NOW',
  2: 'AUCTION',
  3: 'NOT_FOR_SALE'
}

export const REPORT_STATUS = {
  PENDING: 1,
  SOLVED: 2
}

export const REPORT_TYPE = {
  AD: 1,
  USER: 2
}

export const FIELD_TYPE_MAP = {
  1: 'Number',
  2: 'Text',
  3: 'File',
  4: 'Radio',
  5: 'Dropdown',
  6: 'Checkboxes'
}

export const NO_PERMISSION = "You don't have permission to perform this action"

export const modulesConfig = {
  HOME: [{ name: 'Dashboard', href: '/dashboard', icon: 'tabler-layout-dashboard' }],
  'CUSTOMER MANAGEMENT': [
    { name: 'User', href: '/user', icon: 'tabler-user', activeUrl: '/user', exactMatch: false },
    { name: 'Verification', href: '/verify-sellers', icon: 'tabler-shield-star', exactMatch: true }
  ],

  'CATEGORY MANAGEMENT': [
    { name: 'Categories', href: '/categories', icon: 'tabler-list-details', exactMatch: true },
    { name: 'Attributes', href: '/attributes', icon: 'tabler-list', exactMatch: true }
  ],
  'ADVERTISEMENT MANAGEMENT': [
    {
      name: 'Ads Listing',
      href: '/live-ads',
      icon: 'tabler-list-details',
      activeUrl: '/live-ads',
      exactMatch: false
    },
    { name: 'Pending Ads', href: '/pending-ads', icon: 'tabler-clock', exactMatch: true },
    { name: 'Tip', href: '/tip', icon: 'tabler-direction-arrows', exactMatch: true },
    { name: 'Ad Video', href: '/ad-video', icon: 'tabler-video' }
  ],
  'PACKAGE MANAGEMENT': [
    { name: 'Subscription Plan', href: '/subscription-plan', icon: 'tabler-play-card-1', exactMatch: true },
    { name: 'Purchase History', href: '/purchase-history', icon: 'tabler-library', exactMatch: true },
    { name: 'Feature Advertisement', href: '/featuread', icon: 'tabler-layout-dashboard', exactMatch: true }
  ],
  'STAFF MANAGEMENT': [
    { name: 'Access Roles', href: '/roles', icon: 'tabler-shield-lock', exactMatch: true },
    { name: 'Staff', href: '/team', icon: 'tabler-user-cog', exactMatch: true }
  ],
  'HOME SCREEN MANAGEMENT': [
    { name: 'Banners', href: '/banners', icon: 'tabler-slideshow', exactMatch: true },
    { name: 'Review', href: '/review', icon: 'tabler-message-user', exactMatch: true },
    { name: 'Verification Fields', href: '/kyc-fields', icon: 'tabler-layout', exactMatch: true }
  ],
  'LOCATION MANAGEMENT': [
    { name: 'Nations', href: '/countries', icon: 'tabler-world', exactMatch: true },
    { name: 'States', href: '/states', icon: 'tabler-map', exactMatch: true },
    { name: 'Cities', href: '/cities', icon: 'tabler-flare', exactMatch: true }
  ],
  REPORTS: [
    { name: 'Report', href: '/report', icon: 'tabler-file-description', exactMatch: true },
    { name: 'Report Reason', href: '/report-reason', icon: 'tabler-file-type-doc', exactMatch: true }
  ],
  NOTIFICATIONS: [{ name: 'Send Notification', href: '/notification', icon: 'tabler-bell', exactMatch: true }],
  BLOG: [{ name: 'Articles', href: '/articles', icon: 'tabler-pencil', exactMatch: true }],
  FAQ: [{ name: 'Help Center', href: '/help', icon: 'tabler-question-mark', exactMatch: true }],
  SETTINGS: [
    { name: 'Setting', href: '/configuration', icon: 'tabler-settings-cog', exactMatch: true },
    // { name: 'Updates', href: '/updates', icon: 'tabler-refresh', exactMatch: true },
    { name: 'Profile', href: '/profile', icon: 'tabler-user-circle', exactMatch: true }
  ]
}
