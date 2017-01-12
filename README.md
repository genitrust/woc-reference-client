# WOC Reference Client Setup

## Installation

Simply clone or download this repository and open the `index.html` file!


## Designated API Endpoints

Your production server should use this API endpoint:

> https://wallofcoins.com

A couple examples:

> https://wallofcoins.com/api/v1/currency/
> https://wallofcoins.com/api/public/v1/ticker/BTC/USD/?raw=1

Use the sandbox server for your developmental and testing purposes:

> https://woc.reference.genitrust.com

This server also supports the non-secure HTTP protocol by specifying `http` instead of `https`.


## Notes about the Sandbox Server

Here are the main differences between the API live production server endpoint and the API's sandbox endpoint.

* All advertisements have test net addresses -- these may only receive test net coins!
* Orders on the sandbox server are never fulfilled! They will not automatically reach the "Done - Units Delivered" ("SENT") status.


# API Documentation

## API Credentials for API Developers

No credentials are necessary! You are free to use the API. To be eligible for commission payments, at the current moment you will need to request a `Publisher ID` from our team. Email [publishers@wallofcoins.com](mailto:publishers@wallofcoins.com) to request a `Publisher ID`.

## Authentication API (End User)

### Creating Credentials for the End User

Credentials are created once the end user first creates an Advertisement for Selling Bitcoin or makes a Buy order to obtain bitcoin. When you create the end user's Order or Advertisement, in the API call you must specify the end user's `deviceName` and `deviceCode`.

* `deviceName` can be anything that the end user identifies your application, service, or company as. For example, Airbitz wallet can use the `deviceName` "Airbitz" or "Airbitz Wallet", etc. Should the end user ever come to the Wall of Coins website, they will be alerted that they have already registered through `deviceName`.
* `deviceCode` must be at least 30 random characters--any characters can be used! It is advised that you use device entropy to randomize the string, or a SHA hash salted with your own specific unique information (per device installation).

Other tips on how to treat the `deviceCode`:
* Once you have generated a `deviceCode`, save and encrypt it locally. You should also save and encrypt the end user's phone number as well, as this is required to obtain the Authorization Token later. It is better than asking the end user every time for their phone number!
* Once you've created the device while creating the end user's first Order (or Advertisement), the system will have an active authorization token in the response.
* The authorization tokens are set in your app's request header as `X-Coins-Api-Token`.
* These tokens expire in 3 hours, where you will need to authenticate the device to Obtain an Authorization Token. More information below.
* For all of your requests that use the `X-Coins-Api-Token`, you need to check for the response status 403 (Forbidden) indicating that the Authorization token has expired.

### Return Users - Obtaining an Authorization Token

To obtain an Authorization token, you need the end user's phone number and the locally-stored `deviceCode`. The phone number must include the country code.

```
POST /api/v1/auth/15005550006/authorize/

{
    “deviceCode”: “aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa”
}
```

Response:

```
{
    "phone": "15005550006",
    "token": "ZGV2aWNlOjI6MTQyMTU5OTE0MXw0Nzc5NDFlMDdlNWEwMmJjZWFlZWJhNmUxZmZkZTE3ZTE3NmM3NWY4",
    "authSource": "device",
    "tokenExpiresAt": "2015-01-18T16:39:01.624Z"
}
```


## Selling API - Liquidation, Cash for Coins, Remittance Receiver

### GET /api/v1/banks

Useful for getting a list of ALL PAYMENT DESTINATIONS. Institutional banking centers are typically used as the end user's cash account, as users want to send bitcoin to their bank account. However, this API will specifically list all payment destinations available for the end user seller to use.

Get parameter option:
* `?country=xx` - where xx is the 2-character lowercase country code. Example: `/api/v1/banks?country=us`

Bank API endpoints:
* GET /api/v1/banks/
* GET /api/v1/banks/{id}/
* GET /api/v1/banks?country=xx

**TODO:** get an example of a "legacy" payment center (USA banking institution) and payment centers with "payFields".

### GET /api/v1/markets

These markets are necessary for setting dynamic pricing on an advertisement!

