var Woc = {};

Woc.Api = (function() {
    var me = {};

    me.init = function() {
        me.url = $('#apiUrl').val();
        me.user = $('#apiUserId').val();
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
        })
        .error(function() {
            console.log('getOffers: error');
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
    };

    return me;
})();

Woc.Sell = (function() {
})();

Woc.Analytics = (function() {
})();
