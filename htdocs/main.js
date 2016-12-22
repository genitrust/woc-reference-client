(function() {
    var retry = 0;
    function getVal(id){
        return $(id).val();
    }
    function setVal(id, val){
        return $(id).val(val);
    }
    function setText(id, val){
        return $(id).text(val);
    }
    function setJson(id, val){
        return $(id).text(JSON.stringify(val, null, 2));
    }
    function getCrypto() {
        return ($('#crypto').is(':checked')?'DASH':'BTC');
    }
    function getRecievingOption() {
        var id = $('#receivingOptionsList .active').attr('id');
        if (id)
            return id.substring(7);
        return false;
    }
    function displayRecievingOptions(options, offers) {
        $('#receivingOptionsList').html("");
        for(var i=0;i<options.length;i++){
            if (offers)
                renderOffer(options[i]);
            else
                renderOption(options[i]);
        }
        $('#receivingOptionsList li').on('click', selectOption);
    }
    function displayBankOptions(options) {
        $('#banks').html('<option value=""></option>');
        for(var i=0;i<options.length;i++){
            $('#banks').append('<option value="'+options[i].id+'">'+options[i].name+'</option>');
        }
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
            // request.setRequestHeader('content-type', 'application/json');
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
                }
            });
        },
        getRecievingOptions: function () {
            $.ajax({
                url: getVal('#apiUrl') + '/api/v1/banks/',
                success: function(data) {
                    setJson('#step2Response', data);
                    displayRecievingOptions(data);
                }
            });
        },
        adCreate: function  () {
            setText('#step3Header', 'HEADER X-Coins-Api-Token: '+getVal('#authToken'))
            var postData = {
                'phone': getVal('#phone').substring(2),
                'email': getVal('#email'),
                'name': getVal('#name'),
                'phoneCode': '1',
                'bankBusiness': getRecievingOption(),
                'number': getVal('#number'),
                'number2': getVal('#number2'),
                'sellCrypto': getCrypto(),
                'currentPrice': getVal('#price')
            };
            setJson('#step3Post', postData);
            $.ajax({
                url: getVal('#apiUrl') + '/api/adcreate/',
                data: postData,
                beforeSend: setRequestHeader,
                method: 'POST',
                success: function(data) {
                    setJson('#step3Response', data);
                    setVal('#adId', data.id);
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
                }
            });
        },
        updateAdRate: function () {
            setText('#step6Header', 'HEADER X-Coins-Api-Token: '+getVal('#authToken'))
            var postData = {
                'adId': getVal('#adId'),
                'rate': getVal('#updatedAdRate')
            };
            setJson('#step6Post', postData);
            $.ajax({
                url: getVal('#apiUrl') + '/api/updateAdRate/',
                data: postData,
                beforeSend: setRequestHeader,
                method: 'PUT',
                success: function(data) {
                    setJson('#step6Response', data);
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
        discovery: function () {
            var reqUrl = getVal('#apiUrl')+'/api/v1/discoveryInputs/';
            setText('#step0Url', 'POST '+reqUrl);
            var postData = {
                'publisherId': getVal('#publisherId'),
                'phone': getVal('#phone'),
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
            var reqUrl = getVal('#apiUrl')+'/api/v1/holds/';
            var offerId = getRecievingOption();
            if (!offerId)
                return alert('Please select an offer.');
            setText('#step2Url', 'POST '+reqUrl);
            var postData = {
                publisherId: getVal('#publisherId'),
                offer: offerId+'='+(retry==1?'=':''),
                phone: getVal('#phone'),
                deviceName: getVal('#deviceName'),
                deviceCode: getVal('#deviceCode')
            };
            setJson('#step2Post', postData);
            $.ajax({
                url: reqUrl,
                data: postData,
                method: 'POST',
                success: function(data) {
                    retry = 0;
                    setJson('#step2Response', data);
                    setVal('#smsCode', data.code);
                    setVal('#holdId', data.id);
                    setVal('#authToken', data.token);
                    setText('#step3Url', 'POST '+reqUrl+data.id+'/capture/');
                },
                complete: function(xhr, textStatus) {
                    setText('#step2Code', 'RESPONSE '+xhr.status+' '+textStatus);
                    if (xhr.status==500||textStatus=='error'){
                        retry++;
                        actions.createHold();
                    }
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
            'getAuthToken',
            'authUser',
            'getRecievingOptions',
            'adCreate',
            'sendSms',
            'verifyAd',
            'updateAdRate',
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
        var phone = initPhone();
        setVal('#phone', '+1'+phone);
        setVal('#deviceCode', phone+phone+phone+phone+phone);
        setVal('#email', 'demo@geni.to');
    }

    init();
})();
