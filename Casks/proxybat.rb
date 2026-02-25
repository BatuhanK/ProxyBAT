cask 'proxybat' do
  arch arm: 'arm64', intel: 'x64'

  version '0.2.2'
  sha256 arm: 'eb2722ecbcc6068add74c05d8d91629202dc588bca2ad22d83d80e4a3f379c6e',
         intel: 'c18b5322693741cf4b68486bbbc393d697bdc04f21b596a217e04087bff6edac'

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
