var Woc = (function() {
    var me = {};

    /**
     * Scrolls to the bottom of the page.
     */
    me.scrollDown = function(div) {
        var offset = $(document).height();
        if (typeof(div) !== 'undefined') {
            offset = $('#' + div).offset().top;
        }
        $('html, body').animate({scrollTop: offset }, 500);
    };

    return me;
})();


Woc.Api = (function() {
    var me = {};

    me.includeAuthToken = function(request) {
        var token = $('#authToken').val();
        if (token != '') {
            request.setRequestHeader('X-Coins-Api-Token', token);
            request.cross
        }
    };

    me.endpoint = function() {
        return $('#apiUrl').val();
    };

    me.publisherId = function() {
        return $('#publisherId').val();
    };

    me.authToken = function() {
        return $('#authToken').val();
    };

    return me;
})();


/**
 * Reference Client for Buying on the Coins platform.
 *
 * All PRIVATE functionality is presented in the order it is presented on the
 * HTML template itself.
 */
Woc.Buy = (function() {
    var me = {};
    me.orderId = 0;     // set to a value if there is an active order.

    me.getOrders = function() {
      var apiQuery = Woc.Api.endpoint() + '/api/v1/holds';
      $('#apiQuery').text(apiQuery);
      $.ajax({
        url: apiQuery,
        method: "POST",
        statusCode: {
          200: function(data) {
            $('#apiResponse').text(JSON.stringify(data, null, 2));
          }
        }
      });
    };

    me.currentAuthToken = function() {
        $.ajax({
            url: Woc.Api.endpoint() + '/api/v1/auth/current/',
            statusCode: {
                200: function(data) {
                    $('#authToken').val(data.token);
                }
            }
        });
    };

    /**
     * Authorize the WOC user to add a device to their account.
     *
     * @param  function  function to call upon successful authorization.
     */
    me.authorizePhone = function(callback) {
        var phone = $('#countryCode').val() + $('#userPhone').val();
        var postData = {};
        var password = $('#wocPassword').val();
        if (password) {
            postData.password = password;
        }
        else {
            postData.deviceCode = $('#deviceCode').val();
        }

        $.ajax({
            url: Woc.Api.endpoint() + '/api/v1/auth/' + phone + '/authorize/',
            data: postData,
            method: 'POST',
            statusCode: {
                403: function() {
                    alert('what is wrong? password badddd?');
                },
                400: function(data) {
                    alert(data.responseJSON.detail);
                },
                200: function(data) {
                    // if user's wall of coins password was used, we will
                    // remove it so as to later use the device token instead.
                    $('#wocPassword').val('');
                    $('#authToken').val(data.token);
                    if (typeof(callback) !== 'undefined') {
                        callback();
                    }
                }
            }
        });
        // status 200 is when authorization worked :D
    };

    var queryBanks = function() {
        $.ajax({
            url: Woc.Api.endpoint() + '/api/v1/banks/',
            type: 'GET',
            beforeSend: Woc.Api.includeAuthToken,
            statusCode: {
                200: function(data) {
                    $.each(data, function(i) {
                        $('#banks').append($('<option></option>')
                            .attr('value', data[i].id)
                            .text(data[i].name)
                        );
                    });
                    $('#queryBanksBtn').hide();
                    $('#banks').show();
                }
            }
        });
    };

    var queryTicker = function() {
      var apiQuery = Woc.Api.endpoint() + '/api/public/v1/ticker';
      $('#apiQuery').text(apiQuery);
      $.ajax({
        url: apiQuery,
        statusCode: {
          200: function(data) {
            $('#apiResponse').text(JSON.stringify(data, null, 2));
          }
        }
      });
    };

    var discoverPurchaseOptions = function() {
        var geolocation = $('#geolocation').val();
        $('#discoverBtn').attr('disabled', 'disabled');
        $('#offersNeededCtn').hide();
        $('#offersCtn').show();

        $.ajax({
            url: Woc.Api.endpoint() + '/api/v1/discoveryInputs/',
            beforeSend: Woc.Api.includeAuthToken,
            data: {
                'publisherId': $('#publisherId').val(),
                'usdAmount': $('#usdAmount').val(),
                'cryptoAmount': 0,
                'crypto': 'BTC',
                'zipCode': $('#zipCode').val(),
                'bank': $('#banks').val(),
                'cryptoAddress': $('#bitcoinAddress').val(),
                'browserLocation': (geolocation[0] == '(') ? '' : geolocation
            },
            type: 'POST',
            statusCode: {
                201: function(data) {
                    $('#offersCtn').append('<p>Collecting offers...</p>');
                    Woc.scrollDown();
                    renderOffers('offersCtn', data.id);
                },
                400: function() {
                    $('#discoverBtn').removeAttr('disabled');
                    $('#discoveryErrorCtn').show();
                }
            }
        });

        return false;
    };

    var holdOrder = function() {
        // The action that actually requests the hold on a buying offer. The
        // remaining functionality in "hold Order" determines if the proper
        // end user credentials are ready, or must be obtained from the user,
        // before requesting the API to hold the offer.
        var placeHold = function() {
            $('#holdOrderBtn').attr('disabled', 'disabled');

            // default POST data
            var postData = {
                'publisherId': $('#publisherId').val(),
                'offer': $('input[type=radio][name=offer]:checked').val(),
// extra information about existing 'user' authorization. API parameter adjustments'
//            'phone': $('#countryCode').val() + $('#userPhone').val(),
                // An email can always be provided by the user. Emails have
                // nothing to do with the user "account"; they just may be
                // useful to Wall of Coins in the future for Order receipts
                // or other imaginable purposes.
                'email':  $('#email').val()
            };

            if ($('#authToken').val() == '') {
                // if we have no authorized token, then we need the user's
                // phone number in order to create a Coins account.
                postData.phone = $('#countryCode').val() + $('#userPhone').val();
            }

            var deviceName = $('#deviceName').val();
            if (deviceName) {
                // when a device name is specified, the API ignores the password
                // because now the deviceCode is used instead as a password.
                postData.deviceName = deviceName;
                postData.deviceCode = $('#deviceCode').val();
                // NOTE: only pass the phone number when creating a new device,
                // which will also be when you create the device name and code.
                // If the user does not exist, the device must create a blank
                // user password.
// TODO: check with maxim
//                postData.password = '';
            }

            // Attempt to create a brand new user contact and device with this
            // first purchase.
            $.ajax({
                url: Woc.Api.endpoint() + '/api/v1/holds/',
                beforeSend: Woc.Api.includeAuthToken,
                data: postData,
                type: 'POST',
                statusCode: {
                    403: function() {
                        // Forbidden means that we need the user's Wall of
                        // Coins password in order to use this mobile number.
                        $('#wocPasswordCtn').show();
                        $('#wocPassword').focus();
                    },
                    400: function() {
                        // They already have an order awaiting deposit. They must complete this order first.
                        // If a new device was specified in the API, the device will not be created since no
                        // order will be created either.
                        alert('This user already has an order awaiting for payment.');

                        // Each mobile number is only allowed 1 hold at a time until further implementation.
                        // If the 400 response is because of multiple holds, the JSON response will contain
                        // the property 'detail' with the following message:
                        //
                        // "You can have only one active hold or pending order at the time. Try to cancel
                        // active hold first."
                    },
                    200: function() {
                        alert('everything was normal. need a password or something');
                        $('#captureHoldStep').show();
                    },
                    201: function(data) {
                        // if a token is returned, then a device has been
                        // created. Use that token for capturing the hold
                        // later :)
                        if (typeof(data.token) !== 'undefined') {
                            $('#authToken').val(data.token);
                        }

                        // hold created
                        $('#holdId').val(data.id);
                        $('#captureHoldStep').show();
                        Woc.scrollDown();
                    }
                }
            });
        };


        // if we do NOT have a token AND we're NOT creating a new device,
        // authorize the phone first to obtain a token.
        if ($('#authToken').val() == '' && $('#deviceName').val() == '') {
            me.authorizePhone(placeHold);
        }
        // we have a user password, so authenticate the user to add this
        // application as a device.
        else if ($('#wocPassword:visible').length > 0) {
            me.authorizePhone(placeHold);
        }
        else {
            // here we have all of the auth info we need to request a hold.
            placeHold();
        }

        return false;
    };

    var captureHold = function() {
        $('#captureError').hide();

        var holdId = $('#holdId').val();
        $('#captureHoldBtn').attr('disabled', 'disabled');
        $('#captureHoldStatusCtn').show();
        Woc.scrollDown();

        $.ajax({
            url: Woc.Api.endpoint() + '/api/v1/holds/' + holdId + '/capture/',
            beforeSend: Woc.Api.includeAuthToken,
            data: {
                'publisherId': $('#publisherId').val(),
                'verificationCode': $('#smsCode').val()
            },
            type: 'POST',
            statusCode: {
                403: function() {
                    alert('what is wrong? password badddd?');
                },
                400: function() {
                    alert('maybe this means password wrong or something?');
                },
                200: function(data) {
                    me.orderId = data[0].id;
                    $('#finishedCtn').show();
                    Woc.scrollDown();
                },
                201: function() {
                    alert('created');
                }
            }
        });

        // before capturing, you must authorize the device (your software)
        // and receive an authorization token.
//        me.authorizePhone(captureHold);
        return false;
    };

    /**
     * Initializes browser geo-positioning.
     *
     * @param  string  name of the input field ID to store the browser's
     *                 location coordinates.
     */
    var initGeo = function(browserLocation) {
        locationField = $('#' + browserLocation);

        if (navigator.geolocation) {
            var geoSuccess = function(position) {
                locationField.val(JSON.stringify({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }));
                return position.coords;
            };

            navigator.geolocation.getCurrentPosition(geoSuccess);
        }
        else {
            locationField.val('Location Unavailable!');
        }
    };

    /**
     * Gets a purchase discovery result's details, and then appends the offer
     * information to the end of a div.
     *
     * @param  string  name of the div ID to append offer information.
     * @param  string  hash ID of the discovered input.
     * @param  object  offer information
     */
    var renderOffers = function(div, offerId) {
        var url = Woc.Api.endpoint() + '/api/v1/discoveryInputs/' + offerId + '/offers/';
        div = $('#' + div);

        $.get(url).success(function(data) {
            var results = data.singleDeposit.length > 0 ||
                data.doubleDeposit.length > 0 ||
                data.multipleBanks.length > 0;

            if (data.singleDeposit.length > 0) {
                div.append('<p><strong>Single Deposit Options:</strong></p>');
                $.each(data.singleDeposit, function(i, obj) {
                    var label = obj.bankName + ': ' + obj.amount.bits + ' bits';
                    div.append('<p><label><input type="radio" name="offer" value="' +
                        obj.id + '">' + label + '</label><br/>');
                });
            }

            if (data.doubleDeposit.length > 0) {
                div.append('<p><strong>Double Deposit Options:</strong></p>');
                $.each(data.doubleDeposit, function(i, obj) {
                    var label = obj.firstOffer.bankName + ': '
                        + obj.totalAmount.bits + ' bits';
                    div.append('<p><input type="radio" name="offer" value="' +
                        obj.id + '">' + label + '<br/>');
                });
            }

            if (data.multipleBanks.length > 0) {
                div.append('<p><strong>Multiple-Bank Deposit Options:</strong></p>');
                $.each(data.multipleBanks, function(i, obj) {
                    var label = obj.firstOffer.bankName + '/'
                        + obj.secondOffer.bankName + ': ' + obj.totalAmount.bits
                        + ' bits';
                    div.append('<p><input type="radio" name="offer" value="' +
                        obj.id + '">' + label + '<br/>');
                });
            }

            if (results) {
                $('#offerResultActions').show();
                Woc.scrollDown();
            }
            else {
                div.append('<p><strong>None found :(</strong></p>');
            }
        })
        .error(function() {
            alert('getOffers: error');
        });
    };

    me.cancelOrder = function() {
        $(this).attr('href', Woc.Api.endpoint() + '/api/v1/orders/' + me.orderId);
        $(this).attr('target', '_blank');
    };

    me.confirmDeposit = function() {
        $(this).attr('href', Woc.Api.endpoint() + '/api/v1/orders/' + me.orderId + '/confirmDeposit');
        $(this).attr('target', '_blank');
    };

    /**
     * Initializes and defines the Buy View's actions and behaviors.
     */
    me.init = function() {
        initGeo('geolocation');

        $('#currentAuthTokenBtn').click(me.currentAuthToken);

        $('#getOrdersBtn').click(me.getOrders);

        $('#queryBanksBtn').click(queryBanks);

        $('#queryTickerBtn').click(queryTicker);

        $('#discoverBtn').click(discoverPurchaseOptions);

        $('#nextStepBtn').click(function() {
            $(this).attr('disabled', 'disabled');
            $('#authStep').show();
            Woc.scrollDown('authStep');
            return false;
        });

        $('#holdOrderBtn').click(holdOrder);

        $('#authHoldBtn').click(function() {
            $('#holdOrderBtn').click();
            return false;
        });

        $('#captureHoldBtn').click(captureHold);
        $('#cancelOrderBtn').click(me.cancelOrder);
        $('#confirmDepositBtn').click(me.confirmDeposit);
    };

    return me;
})();

Woc.Sell = (function() {
})();

Woc.Analytics = (function() {
})();
