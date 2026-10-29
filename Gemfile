# CocoaPods is run through Bundler so every machine uses the same gem versions.
# `json` is pinned below 3.0 because json 3.x breaks ActiveSupport 7.2's JSON encoding,
# which Expo's autolinking scripts call during `pod install` (see specs/.../research.md R-19).
source 'https://rubygems.org'

ruby '>= 3.1'

gem 'cocoapods', '~> 1.16'
gem 'activesupport', '~> 7.2', '< 8'
gem 'json', '~> 2.9'
