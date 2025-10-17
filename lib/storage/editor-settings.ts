const EDITOR_SETTINGS_KEY = 'cubad-editor-settings'

export interface EditorSettings {
  vimMode: boolean
}

const DEFAULT_SETTINGS: EditorSettings = {
  vimMode: false,
}

export function getEditorSettings(): EditorSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS
  }

  try {
    const stored = localStorage.getItem(EDITOR_SETTINGS_KEY)
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    }
  } catch (error) {
    console.error('Failed to load editor settings:', error)
  }

  return DEFAULT_SETTINGS
}

export function saveEditorSettings(settings: EditorSettings): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(EDITOR_SETTINGS_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save editor settings:', error)
  }
}

export function toggleVimMode(): boolean {
  const settings = getEditorSettings()
  const newVimMode = !settings.vimMode
  saveEditorSettings({ ...settings, vimMode: newVimMode })
  return newVimMode
}
