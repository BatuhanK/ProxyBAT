cask 'proxybat' do
  version '1.0.0'
  sha256 '39e417aa536c07a697d35e7bb516b22e6be21287924660ca90b767f29623de6b'

  url "https://github.com/batuhank/proxybat/releases/download/v#{version}/ProxyBat-#{version}-arm64.dmg"
  name 'ProxyBat'
  desc 'MITM Proxy with AI Agent Integration'
  homepage 'https://github.com/batuhank/proxybat'

  app 'ProxyBat.app'

  zap trash: [
    '~/Library/Application Support/proxybat',
    '~/Library/Preferences/com.batuhank.proxybat.plist',
    '~/Library/Saved Application State/com.batuhank.proxybat.savedState'
  ]
end
