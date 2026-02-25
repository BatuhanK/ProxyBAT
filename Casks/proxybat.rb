cask 'proxybat' do
  arch arm: 'arm64', intel: 'x64'

  version '0.2.3'
  sha256 arm: 'PLACEHOLDER_ARM64_SHA256',
         intel: 'PLACEHOLDER_INTEL_SHA256'

  url "https://github.com/batuhank/proxybat/releases/download/v#{version}/ProxyBat-#{version}#{arch == 'arm64' ? '-arm64' : ''}.dmg"
  name 'ProxyBat'
  desc 'MITM Proxy with AI Agent Integration'
  homepage 'https://github.com/batuhank/proxybat'

  livecheck do
    url :url
    strategy :github_latest
  end

  app 'ProxyBat.app'

  zap trash: [
    '~/Library/Application Support/proxybat',
    '~/Library/Preferences/com.batuhank.proxybat.plist',
    '~/Library/Saved Application State/com.batuhank.proxybat.savedState'
  ]
end
