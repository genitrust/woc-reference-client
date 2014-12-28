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
     */
    var authorizePhone = function() {
        var phone = $('#countryCode').val() + $('#userPhone').val();

        $.ajax({
            url: Woc.Api.url + '/api/v1/auth/' + phone + '/authorize/',
            data: {
                'password': $('#wocPassword').val()
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
                    alert('authorization GREAT :D');
                    placeHold();
                }
            }
        });
        // status 200 is when authorization worked :D
    };

    /**
     * Places a hold on a buying offer.
     */
    var placeHold = function() {
        var phone = $('#countryCode').val() + $('#userPhone').val();

        $('#holdOrderBtn').attr('disabled', 'disabled');

        // default POST data
        var postData = {
            'offer': $('input[type=radio][name=offer]').val(),
            // An email can always be provided by the user. Emails have
            // nothing to do with the user "account"; they just may be
            // useful to Wall of Coins in the future for Order receipts
            // or other imaginable purposes.
            'email':  $('#email').val(),
            'phone': phone
        };

        var token = $('#authToken').val();
        if (token) {
            // TODO: if we have an authenticated token, attach it to our
            // POST parameters.

            // TODO: remove this notice when tokens are implemented.
            // NOTE: TOKENS ARE NOT IMPLEMENTED!!!
            postData.token = token;
        }
        else {
            // If the user does not exist, the device must create a blank
            // user password.
            var wocPassword = $('#wocPassword').val();
            postData.password = '';
            postData.deviceCode = $('#deviceCode').val();
            postData.deviceName = $('#deviceName').val();
        }

        // Attempt to create a brand new user with this first purchase.
        // TODO: should this API command automatically log in the user?
        // or should the API first use the stored token / credentials to
        // determine if the phone/device needs to be resent?
        $.ajax({
            url: Woc.Api.url + '/api/v1/holds/',
            data: postData,
            type: 'POST',
            statusCode: {
                403: function() {
                    // Forbidden means that we need the user's Wall of
                    // Coins password in order to use this phone number.
                    // Doh!
                    alert('what is wrong? is token invalid?');
//                        alert('need WOC password');
//                        $('#wocPasswordCtn').show();
//                        $('#wocPassword').focus();
                },
                400: function() {
                    // Bad Request means that we need the user's Wall of
                    // Coins password in order to authorize a 3rd party
                    // device access to use this phone number.
                    $('#wocPasswordCtn').show();
                    $('#wocPassword').focus();
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
            // we have a user password, so authenticate the user to add this
            // application as a device.
            if ($('#wocPassword:visible').length > 0) {
                authorizePhone();
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
                $.ajax({
                    url: Woc.Api.url + '/api/v1/holds/' + holdId + '/capture/',
//                    crossDomain: true,
//                    xhrFields: { withCredentials: true },
                    data: {
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
                        200: function() {
                            alert('authorization GREAT :D and this was captured!');
                            $('#finishedCtn').show();
                            Woc.scrollDown();
                        },
                        201: function() {
                            alert('created');
                        }
                    }
                });
            };

            // before capturing, we must authorize
            // log in with them credentials
            var phone = $('#countryCode').val() + $('#userPhone').val();
            var devPassword = ($('#deviceCode').val()) ? $('#deviceCode').val() : '';
            var data = {
                'password': ($('#wocPassword').val()) ? $('#wocPassword').val() : ''
            }
            if (devPassword) {
                data.device = devPassword;
            }

            $.ajax({
                url: Woc.Api.url + '/api/v1/auth/' + phone + '/authorize/',
//                crossDomain: true,
//                xhrFields: { withCredentials: true },
                data: data,
                type: 'POST',
                statusCode: {
                    403: function() {
                        alert('2: what is wrong? password badddd?');
                    },
                    400: function() {
                        alert('2: maybe this means password wrong or something?');
                    },
                    404: function() {
                        alert('2: password bad >[');
                    },
                    200: function() {
                        alert('2: authorization GREAT :D');
                        captureHold();
                    }
                }
            });

            Woc.scrollDown();
            return false;
        });
    };

    return me;
})();

Woc.Sell = (function() {
})();

Woc.Analytics = (function() {
})();
