# LiveApp Backend 
NodeJS + MongoDB + AWS S3

## Project
During the pandemic, live streams by famous artists became increasingly popular. Since people couldn’t leave their homes, these online events served as a form of free entertainment. However, despite the large number of daily live streams, there was no centralized schedule to organize them — which led many people to miss shows they would have liked to watch.

This repository contains the backend of LiveApp, an application I created to solve that problem. In addition to the backend, I also developed the iOS app, which was available on the App Store.

As the number of live streams gradually decreased and maintaining the project required significant time and effort, I eventually decided to remove the app from the store.

## Generate API
$ apidoc -i src/app/controllers -o src/apidocs/
