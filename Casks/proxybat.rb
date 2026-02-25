cask 'proxybat' do
  arch arm: 'arm64', intel: 'x64'

  version '0.2.3'
  sha256 arm: 'f50bfd3e249382d4819520fd68992e7b9fb7a6439bf5ac90e5ae5451c41d8b9c',
         intel: '0a870649eed58bf729068289bd35fa8e576c11fb1afe12369b1609095de4d5a1'

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
