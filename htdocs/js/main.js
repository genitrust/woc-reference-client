var Woc = {};

Woc.Api = (function() {
    var me = {};

    me.init = function() {
        me.url = $('#apiUrl').val();
        me.publisher = $('#publisherId').val();
    };

    return me;
})();

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
                    div.append('<p><input type="radio" name="offer" value="' +
                        obj.id + '">' + label + '<br/>');
                });
            }

            if (data.doubleDeposit.length > 0) {
                div.append('<p><strong>Double Deposit Options:</strong></p>');
                $.each(data.doubleDeposit, function(i, obj) {
                    var label = obj.bankName + ': ' + obj.amount.bits + ' bits';
                    div.append('<p><input type="radio" name="offer" value="' +
                        obj.id + '">' + label + '<br/>');
                });
            }

            if (data.multipleBanks.length > 0) {
                div.append('<p><strong>Multiple-Bank Deposit Options:</strong></p>');
                $.each(data.multipleBanks, function(i, obj) {
                    var label = obj.firstOffer.bankName + '/' +
                        obj.secondOffer.bankName + ': ' + obj.totalAmount.bits + ' bits';
                    div.append('<p><input type="radio" name="offer" value="' +
                        obj.id + '">' + label + '<br/>');
                });
            }

            if (results) {
                $('#offerResultActions').show();
            }
        })
        .error(function() {
            alert('getOffers: error');
        });
    };

    /**
     * Authorize the WOC user to add a device to their account.
     */
    var authorizePhone = function(phone) {
        $.post(Woc.Api.url + '/api/v1/auth/' + phone + '/authorize/', {
            'password': $('#wocPassword').val()
        }, function(data) {
            console.log('need a token to pass to the Hold API');
            console.log('data:', data);
        });
    };

    /**
     * Initializes and defines the Buy View's actions and behaviors.
     */
    me.init = function() {
        Woc.Api.init();
        initGeo('geolocation');

        $('#discoverBtn').click(function() {
            var geolocation = $('#geolocation').val();
            $('#discoverBtn').attr('disabled', 'disabled');
            $('#offersNeededCtn').hide();
            $('#offersCtn').show();

            // IMPORTANT: you *must* include the '/' at the end of the URL.
            $.post(Woc.Api.url + '/api/v1/discoveryInputs/', {
                'usdAmount': $('#usdAmount').val(),
                'cryptoAmount': 0,
                'crypto': 'BTC',
                'zipCode': $('#zipCode').val(),
                'bank': $('#banks').val(),
                'cryptoAddress': $('#bitcoinAddress').val(),
                'browserLocation': (geolocation[0] == '(') ? '' : geolocation
            }, function(data) {
                if (data.id) {
                    $('#offersCtn').append('<p>Collecting offers...</p>');
                    renderOffers('offersCtn', data.id);
                }
                else {
                    $('#discoverBtn').removeAttr('disabled');
                    $('#discoveryErrorCtn').show();
                }
            });

            return false;
        });

        $('#nextStepBtn').click(function() {
            $(this).attr('disabled', 'disabled');
            $('#authStep').show();
            return false;
        });

        $('#holdOrderBtn').click(function() {
            var phone = $('#countryCode').val() + $('#userPhone').val();
            // we have a user password, so authenticate the user to add this
            // application as a device.
            if ($('#wocPassword:visible').length > 0) {
                authorizePhone(phone);
                return false;
            }

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
                postData.token = token;
            }
            else {
                // If the user does not exist, the device must create a blank
                // user password.
                postData.password = '';
                postData.device = $('#deviceId').val();
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
                        $('#holdOrderBtn').removeAttr('disabled');
                        alert('what is wrong? is token invalid?');
//                        alert('need WOC password');
//                        $('#wocPasswordCtn').show();
//                        $('#wocPassword').focus();
                    },
                    400: function() {
                        // Bad Request means that we need the user's Wall of
                        // Coins password in order to authorize a 3rd party
                        // device access to use this phone number.
                        $('#holdOrderBtn').removeAttr('disabled');
                        $('#wocPasswordCtn').show();
                        $('#wocPassword').focus();
                    },
                    200: function() {
                        alert('everything was normal');
                        $('#captureHoldStep').show();
                    }
                },
                success: function(data) {
                    alert('success');
                }
            });

            return false;
        });
    };

    return me;
})();

Woc.Sell = (function() {
})();

Woc.Analytics = (function() {
})();
