export const colors = {
  background: '#1a1a2e',
  surface: '#16213e',
  surfaceLight: '#0f3460',
  gold: '#ffd200',
  teal: '#4ECDC4',
  red: '#FF6B6B',
  purple: '#6C5CE7',
  yellow: '#FFD93D',
  text: '#fff',
  textSecondary: '#aaa',
  textMuted: '#666',
  error: '#e94560',
};

export const typography = {
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#aaa', fontSize: 14, fontWeight: '600' },
  balance: { color: '#4ECDC4', fontSize: 15, fontWeight: '700' },
  heading: { color: '#fff', fontSize: 18, fontWeight: '800' },
  body: { color: '#aaa', fontSize: 13 },
  small: { color: '#666', fontSize: 11 },
  button: { fontWeight: '800', fontSize: 15 },
  bigNumber: { color: '#ffd200', fontSize: 32, fontWeight: '800' },
};

export const layout = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 12,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
  },
  potCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
};

export const buttons = {
  primary: {
    backgroundColor: colors.gold,
    padding: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  primaryText: {
    color: colors.background,
    fontWeight: '800',
    fontSize: 16,
  },
  secondary: {
    backgroundColor: colors.teal,
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  secondaryText: {
    color: colors.background,
    fontWeight: '800',
    fontSize: 14,
  },
  outline: {
    backgroundColor: colors.surfaceLight,
    padding: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  outlineText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  danger: {
    backgroundColor: colors.error,
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  dangerText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  quickBtn: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  quickBtnText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 13,
  },
};

export const inputs = {
  default: {
    backgroundColor: colors.surfaceLight,
    color: colors.text,
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#1a1a40',
  },
  betInput: {
    backgroundColor: colors.surfaceLight,
    color: colors.gold,
    padding: 10,
    borderRadius: 10,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: colors.teal,
  },
};

export const toast = {
  container: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    backgroundColor: colors.gold,
    padding: 10,
    borderRadius: 10,
    zIndex: 100,
    alignItems: 'center',
  },
  text: {
    color: colors.background,
    fontWeight: '800',
    fontSize: 13,
  },
};