Endpoints:
* GET /api/v1/markets/CRYPTO/FIAT/
* GET /api/v1/markets/CRYPTO/FIAT/{id}

Notes:
* CRYPTO is the crypto currency. Only choices are DASH (Dash) and BTC (Bitcoin).
* FIAT is the fiat currency.
* GET /api/v1/markets/ -- by default, this will show the markets for the BTC <-> USD. (BTC is default Crypto. USD is default Fiat.)
* GET /api/v1/markets/DASH/ -- by default, this will show the markets for DASH <-> USD. (USD is default Fiat)

Example Responses:

```
Request: GET http://woc.reference.genitrust.com/api/v1/markets/DASH/USD/

Response:
[
  {
    "id": 22,
    "domain": "exmo.com",
    "crypto": "DASH",
    "fiat": "USD",
    "url": "https://api.exmo.com/v1/ticker/",
    "price": "9.20",
    "priceUnits": "100.00",
    "lastUpdated": "2016-12-15T07:09:41Z",
    "online": true,
    "label": "EXMO"
  },
  {
    "id": 23,
    "domain": "btc-e.com",
    "crypto": "DASH",
    "fiat": "USD",
    "url": "https://btc-e.com/api/3/ticker/dsh_usd",
    "price": "9.05",
    "priceUnits": "100.00",
    "lastUpdated": "2016-12-15T07:11:29Z",
    "online": true,
    "label": "BTC-e"
  }
]
```

### GET /api/v1/currency

Response:

```
[
  {
    "code": "USD",
    "name": "US Dollar",
    "symbol": "$"
  },
  {
    "code": "PHP",
    "name": "Philippine Peso",
    "symbol": "\u20b1"
  },
  {
    "code": "PLD",
    "name": "Polish Zloty",
    "symbol": "z\u0142"
  }
]
```

### POST /api/adcreate/

Parameters:
* phone: phone number without the country code
* email: where to receive emails RELEVANT about this advertisement specifically.
* name: the "name on account"
* phoneCode: the phone's country code
* bankBusiness: payment center ID retrieved from /api/v1/banks
* number: bank account number
* number2: confirmation of the bank account number
* sellCrypto: crypto code... "BTC" or "DASH".
* currentPrice: the advertisement's current price. if you set a static price, this value will always remain the same until you change it using the updateAdRate API call.
* account_id: the internal WOC service id of the end user's cash account (bank account / remittance receiving account / etc). This is specified when the buyer's payment destination will go into a cash account that already exists on the system--the end user has already submitted/created this account!

DEVELOPER NOTE: What about device registration?

#### Device Registration

If you have not already obtained a device token with the `deviceCode` your software generated and stored locally, the Authorization API section (above) documents how to retrieve a token. If you do not have your `deviceCode` saved locally, then you must create a new device with the `POST /api/adcreate/` call by specifying the new device parameters. This will create the end user's first coin-selling advertisement as well register their device for access to the end user's advertisements. Device's act as the end user's means of "authentication" without the encumbrance of having to provide credentials for yet another service.

Parameters required when the API developer wishes to register a new device for the end user:
* `deviceName`: the identity label for the end user. For example, "Airbitz Wallet" or "Bitcoin.com"
* `deviceCode`: a random 30-character secret password that is only stored locally on the registered device and not visible/known to the end user.

