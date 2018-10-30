# Overview
![alt text](logo.png "SportsDrop")

SportsDrop is a social community based application which allows users to organize and share sports-related events and activities. This is an Angular 1.x and Ionic 1.x Project which can be easily updated to the most recent versions of said frameworks. The intention is to create a starting template for full-stack web/mobile development for people of the community for new-starters and seasoned veterans alike.

The stack is as follows:

FRONT                          

Cordova 8.x                   
AngularJS 1.x.              
Ionic 1.x.                  
HTML5 & CSS

MIDDLE 

NodeJS 7.x              
Express (Latest)

BACK

Apache CouchDB
(NoSQL Database Storage)            

I do assume you have this project setup with the above systems. I have gracefully separated all logic away from the main
business application, so you can easily use your own database model for storage if you wish (SQL, MongoDB).

## Prerequisites

* +-- @angular/cli@6.2.3
* +-- cordova@8.0.0
* +-- eslint@5.7.0
* +-- ionic@3.20.0
* +-- jshint@2.9.6
* -- npm@5.6.0

# Mobile App

/folder/location/sportsdrop_mobile

## Features

* Registration/Sign-up - via Facebook or standard email address
* Event creation - create, search and join sports-related activities
* Event management - edit, delete and rescheduled created activities
* Encrypted messaging - create and manage groups using in-built chat-system
* App customization - change notification tones, messages and color schemes to your liking
* User control - if you wish to longer use SportsDrop, you can always delete your account from within the app

## Usage

Navigate to root folder directory 'sportsdrop_mobile/' and install node_modules:

`npm install --save`

Then to run app inside browser use Angular-cli OR Ionic-cli:

`ng serve`  

OR  

`ionic serve`

# Web Server

/folder/location/sportsdrop_server

This solution assumes you have CouchDB Database installed and configured to the desired ports (default: 5984) and NodeJS-Express. 

*Note: If you wish to run multiple instances of this script (i.e. multiple servers), you can setup a load balancing proxy to cycle requests. I recommend using HAProxy.*

## Features

* Modular Node JS express server
* NoSQL CouchDB Connection configuration file
* SSL/TLS Configuration file for HTTPS Requests
* JWT authentication

## Usage

Navigate to root folder directory 'sportsdrop_server/' and install node_modules:

`npm install --save`

Run web server using node:

`node server.js`

# Website

/folder/location/sportsdrop_web

This contains a starter template for the website; serves as a landing page to promote the mobile application. There is a test site and a live production site contained within the directory tree, which can be interchanged by setting a LiveSite variable inside *server.js*.

## Features

* Download Links
* Contact Us Link
* Instagram Link
* Terms and Conditions

## Usage

Navigate to root folder directory 'sportsdrop_web/' and install node_modules:

`npm install --save`

Run web site using node:

`node server.js`
