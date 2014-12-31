var Woc = {};

Woc.Api = (function() {
    var me = {};

    me.init = function() {
        me.url = $('#apiUrl').val();
        me.publisher = $('#publisherId').val();
    };

    return me;
})();

/**
 * Scrolls to the bottom of the page.
 */
Woc.scrollDown = function(div) {
    var offset = $(document).height();
    if (typeof(div) !== 'undefined') {
        offset = $('#' + div).offset().top;
    }
    $('html, body').animate({scrollTop: offset }, 500);
};


Woc.Buy = (function() {
    var me = {};

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
        var url = Woc.Api.url + '/api/v1/discoveryInputs/' + offerId + '/offers/';
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

    /**
     * Authorize the WOC user to add a device to their account.
     *
     * @param  function  function to call upon successful authorization.
     */
    var authorizePhone = function(callback) {
        var phone = $('#countryCode').val() + $('#userPhone').val();
        var postData = {};
        var password = $('#wocPassword').val();
        if (password) {
            postData.password = password;
        }
        else {
            postData.device = $('#deviceCode').val();
        }

        $.ajax({
            url: Woc.Api.url + '/api/v1/auth/' + phone + '/authorize/',
            data: postData,
            type: 'POST',
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

    /**
     * Places a hold on a buying offer.
     */
    var placeHold = function() {
        $('#holdOrderBtn').attr('disabled', 'disabled');

        // default POST data
        var postData = {
            'publisherId': $('#publisherId').val(),
            'token': $('#authToken').val(),
            'offer': $('input[type=radio][name=offer]:checked').val(),
            'phone': $('#countryCode').val() + $('#userPhone').val(),
            // An email can always be provided by the user. Emails have
            // nothing to do with the user "account"; they just may be
            // useful to Wall of Coins in the future for Order receipts
            // or other imaginable purposes.
            'email':  $('#email').val()
        };

        var deviceName = $('#deviceName').val();
        if (deviceName) {
            // when a device name is specified, the API ignores the password
            // because now the deviceCode is used instead as a password.
            postData.deviceName = deviceName,
            postData.deviceCode = $('#deviceCode').val(),
            // NOTE: only pass the phone number when creating a new device,
            // which will also be when you create the device name and code.
            // If the user does not exist, the device must create a blank
            // user password.
            postData.password = '';
        }

        // Attempt to create a brand new user contact and device with this
        // first purchase.
        $.ajax({
            url: Woc.Api.url + '/api/v1/holds/',
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
                    // Bad Request means that we need the user's Wall of
                    // Coins password in order to authorize a 3rd party
                    // device access to use this phone number.

                    // if your app already has a device password, then use
                    // the device code to authorize the user's mobile phone.
                    if (postData.deviceCode) {
                        authorizePhone(placeHold);
                    }
                    else {
                        // if your app does not already have a device password,
                        // you should have created the device with your first
                        // hold API call--this ajax call! (/api/v1/holds/)
                        //
                        // if you still reach this point even when supplying
                        // a device password and/or device name, it is because
                        // the device cannot be created without the user's
                        // Wall of Coins password. You will want to tell the
                        // user about Wall of Coins, and let them know that
                        // they need to input their Wall of Coins password in
                        // order to add the device. Bad security :( we must
                        // implement Wall of Coins to return an access token...
                        $('#wocPasswordCtn').show();
                        $('#wocPassword').focus();

                        // TODO: BE AWARE OF THIS!
                        // Status 400 can also mean that the user already has another hold under their mobile number.
                        // Each mobile number is only allowed 1 hold at a time until further implementation. If the
                        // 400 response is because of multiple holds, the JSON response will contain the property
                        // 'detail' with the following message:
                        // "You can have only one active hold or pending order at the time. Try to cancel active hold
                        // first."
                    }
                },
                200: function() {
                    alert('everything was normal. need a password or something');
                    $('#captureHoldStep').show();
                },
                201: function(data) {
                    // hold created
                    $('#holdId').val(data.id);
                    $('#captureHoldStep').show();
                    Woc.scrollDown();
                }
            }
        });
    };

    /**
     * Initializes and defines the Buy View's actions and behaviors.
     */
    me.init = function() {
        Woc.Api.init();
        initGeo('geolocation');

        $('#queryBanksBtn').click(function() {
            $.ajax({
                url: Woc.Api.url + '/api/v1/banks/',
                type: 'GET',
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

        });

        $('#discoverBtn').click(function() {
            var geolocation = $('#geolocation').val();
            $('#discoverBtn').attr('disabled', 'disabled');
            $('#offersNeededCtn').hide();
            $('#offersCtn').show();

            $.ajax({
                url: Woc.Api.url + '/api/v1/discoveryInputs/',
                data: {
                    'publisherId': $('#publisherId').val(),
                    'token': $('#authToken').val(),
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
        });

        $('#nextStepBtn').click(function() {
            $(this).attr('disabled', 'disabled');
            $('#authStep').show();
            Woc.scrollDown('authStep');
            return false;
        });

        $('#holdOrderBtn').click(function() {
            // if we do NOT have a token AND we're NOT creating a new device,
            // authorize the phone first to obtain a token.
            if ($('#authToken').val().length == 0 && $('#deviceName').val().length == 0) {
                authorizePhone(placeHold);
            }
            // we have a user password, so authenticate the user to add this
            // application as a device.
            else if ($('#wocPassword:visible').length > 0) {
                authorizePhone(placeHold);
            }
            else {
                placeHold();
            }

            return false;
        });

        $('#authHoldBtn').click(function() {
            $('#holdOrderBtn').click();
            return false;
        });

        $('#captureHoldBtn').click(function() {
            $('#captureError').hide();

            var holdId = $('#holdId').val();
            var captureHold = function() {
                $('#captureHoldBtn').attr('disabled', 'disabled');
                $('#captureHoldStatusCtn').show();
                Woc.scrollDown();

                $.ajax({
                    url: Woc.Api.url + '/api/v1/holds/' + holdId + '/capture/',
                    data: {
                        'publisherId': $('#publisherId').val(),
                        'verificationCode': $('#smsCode').val(),
                        'token': $('#authToken').val()
                    },
                    type: 'POST',
                    statusCode: {
                        403: function() {
                            alert('what is wrong? password badddd?');
                        },
                        400: function() {
                            alert('maybe this means password wrong or something?');
                        },
                        200: function() {
                            $('#finishedCtn').show();
                            Woc.scrollDown();
                        },
                        201: function() {
                            alert('created');
                        }
                    }
                });
            };

            // before capturing, you must authorize the device (your software)
            // and receive an authorization token.
            authorizePhone(captureHold);
            return false;
        });
    };

    return me;
})();

Woc.Sell = (function() {
})();

Woc.Analytics = (function() {
})();
