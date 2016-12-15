(function() {

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

    function authUser () {
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
    }

    function getAuthToken () {
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
    }

    function getRecievingOptions () {
        $.ajax({
            url: getVal('#apiUrl') + '/api/v1/banks/',
            success: function(data) {
                setJson('#step2Response', data);
                displayRecievingOptions(data);
            }
        });
    }

    function adCreate () {
        setText('#step3Header', 'HEADER X-Coins-Api-Token: '+getVal('#authToken'))
        var postData = {
            'phone': getVal('#phone').substring(2),
            'email': getVal('#email'),
            'name': getVal('#name'),
            'phoneCode': '1',
            'bankBusiness': $('#receivingOptionsList .active').attr('id').substring(7),
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
            method: 'PUT',
            success: function(data) {
                setJson('#step3Response', data);
            }
        });
    }

    function sendSms () {
        setText('#step4Header', 'HEADER X-Coins-Api-Token: '+getVal('#authToken'))
        var postData = {
            'phone': getVal('#phone'),
            'ad_id': getVal('#adId')
        };
        setJson('#step4Post', postData);
        $.ajax({
            url: getVal('#apiUrl') + '/api/sendVerification/',
            data: postData,
            beforeSend: setRequestHeader,
            method: 'PUT',
            success: function(data) {
                setJson('#step4Response', data);
            }
        });
    }

    function displayRecievingOptions(options) {
        $('#receivingOptionsList').html("");
        for(var i=0;i<options.length;i++)
            renderOption(options[i]);
        $('#receivingOptionsList li').on('click', selectOption);
    }

    function setRequestHeader(request) {
        var token = getVal('#authToken');
        if (token != '') {
            request.setRequestHeader('X-Coins-Api-Token', token);
            request.cross;
        }
    }

    function selectOption(e) {
        $('.list-group-item').removeClass('active');
        $('#'+e.target.id).addClass('active');
        console.log($('#receivingOptionsList .active').attr('id'));
    }

    function renderOption(obj) {
        $('#receivingOptionsList').append('<li id="option_'+obj.id+'" class="list-group-item">'+obj.name+'</li>');
    }

    function initPhone() {
        return "+1941" + (Math.floor(Math.random()*9000000) + 1000000);
    }

    function init() {
        $('[data-toggle="tooltip"]').tooltip();
        $('#getAuthTokenBtn').click(getAuthToken);
        $('#authUserBtn').click(authUser);
        $('#getRecievingOptionsBtn').click(getRecievingOptions);
        $('#adCreateBtn').click(adCreate);
        $('#sendSmsBtn').click(sendSms);
        setVal('#phone', initPhone());
        setVal('#email', 'demo@geni.to');
    }

    init();
})();
