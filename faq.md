---
title: ScribeUI - FAQ
layout: default
---

# FAQ

### General Questions

[What is scribe? How do I use it?](#scribe)

[What is the difference between scribe and scribeui?](#difference)

### Installation

[I have mod\_wsgi 3.3 instead of 3.4, will it still work?](#wsgi)

[How do I install mod\_wsgi 3.4 on ubuntu precise or earlier ?](#wsgi-how)

[I am on windows, can I install ScribeUI?](#windows)

### Troubleshooting

[I have segfaults in my Apache error log](#segfaults)

[Sometimes, it looks like a CSS file is not loading](#wsgi-css)

[Sometimes, there is no code displayed in the editor, or the browse tab is broken](#wsgi-css)

[My problem is not listed here, what should I do?](#contact)

## General Questions 

### <a name="scribe"></a> What is scribe? How do I use it?

Scribe is an alternative mapfile syntax, learn how to use it in our guide: [Getting started with Scribe syntax](scribe-syntax.html) 

### <a name="difference"></a> What is the difference between scribe and scribeui?

ScribeUI is a web-based application that help you edit standard mapfiles and scribe maps through a friendly UI featuring an instant preview of the map, points of interest and other functionalities. Scribe is an alternate syntax for mapserver mapfiles that adds new features to make your life easier, while still generating a valid regular mapfile. [Learn more](scribe-syntax.html) 

## Installation 

### <a name="wsgi"></a> I have mod\_wsgi 3.3 instead of 3.4, will it still work?

*For the most part*, yes. However, there is a bug in mod\_wsgi 3.3 which causes some css files to load incorrectly (more info the [issue](https://github.com/mapgears/scribeui/issues/48)). It is an unpredictable bug, which can happen often as it can never happen. It is not recommended to use mod\_wsgi 3.3 or earlier for this reason, especially on a production setup. 

### <a name="wsgi-how"></a> How do I install mod\_wsgi 3.4 on ubuntu precise or earlier ?

As there is no package ready yet, you will have to compile a version of mod\_wsgi. It is fairly easy on ubuntu. Uninstall any previous version of mod\_wsgi you may have. Make sure you have the python-dev, build-essential and apache2-prefork-dev installed, then [download the source](https://code.google.com/p/modwsgi/wiki/DownloadTheSoftware?tm=2) and compiling it is a matter of a few commands: 

    ./configure
    make
    sudo make install

And you must edit scribeui's apache config file, which should be located at /etc/apache2/sites-enabled/ScribeUI.conf and add the path of your mod\_wsgi version, for example:

      LoadModule wsgi_module     /usr/lib/apache2/modules/mod\_wsgi.so

### <a name="windows"></a> I am on windows, can I install ScribeUI?

It's possible, all the required softwares are available for windows. Installation instructions are being worked on! 

## Troubleshooting

### <a name="segfaults"></a> I have segfaults in my Apache error log

Restarting apache should fix the problem. If it doesn't, make sure your version of mod\_wsgi is compiled with the same version of python ScribeUI is running with. 

### <a name="wsgi-css"></a> Sometimes, it looks like a CSS file is not loading, or sometimes, there is no code displayed in the editor, or the browse tab is broken

You are probably running mod\_wsgi 3.3. [Why you should install mod\_wsgi 3.4](#wsgi)

### <a name="contact"></a> My problem is not listed here, what should I do?

Feel free to post your question on the [mapserver-user mailing list](http://www.mapserver.org/community/lists.html) or open a issue on the project's [github](https://github.com/mapgears/scribeui)!
