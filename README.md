# Overview

SportsDrop is a social community based application which allows users to organize and share sports-related events and activities

# Mobile App

/folder/location/sportsdrop_client

## Features

* Registration/Sign-up - via Facebook or standard email address
* Event creation - create, search and join sports-related activities
* Event management - edit, delete and rescheduled created activities
* Encrypted messaging - create and manage groups using in-built chat-system
* App customization - change notification tones, messages and color schemes to your liking
* User control - if you wish to longer use SportsDrop, you can always delete your account from within the app

# Web Server

/folder/location/sportsdrop_server

This solution assumes you have CouchDB Database installed and configured to the desired ports (default: 5984) and NodeJS. 

*Note: If you wish to run multiple instances of this script (i.e. multiple servers), you can setup a load balancing proxy to cycle requests. I recommend using HAProxy.*

## Features

* Modular Node JS express server
* NoSQL CouchDB Connection configuration file
* SSL/TLS Configuration file for HTTPS Requests
* JWT authentication

# Website

/folder/location/sportsdrop_www

This contains a starter template for the website; serves as a landing page to promote the mobile application. There is a test site and a live production site contained within the directory tree, which can be interchanged by setting a LiveSite variable inside *server.js*.

## Features

* Download Links
* Contact Us Link
* Instagram Link
* Terms and Conditions