If the selected `bankBusiness` (end user's institutionally-registered cash account) has `payFields`, then those payment fields must be submitted to the `POST /api/adcreate/` endpoint. An example of this can be found within the WOC Reference Client for Selling.

If the end user wishes to use dynamic pricing, rather than keeping a static order book price for their coins, then you must supply the dynamic pricing parameters. Those can also be found in the WOC Reference Client for Selling.

#### Status 200: Success (Ad with NO PAYFIELDS)

When you are not using PayFields, you are specifying to create a "legacy bank" account as the cash account for the end user. A "legacy bank" is defined as a bank where the only information necessary to make a payment (to the end user seller) is the seller's Name on Account (`name` parameter) and Account Number (`number` and `number2` parameter). The parameters `number` and `number2` must be identical, as `number2` is the field that confirms that the seller's "Account Number" is correct.

Example Request:

```
HEADER X-Coins-Api-Token: YXV0aDoxMjc4NzoxNDgzNTcyMDc4fDFhN2IyMmE3MDRmNDg4ZDQwMTEyYTBkNDI5NTc2NjAyZjY5MWZiYmI=
                        
POST http://woc.reference.genitrust.com/api/adcreate/

{
  "phone": "9412575725",
  "email": "demo@geni.to",
  "name": "Demo User",
  "phoneCode": "1",
  "bankBusiness": "22",
  "number": "1234 5678 90",
  "number2": "1234 5678 90",
  "sellCrypto": "DASH",
  "currentPrice": "10"
}
```

Response:

```
{
  "createdIp": "173.163.220.134",
  "userEnabled": true,
  "account_id": 711,
  "primaryMarket": null,
  "minPayment": 0,
  "currentPrice": "10",
  "totalReceived": 0,
  "id": 862,
  "dynamicPrice": false,
  "publicBalance": 0,
  "secondaryMarket": null,
  "fee": null,
  "verified": false,
  "sellCrypto": "DASH",
  "success": true,
  "maxPayment": 0,
  "buyCurrency": "USD",
  "published": false,
  "onHold": 0
}
```


Notes:
* publicBalance: Wall of Coins' advertisement balance that is available to be withdrawn or purchased.
* onHold: the total amount of coins that have been held for orders -- this includes all past orders and all orders currently pending for settlement.
* id: the advertisement's internal ID.
* what is "fee"?
* userEnabled: whether or not you have the advertisement enabled.
* published: whether or not the advertisement is serving and can have its coins purchased from buyers.
* minPayment: the minimum cash payment that you will accept from buyers.
* maxPayment: the maximum cash payment you'll accept from buyers.

#### Status 200: Success (Ad with PayFields)

Notice that "usePayFields" must be true, not "true" (string) or "1" or 1.

```
HEADER X-Coins-Api-Token: YXV0aDoxMjc4NzoxNDgzNTcyMDc4fDFhN2IyMmE3MDRmNDg4ZDQwMTEyYTBkNDI5NTc2NjAyZjY5MWZiYmI=

POST http://woc.reference.genitrust.com/api/adcreate/
{
  "phone": "9412436496",
  "email": "demo@geni.to",
  "phoneCode": "1",
  "bankBusiness": "30",
  "sellCrypto": "DASH",
  "currentPrice": "10",
  "payfield_accountName": "asdf",
  "payfield_accountNumber": "1",
  "payfield_transitNumber": "1",
  "usePayFields": true
}
```

Response is Status 200:
```
{
  "createdIp": "73.55.26.88",
  "userEnabled": true,
  "account_id": 729,
  "primaryMarket": null,
  "minPayment": 0,
  "currentPrice": "10",
  "totalReceived": 0,
  "id": 880,
  "dynamicPrice": false,
  "publicBalance": 0,
  "secondaryMarket": null,
  "fee": null,
  "verified": false,
  "sellCrypto": "DASH",
  "success": true,
  "maxPayment": 0,
  "buyCurrency": "CAD",
  "published": false,
  "onHold": 0
}
```

#### Status 201: OK
The response with 201 will not be the newly created Ad object, the response will be an advertisement that was created sometime in the past by a device for this phone number. For example,
{
}
DEVELOPER NOTE: consider returning the name of the device that created this! If no device, say that it was created on Wall of Coins . com.
Things are "OK"; however, the advertisement was not created. Instead, this user has a previous advertisement already in the system. Before their new advertisement can be created by re-sending the POST /api/adcreate/ request, the API developer must give the end user a chance to:
Review the old Advertisement to determine if they want to verify it, or
Delete the old Advertisement.
DEVELOPER NOTE: we need a function to "DELETE" advertisements. The "deleted" flag will be True :)
DEVELOPER NOTE: how about the server only makes the user verify the advertisement if it was created within the last 48 hours?
#### Status 301: Redirect
To get a positive response status, be sure that you have the "/" slash at the end of the API endpoint URL!
#### Status 400: Bad Request
There are many potential issues. Here are the most common:
Dynamic Pricing: the same market was selected for the secondary market as the primary market. The user must specify 2 completely different markets to work with.
### POST /api/sendVerification/
Parameters:
phone: the user's phone number -- DEVELOPER NOTE: this must include the "+" and country code!!!
ad_id: the "id" property in the /api/adcreate/ response. This is the advertisement ID.
Request Example:
HEADER X-Coins-Api-Token: YXV0aDoxMjc4NzoxNDgzNTcyMDc4fDFhN2IyMmE3MDRmNDg4ZDQwMTEyYTBkNDI5NTc2NjAyZjY5MWZiYmI=
                        
