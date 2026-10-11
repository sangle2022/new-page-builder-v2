// Kite design tokens for the app shell (Ant Design). Brand colour #004AAD,
// neutrals and type from the Kite reference: Geist for UI text, Inter Tight
// for headings, Geist Mono for numbers.
export const BRAND = '#004AAD';
export const APP_NAME = 'Kite';

export const FONT_UI = "Geist, 'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif";
export const FONT_HEADING = "'Inter Tight', Geist, -apple-system, 'Segoe UI', sans-serif";

export const antTheme = {
  token: {
    colorPrimary: BRAND,
    colorInfo: BRAND,
    colorLink: BRAND,
    colorSuccess: '#16A34A',
    colorWarning: '#D97706',
    colorError: '#DC2626',
    colorText: '#161A23',
    colorTextSecondary: '#5C6475',
    colorTextTertiary: '#8B93A3',
    colorBorder: '#DFE3EA',
    colorBorderSecondary: '#ECEEF2',
    colorBgLayout: '#F6F7F9',
    colorFillAlter: '#F8F9FB',
    fontFamily: FONT_UI,
    fontSize: 14,
    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 7,
    controlHeight: 36,
    boxShadowTertiary: '0 1px 2px rgba(16,24,40,.04)',
    wireframe: false,
  },
  components: {
    Layout: { siderBg: '#0A1226', headerBg: '#FFFFFF', headerHeight: 60, headerPadding: '0 24px', bodyBg: '#F6F7F9' },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemColor: '#8EA0C8',
      darkItemHoverColor: '#FFFFFF',
      darkItemHoverBg: 'rgba(255,255,255,0.06)',
      darkItemSelectedBg: '#004AAD',
      darkItemSelectedColor: '#FFFFFF',
      itemBg: 'transparent',
      itemColor: '#4E5565',
      itemHoverBg: '#F2F4F7',
      itemHoverColor: '#161A23',
      itemSelectedBg: '#EAF1FB',
      itemSelectedColor: BRAND,
      itemBorderRadius: 8,
      itemHeight: 38,
      itemMarginInline: 10,
      iconSize: 16,
      activeBarBorderWidth: 0,
    },
    Card: { paddingLG: 22, headerFontSize: 15 },
    Table: { headerBg: '#F8F9FB', headerColor: '#5C6475', headerSplitColor: 'transparent', rowHoverBg: '#F8FAFD', cellPaddingBlock: 13 },
    Button: { fontWeight: 500, primaryShadow: '0 1px 2px rgba(0,74,173,.25)', defaultShadow: 'none' },
    Segmented: { itemSelectedBg: '#FFFFFF', trackBg: '#EEF0F4' },
    Tag: { defaultBg: '#F2F4F7', defaultColor: '#4E5565' },
    Statistic: { titleFontSize: 13, contentFontSize: 26 },
    Modal: { titleFontSize: 17 },
    Tabs: { titleFontSize: 14 },
  },
};

export const STATUS_COLORS = {
  Draft: 'default',
  'Pending Approval': 'gold',
  Approved: 'cyan',
  Rejected: 'red',
  Published: 'green',
  Unpublished: 'purple',
};

export const LEAD_STATUS_COLORS = {
  New: 'blue',
  Contacted: 'gold',
  Qualified: 'cyan',
  Converted: 'green',
  Lost: 'default',
};

export const CRM_COLORS = { Synced: 'green', Failed: 'red', Pending: 'gold', Skipped: 'default' };
