// config/settings.config.js

/**
 * ============================================================================
 * SETTINGS CONFIGURATION
 * ============================================================================
 */

// All setting categories
export const SETTING_CATEGORIES = {
  GENERAL: 'general',
  FOOTER: 'footer',
  LAYOUT: 'layout',
  PAYMENT: 'payment',
  SOCIAL: 'social',
  ADDTHIS_DISQUS: 'addthis_disqus',
  ABOUT: 'about',
  CONTACT: 'contact',
  OTHER: 'other'
};

// Settings that can update .env file
export const ENV_SETTINGS = [
  'google_map_key',
  'recaptcha_key',
  'recaptcha_secret',
  'stripe_key',
  'stripe_secret',
  'paypal_email',
  'paypal_client_id',
  'paypal_secret'
];

// Default settings structure
export const DEFAULT_SETTINGS = {
  // ==================== GENERAL ====================
  general: {
    logo: '',
    favicon: '',
    site_name: 'My Property Site',
    site_email: 'info@example.com',
    currency_sign: 'AED',
    google_map_key: '',
    recaptcha_key: '',
    recaptcha_secret: '',
    site_description: '',
    site_keywords: ''
  },

  // ==================== FOOTER ====================
  footer: {
    newsletter_enable: true,
    address_enable: true,
    address_text: '',
    telephone_enable: true,
    telephone_text: '',
    footer_text: '',
    copyright_text: '© 2024 All Rights Reserved',
    widget_col1_enable: true,
    widget_col1_heading: '',
    widget_col1_content: '',
    widget_col2_enable: true,
    widget_col2_heading: '',
    widget_col2_content: '',
    widget_col3_enable: true,
    widget_col3_heading: '',
    widget_col3_content: '',
    widget_col4_enable: true,
    widget_col4_heading: 'Footer Bottom Links',
    widget_col4_content: ''
  },

  // ==================== LAYOUT ====================
  layout: {
    title_bg_image: '',
    default_map_latitude: '25.2048',
    default_map_longitude: '55.2708',
    home_page: 'default',
    properties_page: 'default',
    featured_properties_page: 'default',
    sale_properties_page: 'default',
    rent_properties_page: 'default',
    pagination_limit: 10
  },

  // ==================== PAYMENT ====================
  payment: {
    featured_property_price: '0',
    stripe_currency: 'AED',
    stripe_key: '',
    stripe_secret: '',
    paypal_email: '',
    paypal_client_id: '',
    paypal_secret: '',
    bank_payment_details: ''
  },

  // ==================== SOCIAL MEDIA ====================
  social: {
    facebook_url: '',
    twitter_url: '',
    linkedin_url: '',
    gplus_url: '',
    instagram_url: '',
    youtube_url: ''
  },

  // ==================== ADDTHIS & DISQUS ====================
  addthis_disqus: {
    addthis_code: '',
    disqus_code: ''
  },

  // ==================== ABOUT US ====================
  about: {
    about_title: 'About Us',
    about_description: ''
  },

  // ==================== CONTACT US ====================
  contact: {
    contact_title: 'Contact Us',
    contact_map_latitude: '25.2048',
    contact_map_longitude: '55.2708',
    contact_email: '',
    contact_phone: '',
    contact_address: ''
  },

  // ==================== OTHER SETTINGS ====================
  other: {
    maintenance_mode: false,
    user_registration: true,
    email_verification: true,
    header_code: '',
    footer_code: '',
    items_per_page: 10
  }
};

export default {
  SETTING_CATEGORIES,
  ENV_SETTINGS,
  DEFAULT_SETTINGS
};