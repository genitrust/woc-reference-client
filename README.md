# WOC Reference Client Setup

## Installation

Simply clone or download this repository and open the `index.html` file!


## Designated API Endpoints

Your production server should use this API endpoint:

> https://wallofcoins.com

For example:

> https://wallofcoins.com/api/v1/banks/

Use the sandbox server for your developmental and testing purposes:

> https://woc.reference.genitrust.com

This server also supports the non-secure HTTP protocol by specifying `http` instead of `https`.


## Notes about the Sandbox Server

Here are the main differences between the API live production server endpoint and the API's sandbox endpoint.

* All advertisements have test net addresses -- these may only receive test net coins!
* Orders on the sandbox server are never fulfilled! They will not automatically reach the "Done - Units Delivered" ("SENT") status.


# API Documentation

...will go here.


# Web Widget

For information about testing and deploying the Web Widget, visit our [API Integration Chat Room](https://www.hipchat.com/gJdsALg1V).


# Other Resources

* All code contributions to this documentation and the Reference Clients themselves is warmly welcomed and greatly appreciated! Visit our [Github Page](https://github.com/genitrust/woc-reference-client).
* The [API Integration Chat Room](https://www.hipchat.com/gJdsALg1V) is available publicly and designated for discussion on the Wall of Coins API.
* [Markdown Syntax](https://guides.github.com/features/mastering-markdown/) used for this document.
