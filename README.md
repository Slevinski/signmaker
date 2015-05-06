SignMaker
=====================
- - - 
> Version 1.0  
May 6th, 2015

Write signs in any sign language with the SignWriting script using the [SignWriting 2010 Fonts]. 

- - - 
## About
SignMaker is a standards based editor, utilizing HTML, CSS, JavaScript, SVG, TrueType Fonts, and PNG images.  

SignMaker is browser based without the need for a server connection.  It can be used online or it can be [downloaded][Download] and run directly from the user's computer.

The primary online website can be used to create a private dictionary in the browser's LocalStorage or view dozens of sign language dictionaries from around the world.
* http://signbank.org/signmaker.html

The secondary online website can be used to create a private dictionary in the browser's LocalStorage.
* http://slevinski.github.io/signmaker

- - -
## Features
* TrueType fonts
* Multilingual user interface
* Symbol Palette access to the entire International SignWriting Alphabet 2010
* Drag and Drop sign construction 
* Integrated dictionary with searching support for both spoken and signed languages
* Supports SVG and PNG images
* Available online
* Download and open in any browser
* MIT License
 
- - -
## Installation
 1. [Download] source code in zip file.
 2. Unzip source code on your computer.
 3. Open the index.html file in a browser.

- - -
## Help and Documentation
Help and documentation is available online: http://signbank.org/signmaker.html

Consider joining the [SignWriting List] for email discussion with writers from around the world.

If you wish to participate in SignMaker development, you can submit patches, fixes and new features through GitHub.  Questions, feedback, and ideas regarding SignMaker can be sent to slevin@signpuddle.net.

- - -
## Customization
SignMaker is highly customizable.  The `config` directory contains configuration files that can customize the interface, data, and functionality of SignMaker.

### Messages
The text file `messages.js` contains a list of configurable messages for the various user interface languages.

    var messages = {
        en: {
            language: 'English',
            signmaker: 'SignMaker',
 
### Keyboard
The text file `keyboard.js` contains a list of configurable keyboard actions that can be tailored for the various keyboards.

    var keyboard = {
        left10: [37,'shiftKey'],
        left: [37],

### Alphabet
The text file `alphabet.js` contains a list of configurable group of symbols keys that controls the arrangement of the symbol palette.  The files contains the entire ISWA 2010 as arranged by Valerie Sutton.

    window.alphabet = {
        S10000: ["S10000", "S10110", ...
        S10e00: ["S10e00", "S10f10", ...

The `alphabet` subdirectory can contain language specific subsets of the ISWA 2010.  Subsets are based on sign language dictionaries of [SignPuddle Online][sp-org], recreated daily.  Subsets are [available on SignBank][sb-alphabet].  Download the desired alphabet subsets and place in the `alphabet` subdirectory.

### Dictionary
The text file `dictionary.js` is a multi-line file, with one dictionary entry per line.  Each line starts with a Formal SignWriting  string, followed by one or more spoken language terms, separated by tabs.

    window.dict = "";
    dict += "AS14c20S27106M518x529S14c20481x471S27106503x489	hello\n";
    dict += "M522x551S18711488x449S18719495x479S2e800507x504S2e818479x518S20500493x473S2fb04498x545    world    globe\n";

The `dictionary` subdirectory can contain language specific dictionaries.  Dictionaries are custom export of the sign language dictionaries of [SignPuddle Online], recreated daily.  Dictionaries are [available on SignBank][sb-dictionary].  Download the desired dictionaries and place in the `dictionary` subdirectory.

- - -
## Support Libraries
The `lib` directory contains several JavaScript support libraries.

### SignWriting 2010 JavaScript Library
> sw10.min.js 

The [SignWriting 2010 JavaScript Library] provides support for SignWriting images and queries.  Released under the MIT License, the library includes a guide, API documentation, and testing suite.

### Draggabilly
> draggabilly.min.js 

[Draggabilly] provides cross-browser dragging functionality.  Released under the MIT License, the library includes documentation, demo page, and testing suite.

### Mithril
> mithril.min.js 

[Mithril] is a client-side MVC framework - a tool to organize code in a way that is easy to think about and to maintain.  Released under the MIT License, the library includes documentation, tutorials, and testing suite.

### Translate
> translate.min.js  

[Translate] is a translations (i18n) library with support for placeholders and multiple plural forms.  Released under the MIT License, the library includes documentation and examples.

- - -
## Author

Stephen E Slevinski Jr  
slevin@signpuddle.net  
http://signpuddle.net  
http://signpuddle.com  

- - -
## Special Thanks
Valerie Sutton (http://signwriting.org)

- - - 

## Reference
The Formal SignWriting character encoding used in SignMaker is defined in an Internet Draft submitted to the IETF: [draft-slevinski-signwriting-text].
The document is improved and resubmitted every 6 months.
The character design has been stable since January 12, 2012.
The current version of the Internet Draft is 05.
The next version is planned for November 2015.

- - -

## Epilogue
This is a work in progress. Feedback, bug reports, and patches are welcomed.

- - -

## License
MIT

- - -
## To Do
* iPhone and iPod customizations for smaller screens

- - - 

## Version History
* 1.0 - May 6th, 2015: initial release

[draft-slevinski-signwriting-text]: http://tools.ietf.org/html/draft-slevinski-signwriting-text
[SignWriting 2010 Fonts]: https://github.com/Slevinski/signwriting_2010_fonts
[SignWriting List]: http://www.signwriting.org/forums/swlist/
[SignPuddle Online]: http://signpuddle.org
[sb-alphabet]: http://signbank.org/signmaker/config/alphabet
[sb-dictionary]: http://signbank.org/signmaker/config/dictionary
[SignWriting 2010 JavaScript Library]: http://slevinski.github.io/sw10js/
[MIT]: http://www.opensource.org/licenses/mit-license.php
[Draggabilly]: http://draggabilly.desandro.com/
[Mithril]: https://lhorie.github.io/mithril/
[Translate]: https://github.com/musterknabe/translate.js
[Download]: https://github.com/Slevinski/signmaker/archive/gh-pages.zip