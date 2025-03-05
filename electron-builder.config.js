/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const path = require('path')

module.exports = {
  extends: null,
  directories: {
    output: 'release',
    buildResources: 'resources'
  },
  files: [
    'dist/**/*',
    'electron/**/*',
    'resources/**/*'
  ],
  extraMetadata: {
    main: 'electron/main.cjs'
  },
  artifactName: '${productName}-${version}-${platform}-${arch}.${ext}',
  mac: {
    icon: 'resources/icons/icon.icns',
    category: 'public.app-category.productivity',
    target: ['dmg', 'zip'],
    electronDist: 'dist',
    darkModeSupport: true,
    extendInfo: {
      CFBundleIconFile: 'icon.icns',
      NSHighResolutionCapable: true,
      LSEnvironment: {
        ELECTRON_ICON_SIZE: '128'
      }
    }
  },
  win: {
    icon: 'resources/icons/icon.ico',
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ]
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    installerIcon: 'resources/icons/icon.ico',
    uninstallerIcon: 'resources/icons/icon.ico',
    installerHeaderIcon: 'resources/icons/icon.ico',
    createStartMenuShortcut: true,
    shortcutName: 'MD Desktop'
  },
  asar: true
} 