POST http://woc.reference.genitrust.com/api/sendVerification/

{
  "phone": "9412575725",
  "ad_id": "862"
}
Response:
             
{
  "__CASH_CODE": "WNU6G",
  "success": true
}
Response notes:
__CASH_CODE - this parameter is only available while you're working with the Reference server. This is the "Cash Code" that was SMS'd to the end user. You will need to ask the user to input this code into your application so you can send the code in your next API call. The next API call verifies the advertisement, supplying you with a crypto address that will allow the end user to fund their advertisement.
### GET /api/v1/fiatAccount ?
What call will retrieve bank account information? Or information on a specific bank account belonging to the user?
DEVELOPER NOTE: we really need an endpoint where people can get a list of the Cash Accounts / Fiat Accounts!
### GET /api/v1/ad/
Requires X-Coins-Api-Token header.
Example Request:
HEADER X-Coins-Api-Token: YXV0aDoxMjc4NzoxNDgzNTcyMDc4fDFhN2IyMmE3MDRmNDg4ZDQwMTEyYTBkNDI5NTc2NjAyZjY5MWZiYmI=

GET http://woc.reference.genitrust.com/api/v1/ad/
Response:
[
  {
    "publicBalance": "0E-8",
    "secondaryMarket": None,
    "verified": False,
    "sellCrypto": "DASH",
    "primaryMarket": None,
    "currentPrice": "10.00",
    "buyCurrency": "USD",
    "fundingAddress": "(Not Available - Needs Verification)",
    "sellerFee": None,
    "published": False,
    "onHold": "0E-8",
    "balance": "0E-8",
    "id": 863,
    "dynamicPrice": False
  },
  {
    "publicBalance": "0E-8",
    "secondaryMarket": null,
    "verified": true,
    "sellCrypto": "DASH",
    "primaryMarket": null,
    "currentPrice": "10.00",
    "buyCurrency": "USD",
    "fundingAddress": "xzPhJiKNBmwMKeti2KsEho9fAn91LKoAaE",
    "sellerFee": null,
    "published": false,
    "onHold": "0E-8",
    "balance": "0E-8",
    "id": 862,
    "dynamicPrice": false
  }
]
Response notes:
When the advertisement has not been verified by the SMS Cash Code, the funding address will not be available, and the first character of the funding address property will then start with an opening parenthesis "(".
"0E-8" is scientific notation for the number "0".
DEVELOPER NOTE: these scientific notation items should not be in scientific notation. Use Decimal notation of 0.00000000 or 0. Consider using raw units?
### POST /api/verifyAd/
HEADER X-Coins-Api-Token Required!
Parameters:
ad_id
phone
code: the Cash Code SMS'd to the end user and collected via end user input.
Example Request:
HEADER X-Coins-Api-Token: YXV0aDoxMjc4NzoxNDgzNTc1NjgzfDM5MWYxNzFiMWRlNGNjNjExZjcxMWFlNTczOWIxMjAwMzA5NDNmYjQ=
                        
POST http://woc.reference.genitrust.com/api/sendVerification/

