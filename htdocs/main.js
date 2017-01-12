(function() {
    var banks, payFields, dynamicFields, coords;
    var defaultPayFields = {
        payFields: [
            { "name": "name", "label": "Name on Account", "displaySort": 0 },
            { "name": "number", "label": "Account #", "displaySort": 1 },
            { "name": "number2", "label": "Confirm Account #", "displaySort": 2 }
        ]
    };
    function getVal(id){
        return $(id).val();
    }
    function setVal(id, val){
        return $(id).val(val);
    }
    function setHtml(id, val){
        return $(id).html(val);
    }
    function setText(id, val){
        return $(id).text(val);
    }
    function setJson(id, val){
        return $(id).text(JSON.stringify(val, null, 2));
    }
    function dynamicPricing() {
        return $('#dynamicPricingCheckbox').is(':checked');
    }
    function dynamicPricing2() {
        return $('#dynamicPricingCheckbox2').is(':checked');
    }
    function getCrypto() {
        return 'BTC';
    }
    function getReceivingOption() {
        var id = $('#receivingOptionsList .active').attr('id');
        if (id)
            return id.substring(7);
        return false;
    }
    function savePosition(position) {
        coords = JSON.stringify({latitude: position.coords.latitude, longitude: position.coords.longitude});
    }
    function displayRecievingOptions(options, offers) {
        $('#receivingOptionsList').html("");
        for(var i=0;i<options.length;i++){
            if (offers){
                renderOffer(options[i]);
            } else {
                renderOption(options[i]);
            }
        }
        $('#receivingOptionsList li').on('click', selectOption);
    }
    function displayBankOptions(options) {
        $('#banks').html('<option value="">Select Payment Center</option>');
        for(var i=0;i<options.length;i++){
            $('#banks').append('<option value="'+options[i].id+'">'+options[i].name+'</option>');
        }
        $('#banks').change(displayPayFields);
    }
    function displayMarketOptions(options) {
        $('#primaryMarket').html('<option value="">Select Primary Market</option>');
        $('#secondaryMarket').html('<option value="">Select Secondary Market</option>');
        $('#primaryMarket2').html('<option value="">Select Primary Market</option>');
        $('#secondaryMarket2').html('<option value="">Select Secondary Market</option>');
        for(var i=0;i<options.length;i++){
            $('#primaryMarket').append('<option value="'+options[i].id+'">'+options[i].label+'</option>');
            $('#secondaryMarket').append('<option value="'+options[i].id+'">'+options[i].label+'</option>');
            $('#primaryMarket2').append('<option value="'+options[i].id+'">'+options[i].label+'</option>');
            $('#secondaryMarket2').append('<option value="'+options[i].id+'">'+options[i].label+'</option>');
        }
    }
    function displayPayFields() {
        var val = this.value;
        $('#triggerContainer').hide();
        setHtml('#payFields', '');
        var bank = _.find(banks, function(o) { return o.id == val; });
        if (!bank.payFields){
            payFields = undefined;
            dynamicFields = undefined;
            _.each(orderPayFields(defaultPayFields), renderPayField);
        }else{
            payFields = orderPayFields(bank.payFields);
            dynamicFields = orderDynamicFields(bank.payFields);
            if (bank.payFields.trigger.length > 0){
                setHtml('#triggerText', bank.payFields.trigger);
                $('#triggerContainer').show();
                $('#trigger').change(function() {
                    if($(this).is(":checked")) {
                        $('#payFields').hide();
                        $('#dynamicFields').show();
                    }else{
                        $('#dynamicFields').hide();
                        $('#payFields').show();
                    }
                });
            }
        }
        _.each(payFields, renderPayField);
        _.each(dynamicFields, renderDynamicField);
    }
    function renderPayField(payField){
        var html = '<div class="form-group">'
        html += '<label for="name">'+payField.label+'</label>'
        html += '<input id="'+payField.name+'_pay" name="'+payField.name+'" type="text" placeholder="'+payField.label+'" class="form-control" />'
        html += '</div>'
        $('#payFields').append(html);
    }
    function renderDynamicField(payField){
        var html = '<div class="form-group">'
        html += '<label for="name">'+payField.label+'</label>'
        html += '<input id="'+payField.name+'_dynamic" name="'+payField.name+'" type="text" placeholder="'+payField.label+'" class="form-control" />'
        html += '</div>'
        $('#dynamicFields').append(html);
    }
    function orderPayFields(payFields){
        var ordered = _.orderBy(payFields.payFields, 'displaySort', 'asc');
        var confirms = [];
        _.each(ordered, function(payField){
            confirms.push(payField);
            var confirm = _.find(payFields.confirmFields, function(o) { return o.name == payField.name; });
            if (confirm){
                confirms.push(confirm);
            }
        });
        return confirms;
    }
    function orderDynamicFields(payFields){
        var ordered = _.orderBy(payFields.dynamicFields, 'displaySort', 'asc');
        var confirms = [];
        _.each(ordered, function(payField){
            confirms.push(payField);
            var confirm = _.find(payFields.confirmFields, function(o) { return o.name == payField.name; });
            if (confirm){
                confirms.push(confirm);
            }
        });
        return confirms;
    }
    function dynamicPricingToggle() {
        if (dynamicPricing()) {
            $('#staticPricingContainer').hide();
            $('#dynamicPricingContainer').show();
            actions.getMarkets();
        } else {
            $('#dynamicPricingContainer').hide();
            $('#staticPricingContainer').show();
        }
    }
    function getPricingPostData(postData) {
        if (dynamicPricing()) {
            postData.dynamicPrice = true;
            postData.primaryMarket = getVal('#primaryMarket');
            postData.secondaryMarket = getVal('#secondaryMarket');
            postData.minPayment = getVal('#minPayment');
            postData.maxPayment = getVal('#maxPayment');
            postData.sellerFee = getVal('#sellerFee');
            postData.currentPrice = getVal('#price');
        } else {
            postData.dynamicPrice = false;
            postData.currentPrice = getVal('#price');
        }
        return postData;
    }
    function dynamicPricingToggle2() {
        if (dynamicPricing2()) {
            $('#staticPricingContainer2').hide();
            $('#dynamicPricingContainer2').show();
            actions.getMarkets();
        } else {
            $('#dynamicPricingContainer2').hide();
            $('#staticPricingContainer2').show();
        }
    }
    function getPricingPostData2(postData) {
        if (dynamicPricing2()) {
            postData.dynamicPrice = true;
            postData.primaryMarket = getVal('#primaryMarket2');
            postData.secondaryMarket = getVal('#secondaryMarket2');
            postData.minPayment = getVal('#minPayment2');
            postData.maxPayment = getVal('#maxPayment2');
            postData.sellerFee = getVal('#sellerFee2');
            postData.currentPrice = getVal('#price2');
        } else {
            postData.dynamicPrice = false;
            postData.currentPrice = getVal('#price2');
            postData.minPayment = getVal('#minPayment2');
            postData.maxPayment = getVal('#maxPayment2');
        }
        return postData;
    }
    function getPostDataFromPayFields(postData) {
        _.each(payFields, function(payField){
            postData['payfield_'+payField.name] = getVal('#'+payField.name+'_pay');
        });
        _.each(dynamicFields, function(payField){
            postData['payfield_'+payField.name] = getVal('#'+payField.name+'_dynamic');
        });
        postData.usePayFields = true
        return postData;
    }
    function selectOption(e) {
        $('.list-group-item').removeClass('active');
        $('#'+e.target.id).addClass('active');
    }
    function renderOption(obj) {
        $('#receivingOptionsList').append('<li id="option_'+obj.id+'" class="list-group-item">'+obj.name+'</li>');
    }
    function renderOffer(obj) {
        $('#receivingOptionsList').append('<li id="option_'+cleanId(obj.id)+'" class="list-group-item"><span class="badge">'+obj.amount.BTC+' BTC</span>'+obj.bankName+' <span class="pull-right text-muted">'+obj.amount.bits+' bits&nbsp;&nbsp;</span></li>');
    }
    function cleanId(id) {
        return id.replace(/\=/g, '');
    }
    function setRequestHeader(request) {
        var token = getVal('#authToken');
        if (token != '') {
            request.setRequestHeader('x-coins-api-token', token);
            //   request.setRequestHeader('content-type', 'application/json');
            request.cross;
        }
    }
    function initPhone() {
        return "941" + (Math.floor(Math.random()*9000000) + 1000000);
    }

    var actions = {
        authUser: function () {
            var postData = {
                'phone': getVal('#phone'),
                'email': getVal('#email'),
                'password': getVal('#password')
            };
            setJson('#step0Post', postData);
            $.ajax({
                url: getVal('#apiUrl') + '/api/v1/auth/',
                data: postData,
                method: 'POST',
                success: function(data) {
                    setJson('#step0Response', data);
                    setText('#phoneUrl', (data.phone[0]=='+'?data.phone.substring(1):data.phone))
                },
                complete: function(xhr, textStatus) {
                    setText('#step0Code', 'RESPONSE '+xhr.status+' '+textStatus);
                }
            });
        },
        getAuthToken: function () {
            var phone = getVal('#phone');
            var postData = {
                'password': getVal('#password')
            };
            setJson('#step1Post', postData);
            $.ajax({
                url: getVal('#apiUrl') + '/api/v1/auth/' + (phone[0]=='+'?phone.substring(1):phone) + '/authorize/',
                data: postData,
                method: 'POST',
                success: function(data) {
                    setJson('#step1Response', data);
                    setVal('#authToken', data.token);
                },
                complete: function(xhr, textStatus) {
                    setText('#step0Code', 'RESPONSE '+xhr.status+' '+textStatus);
                }
            });
        },
        getReceivingOptions: function () {
            var getUrl;
            if (getVal('#country')) {
                getUrl = getVal('#apiUrl') + '/api/v1/banks/?country=' + getVal('#country').toLowerCase();
            } else {
                getUrl = getVal('#apiUrl') + '/api/v1/banks/'
            }
            setText('#step2Url', 'GET ' + getUrl);
            $.ajax({
                url: getUrl,
                success: function(data) {
                    banks = data;
                    setJson('#step2Response', data);
                    displayBankOptions(data);
                },
                complete: function(xhr, textStatus) {
                    setText('#step2Code', 'RESPONSE '+xhr.status+' '+textStatus);
                }
            });
        },
        getMarkets: function () {
            var pricingUrl = getVal('#apiUrl') + '/api/v1/markets/' + getCrypto() + '/USD/';
            setText('#pricingUrl', 'POST ' + pricingUrl);
            $.ajax({
                url: pricingUrl,
                success: function(data) {
                    setJson('#pricingResponse', data);
                    displayMarketOptions(data);
                },
                complete: function(xhr, textStatus) {
                    setText('#pricingCode', 'RESPONSE '+xhr.status+' '+textStatus);
                }
            });
        },
        adCreate: function  () {
            setText('#step3Header', 'HEADER X-Coins-Api-Token: '+getVal('#authToken'))
            var postData = {
                'phone': getVal('#phone').substring(2),
                'email': getVal('#email'),
                'phoneCode': '1',
                'bankBusiness': getVal('#banks'),
                'sellCrypto': getCrypto(),
                'userEnabled': true
            };
            postData = getPricingPostData(postData);
            if (payFields!=undefined) {
                postData = getPostDataFromPayFields(postData);
            } else {
                postData.name = getVal('#name_pay');
                postData.number = getVal('#number_pay');
                postData.number2 = getVal('#number2_pay');
            }
            setJson('#step3Post', postData);
            $.ajax({
                url: getVal('#apiUrl') + '/api/adcreate/',
                data: postData,
                beforeSend: setRequestHeader,
                method: 'POST',
                success: function(data) {
                    setJson('#step3Response', data);
                    setVal('#adId', data.id);
                    setText('#step6Put', 'PUT ' + getVal('#apiUrl') + '/api/v1/ad/' + data.id + '/')
                },
                complete: function(xhr, textStatus) {
                    setText('#step3Code', 'RESPONSE '+xhr.status+' '+textStatus);
                }
            });
        },
        sendSms: function () {
            setText('#step4Header', 'HEADER X-Coins-Api-Token: '+getVal('#authToken'))
            var postData = {
                'phone': getVal('#phone').substring(2),
                'ad_id': getVal('#adId')
            };
            setJson('#step4Post', postData);
            $.ajax({
                url: getVal('#apiUrl') + '/api/sendVerification/',
                data: postData,
                beforeSend: setRequestHeader,
                method: 'POST',
                success: function(data) {
                    setVal('#smsCode', data.__CASH_CODE)
                    setJson('#step4Response', data);
                },
                complete: function(xhr, textStatus) {
                    setText('#step4Code', 'RESPONSE '+xhr.status+' '+textStatus);
                }
            });
        },
        verifyAd: function () {
            setText('#step5Header', 'HEADER X-Coins-Api-Token: '+getVal('#authToken'))
            var postData = {
                'phone': getVal('#phone'),
                'ad_id': getVal('#adId'),
                'code': getVal('#smsCode')
            };
            setJson('#step5Post', postData);
            $.ajax({
                url: getVal('#apiUrl') + '/api/verifyAd/',
                data: postData,
                beforeSend: setRequestHeader,
                method: 'POST',
                success: function(data) {
                    setJson('#step5Response', data);
                    $('#qrcode').qrcode(data.fundingAddress);
                },
                complete: function(xhr, textStatus) {
                    setText('#step5Code', 'RESPONSE '+xhr.status+' '+textStatus);
                }
            });
        },
        getBalance: function () {
            $.ajax({
                url: getVal('#apiUrl') + '/api/v1/ad/' + getVal('#adId') + '/pendingBalance/',
                beforeSend: setRequestHeader,
                method: 'GET',
                success: function(data) {
                    setText('#pendingBalance', 'Balance: ' + data.balance);
                }
            });
        },
        getDeposits: function () {
            $.ajax({
                url: getVal('#apiUrl') + '/api/v1/ad/' + getVal('#adId') + '/',
                beforeSend: setRequestHeader,
                method: 'GET',
                success: function(data) {
                    setText('#pendingDeposits', 'Deposits: ' + data.publicBalance);
                }
            });
        },
        updateAdRate: function () {
            setText('#step6Header', 'HEADER X-Coins-Api-Token: '+getVal('#authToken'))
            var postData = {
                'adId': getVal('#adId'),
                'currentPrice': getVal('#price2')
            };
            postData = getPricingPostData2(postData);
            setJson('#step6Post', postData);
            $.ajax({
                url: getVal('#apiUrl') + '/api/v1/ad/' + getVal('#adId') + '/',
                data: postData,
                beforeSend: setRequestHeader,
                method: 'PUT',
                success: function(data) {
                    setJson('#step6Response', data);
                },
                complete: function(xhr, textStatus) {
                    setText('#step6Code', 'RESPONSE '+xhr.status+' '+textStatus);
                }
            });
        },
        incomingPayments: function () {
            setText('#step7Header', 'HEADER X-Coins-Api-Token: '+getVal('#authToken'))
            $.ajax({
                url: getVal('#apiUrl') + '/api/v1/incomingOrders/',
                beforeSend: setRequestHeader,
                method: 'GET',
                success: function(data) {
                    setJson('#step7Response', data);
                },
                complete: function(xhr, textStatus) {
                    setText('#step7Code', 'RESPONSE '+xhr.status+' '+textStatus);
                }
            });
        },
        confirm: function () {
            var confirmUrl = getVal('#apiUrl') + '/api/v1/incomingOrders/' + getVal('#orderId') + '/confirmDeposit/';
            setText('#confirmHeader', 'HEADER X-Coins-Api-Token: '+getVal('#authToken'));
            setText('#confirmUrl', 'POST ' + confirmUrl);
            $.ajax({
                url: confirmUrl,
                beforeSend: setRequestHeader,
                method: 'POST',
                success: function(data) {
                    setJson('#confirmResponse', data);
                },
                complete: function(xhr, textStatus) {
                    setText('#confirmCode', 'RESPONSE '+xhr.status+' '+textStatus);
                }
            });
        },
        deny: function () {
            var denyUrl = getVal('#apiUrl') + '/api/v1/incomingOrders/' + getVal('#orderId') + '/invalidateDeposit/';
            setText('#confirmHeader', 'HEADER X-Coins-Api-Token: '+getVal('#authToken'));
            setText('#confirmUrl', 'POST ' + denyUrl);
            $.ajax({
                url: denyUrl,
                beforeSend: setRequestHeader,
                method: 'POST',
                success: function(data) {
                    setJson('#confirmResponse', data);
                },
                complete: function(xhr, textStatus) {
                    setText('#confirmCode', 'RESPONSE '+xhr.status+' '+textStatus);
                }
            });
        },
        getBanks: function () {
            var reqUrl = getVal('#apiUrl')+'/api/v1/banks/';
            setText('#banksUrl', 'GET '+reqUrl);
            $.ajax({
                url: reqUrl,
                success: function(data) {
                    setJson('#banksResponse', data);
                    displayBankOptions(data)
                },
                complete: function(xhr, textStatus) {
                    setText('#banksCode', 'RESPONSE '+xhr.status+' '+textStatus);
                }
            });
        },
        geolocation: function () {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(savePosition);
            }else{
                setText('#geoError', 'No browser geolocation available.');
            }
        },
        discovery: function () {
            var reqUrl = getVal('#apiUrl')+'/api/v1/discoveryInputs/';
            setText('#step0Url', 'POST '+reqUrl);
            var postData = {
                'publisherId': getVal('#publisherId'),
                'cryptoAddress': getVal('#cryptoAddress'),
                'browserLocation': coords,
                'usdAmount': getVal('#amount'),
                'crypto': getCrypto(),
                'bank': getVal('#banks'),
                'zipCode': getVal('#zip')
            };
            setJson('#step0Post', postData);
            $.ajax({
                url: reqUrl,
                data: postData,
                method: 'POST',
                success: function(data) {
                    setJson('#step0Response', data);
                    setVal('#discoveryId', data.id);
                    setText('#step1Url', 'GET '+reqUrl+data.id+'/offers/');
                },
                complete: function(xhr, textStatus) {
                    setText('#step0Code', 'RESPONSE '+xhr.status+' '+textStatus);
                }
            });
        },
        getOffers: function () {
            $.ajax({
                url: getVal('#apiUrl')+'/api/v1/discoveryInputs/'+getVal('#discoveryId')+'/offers/',
                success: function(data) {
                    $('#offerHelp').show();
                    setJson('#step1Response', data);
                    var offers = _.concat(data.singleDeposit, data.doubleDeposit, data.multipleBanks);
                    displayRecievingOptions(offers, true)
                },
                complete: function(xhr, textStatus) {
                    setText('#step1Code', 'RESPONSE '+xhr.status+' '+textStatus);
                }
            });
        },
        createHold: function () {
            if (getVal('#authToken').length>20){
                $('#step2Header').show()
                setText('#step2Header', 'HEADER X-Coins-Api-Token: '+getVal('#authToken'));
            }
            var reqUrl = getVal('#apiUrl')+'/api/v1/holds/';
            var offerId = getReceivingOption();
            if (!offerId)
                return alert('Please select an offer.');
            setText('#step2Url', 'POST '+reqUrl);
            var postData = {
                publisherId: getVal('#publisherId'),
                offer: offerId+'==',
                phone: getVal('#phone'),
                deviceName: getVal('#deviceName'),
                deviceCode: getVal('#deviceCode')
            };
            setJson('#step2Post', postData);
            $.ajax({
                url: reqUrl,
                data: postData,
                beforeSend: (getVal('#authToken').length>20?setRequestHeader:null),
                method: 'POST',
                success: function(data) {
                    setJson('#step2Response', data);
                    setVal('#smsCode', data.code);
                    setVal('#holdId', data.id);
                    setVal('#authToken', data.token);
                    setText('#step3Url', 'POST '+reqUrl+data.id+'/capture/');
                },
                complete: function(xhr, textStatus) {
                    setText('#step2Code', 'RESPONSE '+xhr.status+' '+textStatus);
                }
            });
        },
        captureHold: function () {
            setText('#step3Header', 'HEADER X-Coins-Api-Token: '+getVal('#authToken'));
            var postData = {
                publisherId: getVal('#publisherId'),
                verificationCode: getVal('#smsCode')
            };
            setJson('#step3Post', postData);
            $.ajax({
                url: getVal('#apiUrl')+'/api/v1/holds/'+getVal('#holdId')+'/capture/',
                data: postData,
                beforeSend: setRequestHeader,
                method: 'POST',
                success: function(data) {
                    setJson('#step3Response', data);
                    setVal('#orderId', data[0].id);
                    setText('#step4Url', 'POST '+getVal('#apiUrl')+'/api/v1/orders/'+data[0].id+'/confirmDeposit/');
                    setText('#step5Url', 'DELETE '+getVal('#apiUrl')+'/api/v1/orders/'+data[0].id+'/');
                },
                complete: function(xhr, textStatus) {
                    setText('#step3Code', 'RESPONSE '+xhr.status+' '+textStatus);
                }
            });
        },
        confirmDeposit: function () {
            setText('#step4Header', 'HEADER X-Coins-Api-Token: '+getVal('#authToken'))
            $.ajax({
                url: getVal('#apiUrl')+'/api/v1/orders/'+getVal('#orderId')+'/confirmDeposit/',
                beforeSend: setRequestHeader,
                method: 'POST',
                success: function(data) {
                    setJson('#step4Response', data);
                },
                complete: function(xhr, textStatus) {
                    setText('#step4Code', 'RESPONSE '+xhr.status+' '+textStatus);
                }
            });
        },
        cancelOrder: function () {
            setText('#cancelHeader', 'HEADER X-Coins-Api-Token: '+getVal('#authToken'))
            $.ajax({
                url: getVal('#apiUrl')+'/api/v1/orders/'+getVal('#orderId')+'/',
                beforeSend: setRequestHeader,
                method: 'DELETE',
                success: function(data) {
                    setJson('#cancelResponse', data);
                },
                complete: function(xhr, textStatus) {
                    setText('#cancelCode', 'RESPONSE '+xhr.status+' '+textStatus);
                }
            });
        },
        getOrders: function () {
            setText('#ordersHeader', 'HEADER X-Coins-Api-Token: '+getVal('#authToken'))
            setText('#ordersUrl', 'GET '+getVal('#apiUrl')+'/api/v1/orders/');
            $.ajax({
                url: getVal('#apiUrl')+'/api/v1/orders/',
                beforeSend: setRequestHeader,
                success: function(data) {
                    setJson('#ordersResponse', data);
                },
                complete: function(xhr, textStatus) {
                    setText('#ordersCode', 'RESPONSE '+xhr.status+' '+textStatus);
                }
            });
        }
    }

    function init() {
        $('[data-toggle="tooltip"]').tooltip();
        var clickHandlers = [
            'geolocation',
            'getAuthToken',
            'authUser',
            'getReceivingOptions',
            'adCreate',
            'sendSms',
            'verifyAd',
            'getBalance',
            'getDeposits',
            'updateAdRate',
            'incomingPayments',
            'confirm',
            'getBanks',
            'discovery',
            'getOffers',
            'createHold',
            'captureHold',
            'confirmDeposit',
            'cancelOrder',
            'getOrders'
        ];
        for (var i=0;i<clickHandlers.length;i++){
            $('#'+clickHandlers[i]+'Btn').click(actions[clickHandlers[i]]);
        }
        $('#dynamicPricingCheckbox').change(dynamicPricingToggle);
        $('#dynamicPricingCheckbox2').change(dynamicPricingToggle2);
        var phone = initPhone();
        setVal('#phone', '+1'+phone);
        setVal('#deviceCode', phone+phone+phone+phone+phone);
        setVal('#email', 'demo@geni.to');
    }

    init();
})();
