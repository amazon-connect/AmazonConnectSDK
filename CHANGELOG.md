# CHANGELOG.md

## 1.0.8
### Updated
- Updated `@amazon-connect/site-streams` to support ACGR functionality for `AmazonConnectStreams`

## 1.0.7
### Added
  - Initial release of `@amazon-connect/app-controller`, providing the ability to control applications in the workspace
  
## 1.0.6
### Updated
  - `@amazon-connect/contact`
    - `AgentClient`: Fixed issue that may cause errors when invoking `setOffline`
  
## 1.0.5
### Added
  - New APIs to `ContactClient`, `AgentClient` and `VoiceClient`
### Updated
  - Deprecated `getType`,`onDestroyed` and `offDestroyed` from `ContactClient`
  - Deprecated `getDialableCountries` from `AgentClient`
  - Deprecated `getPhoneNumber` from `VoiceClient`

## 1.0.4
### Added
  - Initial release of `@amazon-connect/email`, providing the ability to handle email contacts through the `EmailClient`
  - Initial release of `@amazon-connect/file`, providing the ability to handle attachments through the `FileClient`
  - Initial release of `@amazon-connect/message-template`, providing the ability to work with message templates through the `MessageTemplateClient`
  - Initial release of `@amazon-connect/quick-responses`, providing the ability to search quick responses through the `QuickResponsesClient` 

### Updated
  - `@amazon-connect/contact`
    - `AgentClient`: Fixed AgentState and AgentStateChanged type
  - `@amazon-connect/user`
    - `SettingsClient`: Fixed the getLanguage type and UserLanguageChanged type
  - `@amazon-connect/voice`
    - Renamed `VoiceRequests` enum to `VoiceRoutes`

## 1.0.3
  - Initial release of the `user` module
  - Added onConnected event in the `contact` module

## 1.0.2
  - Initial release of the `contact`, `voice` and `theme` modules

## 1.0.0
  - Initial release of the Amazon Connect SDK, along with the `app`, `core`, and `workspace-types` modules.