{
  "phone": "2397779998",
  "ad_id": "862",
  "code": "3K7KU"
}
Status code 200 (Success) Response:
{
  "fundingAddress": "xzPhJiKNBmwMKeti2KsEho9fAn91LKoAaE"
  "success": true
}
fundingAddress: if you're in using the reference server, this will be a test net address. Only use the reference server when you're in development mode. When you use the official Wall of Coins server, the address will be the live net address to fund the advertisement.
#### Status 500: Bad Request
You did not include the X-Coins-Api-Token header.
### POST /api/updateAdRate/ -- DEPRECATED
DEPRECATED. Do not use this function.
Requires X-Coins-Api-Token header.
Parameters:
adId: this is a weird inconsistency where "ad id" is in a camel casing form. The "i" in "ad id" is capitalized. This is the end user's advertisement's ID that will be updated.
### PUT /api/v1/ad/{id}/
Requires HEADER X-Coins-Api-Token.
All Parameters are optional, except those noted as required. The parameters you specify are the ones that will be updated:
dynamicPrice: (required) set to "true" when the end user's advertisement's price will follow the price of another market. Set to "false" when you will specify a new, static ad rate (currentPrice).
currentPrice: (required if dynamicPrice is false) this is the rate that the buyer will pay per crypto. For example, a rate of 4 means "4 fiat units per 1 crypto unit", as in: "4 dollars per 1 bitcoin".
primaryMarket: (required if using a dynamic price) ID of the primary market.
secondaryMarket: (required if using a dynamic price) ID of the market to use if the first market is experiencing downtime or an unexpected API response.
sellerFee: (required if using a dynamic price) this is the percentage. For 4%, use the value 4. For a percentage of 1.5%, use the value 1.5.
minPayment: the minimum fiat payment to purchase coins from the advertisement. Use 0 to specify no minimum.
maxPayment: the maximum fiat payment to purchase coins from the advertisement. Use 0 to specify no maximum.
userEnabled: this allows the end user to enable/disable the ability for buyers to purchase coins from their advertisement. This is used as a temporary way to "pause" their advertisement.
DEVELOPER NOTE: people can select markets that follow BITCOIN prices. Should we allow this? probably... it will make things more fun :)
Example Request:
HEADER X-Coins-Api-Token: YXV0aDoxMjc4NzoxNDgzNTg3NzQ0fDY5YmE5MzU4ZTVhN2EzNDYzNTM1YTQ1NzMwZDEwNjcwMGZiM2U3MTU=

PUT http://woc.reference.genitrust.com/api/v1/ad/862/
{
  "secondaryMarket": 23,
  "sellerFee": 4,
  "dynamicPrice": true,
  "primaryMarket": 22
}
Response:
[
  "status: Ad updated." 
]
Example of setting a static (non-moving) price:
Request:
HEADER X-Coins-Api-Token: YXV0aDoxMjc4NzoxNDgzNTg3NzQ0fDY5YmE5MzU4ZTVhN2EzNDYzNTM1YTQ1NzMwZDEwNjcwMGZiM2U3MTU=

PUT http://woc.reference.genitrust.com/api/v1/ad/862/
{
  "dynamicPrice": false,
  "currentPrice": 16.25,
  "minPayment": 100,
  "maxPayment": 500,
  "userEnabled: true
}
Response:
[
  "status: Ad updated." 
]
### GET /api/v1/ad/{id}/pendingBalance
Returns the balance pending to receive a credit onto the Wall of Coins advertisement accounting ledger. This will list the total "balance" of incoming Bitcoin deposits that will be credited to the advertisement, but are not credited at the moment. These are transactions that are still in the memory pool that have not made it into a network ledger block (ie: the blockchain).
id - the advertisement ID.
Request:
HEADER X-Coins-Api-Token: YXV0aDoxMjc4NzoxNDgzNTg3NzQ0fDY5YmE5MzU4ZTVhN2EzNDYzNTM1YTQ1NzMwZDEwNjcwMGZiM2U3MTU=

GET http://woc.reference.genitrust.com/api/v1/ad/862/pendingBalance/
Response:
{
  "balance": 0
}
### GET /api/v1/incomingOrders/
Requires the X-Coins-Api-Token header. Returns a list of all orders that need their payment to be acknowledged. When buyers mark their order as "paid", the order is then populated in this list. If there are no order payments to be verified (or denied), then the GET response will be a blank list:
[
]
Example request:
HEADER X-Coins-Api-Token: YXV0aDoxMjc4NzoxNDgzNTg3NzQ0fDY5YmE5MzU4ZTVhN2EzNDYzNTM1YTQ1NzMwZDEwNjcwMGZiM2U3MTU=

GET http://woc.reference.genitrust.com/api/v1/incomingOrders/
Response with order payments pending to be verified:
[{
  u'bankAccount': {
    u'bankBusiness': {
      u'payFields': False,
      u'name': u'Huntington',
      u'url': u'http://www.huntington.com',
      u'country': u'us',
      u'logoHq': u'/media/logos/logo_22%402x.png',
      u'logo': u'/media/logos/logo_22.png',
      u'iconHq': u'/media/logos/icon_22%402x.png',
      u'id': 22,
      u'icon': u'/media/logos/icon_22.png'
    },
    u'number': u'1234 1234',
    u'id': 696,
    u'name': u'Daniel Murawsky'
  },
  u'gross': u'14.30143014',
  u'paymentDue': u'2017-01-05T06:16:48.570Z',
  u'payment': u'130.00',
  u'status': u'WDV',
  u'id': 35973
}, {
  u'bankAccount': {
    u'bankBusiness': {
      u'payFields': False,
      u'name': u'Huntington',
      u'url': u'http://www.huntington.com',
      u'country': u'us',
      u'logoHq': u'/media/logos/logo_22%402x.png',
      u'logo': u'/media/logos/logo_22.png',
      u'iconHq': u'/media/logos/icon_22%402x.png',
      u'id': 22,
      u'icon': u'/media/logos/icon_22.png'
    },
    u'number': u'1234 1234',
    u'id': 696,
    u'name': u'Daniel Murawsky'
  },
  u'gross': u'0.55005501',
  u'paymentDue': u'2016-12-15T10:19:52.484Z',
  u'payment': u'5.00',
  u'status': u'WD',
  u'id': 35971
}]
You may also specify the ID of the order to get just the details for that order: GET /api/v1/incomingOrders/{id}/
Response Object Description
id - This Order's internal ID. Use this ID when verifying ("confirmDeposit") or denying the order payment ("invalidateDeposit").
payment - the total fiat payment to expect to be paid into the end user's cash account.
paymentDue - the date and time the buyer has vouched to pay for this order.
gross - the total coins that are held (or were held) for this order.
status - the order's status: "WD" is "Waiting for Deposit", and "WDV" is "Waiting for Deposit Verification". "WD" means that the end user buyer has not confirmed the order payment, and "WDV" means that this advertisement's end user seller has not verified yet whether or not payment was received.
bankAccount - bank account object details. This is the payment center that the seller can expect to receive the cash payment.
id - the ID of the end user's bank account object. This is also referred to as the account_id.
name - CHECK THIS when there are no pay fields, this is the US bank account's "Name on Account".
number - CHECK THIS when there are no pay fields, this is a US bank account number. When there are pay fields, check the pay fields to see the account detials.
bankBusiness - Also known as a "Payment Center", this is the object details. The "bank business" is the brand of payment center--the banking institution's brand name, the remittance center's name, etc.
id - the payment center's Wall of Coins ID.
name - the brand name of the bank business, aka the brand name of the payment center.
url - the payment center's official web URL.
country - the 2-character country code. This will always be lower case.
payFields - true/false if this payment center uses Payment Fields. Payment Fields are for payment centers that need to give custom information to Wall of Coins buyers so they know how to pay the center.
icon - full URL to an image icon embodying the business's brand.
iconHq - full URL to the High Quality ("retina") version of the icon.
logo - full URL to the image logo embodying the business's brand identity.
logoHq - full URL to the High Quality ("retina") version of the logo.
### POST /api/v1/incomingOrders/{id}/confirmDeposit/
#### Status 400: Bad Request
You can only invalidate deposits with the "WDV" (Waiting for Deposit Verification) status.
{
  "detail": "Unable to invalidate deposit. Make sure order is in WDV state."
}
#### Status 404: Not Found
The Order ID with the status "WDV" was not found. A common problem is to accidentally send the Advertisement object's ID instead. Below is an example of a proper request after getting a list of Advertiser's orders pending. First is the API function to determine incoming orders:
RESPONSE 200 success

[
  {
    "id": 35981,
    "gross": "2.73522976",
    "payment": "25.00",
    "paymentDue": "2017-01-10T02:26:03.722Z",
    "bankAccount": {
      "id": 743,
      "name": "Test BOFA",
      "number": "1234",
      "bankBusiness": {
        "id": 11,
        "name": "Bank of America",
        "url": "http://bankofamerica.com",
        "logo": "/media/logos/logo_11.png",
        "logoHq": "/media/logos/logo_11%402x.png",
        "icon": "/media/logos/icon_11.png",
        "iconHq": "/media/logos/icon_11%402x.png",
        "country": "us",
        "payFields": false
      }
    },
    "status": "WDV"
  }
]
In this response, you receive a list of Order objects. Each order has the advertisement's associated cash payment destination, which is the seller's cash account that he holds with a financial institution or merchant processing institution. When orders are status "WD", the seller is still Waiting for the Deposit cash payment and is unable to "Confirm" or "Deny" receiving the payment. Once the order object reaches status "WDV"--"Waiting for the Deposit to be Verified by the seller", or "Waiting Deposit Verification"--then the Order ID can be submitted to the Confirm or Deny Deposit API endpoint. Notice that the object below uses the ID of the Order object itself, not the ID of the bankAccount:
HEADER X-Coins-Api-Token: YXV0aDoxMjg4MDoxNDg0MDExMTAyfGE5ZGJiZTVjNjlmZTQxZjQ1ODhhMzIwNjM0ZmNmMDhlYzFhYTY5ODQ=

POST http://woc.reference.genitrust.com/api/v1/incomingOrders/35981/confirmDeposit/
#### Status 500: Server Error
This is a common issue if you do not include the "/" slash at the end of the API endpoint URL. Do not forget the slash at the end!
### POST /api/v1/incomingOrders/{id}/invalidateDeposit
Requires the X-Coins-Api-Token header.
Example Request:
HEADER X-Coins-Api-Token: YXV0aDoxMjcxMToxNDgzNjAwODc1fGM3YzQzYWY3YmVlM2U2ODBjYTM3MjQ1M2I5ZWMwMDI1MmVmNDEzNTY=

POST http://dev.geni.to:8001/api/v1/incomingOrders/35971/invalidateDeposit/
"POST /api/v1/incomingOrders/35971/invalidateDeposit/ HTTP/1.1" 400 None
{u'detail': u'Unable to invalidate deposit. Make sure order is in WDV state.'}
>>>
Response:
{u'bankAccount': {u'bankBusiness': {u'payFields': False, u'name': u'Huntington', u'url': u'http://www.huntington.com', u'country': u'us', u'logoHq': u'/media/logos/logo_22%402x.png', u'logo': u'/media/logos/logo_22.png', u'iconHq': u'/media/logos/icon_22%402x.png', u'id': 22, u'icon': u'/media/logos/icon_22.png'}, u'number': u'1234 1234', u'id': 696, u'name': u'Daniel Murawsky'}, u'gross': u'14.30143014', u'paymentDue': u'2017-01-05T06:16:48.570Z', u'payment': u'130.00', u'status': u'RMIT', u'id': 35973}
>>>
#### Status 400: Bad Request
You can only invalidate deposits with the "WDV" (Waiting for Deposit Verification) status.
{
  "detail": "Unable to invalidate deposit. Make sure order is in WDV state."
}
#### Status 500: Server Error
This is a common issue if you do not include the "/" slash at the end of the API endpoint URL. Do not forget the slash at the end!


## Buying API

TODO.


# Web Widget

For information about testing and deploying the Web Widget, visit our [API Integration Chat Room](https://www.hipchat.com/gJdsALg1V).

## Web Widget Eligibility

Email publishers@wallofcoins.com for eligibility.


# Other Resources

* All code contributions to this documentation and the Reference Clients themselves is warmly welcomed and greatly appreciated! Visit our [Github Page](https://github.com/genitrust/woc-reference-client).
* The [API Integration Chat Room](https://www.hipchat.com/gJdsALg1V) is available publicly and designated for discussion on the Wall of Coins API.
* [Markdown Syntax](https://guides.github.com/features/mastering-markdown/) used for this document.
