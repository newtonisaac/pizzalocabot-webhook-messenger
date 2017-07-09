
const 
  bodyParser = require('body-parser'),
  config = require('config'),
  crypto = require('crypto'),
  express = require('express'),
  https = require('https'),  
  request = require('request');


var api_messager = require("./app");
var sync_request = require('sync-request');


// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
  (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
  config.get('pageAccessToken');

// URL where the app is running (include protocol). Used to point to scripts and 
// assets located at this address. 
const SERVER_URL = (process.env.SERVER_URL) ?
  (process.env.SERVER_URL) :
  config.get('serverURL');


 
//inforações do usuário
var user;



exports.setup_bot = function() {
   
   
   // get started setup
   request.post({
        headers: {'content-type' : 'application/json'},
        url:     "https://graph.facebook.com/v2.6/me/messenger_profile?access_token="+PAGE_ACCESS_TOKEN,
        json: true,
        body:    {  "whitelisted_domains":[
                        "https://pizzaloca-bot-newtonisaac.c9users.io/botview"
                ]}
    }, function (error, response, body) {
     
        console.log("\nLiberando dominio "+body.result);
    });
   
   // get started setup
   request.post({
        headers: {'content-type' : 'application/json'},
        url:     "https://graph.facebook.com/v2.6/me/messenger_profile?access_token="+PAGE_ACCESS_TOKEN,
        json: true,
        body:    { 
                    "get_started":{
                        "payload":"GET_STARTED_PAYLOAD"
                        }
                }        
    }, function (error, response, body) {
     
        console.log("\nGet started button configured: "+body.result);
    }); 
    
   // saudação inicial
   request.post({
        headers: {'content-type' : 'application/json'},
        url:     "https://graph.facebook.com/v2.6/me/messenger_profile?access_token="+PAGE_ACCESS_TOKEN,
        json: true,
        body: {
                  "greeting":[
                    {
                      "locale":"default",
                      "text":"Oi {{user_first_name}}! Bem-vindo! "
                    }, {
                      "locale":"en_US",
                      "text":"Hello {{user_first_name}}! Welcome! "
                    }
                  ] 
                }
    }, function (error, response, body) {
     
        console.log("\nGreetings initial configured: " + body.result );
    }); 
   
 
   // Persistence menu
   request.post({
        headers: {'content-type' : 'application/json'},
        url:    "https://graph.facebook.com/v2.6/me/messenger_profile?access_token="+PAGE_ACCESS_TOKEN,
        json: true,
        body: {
                  "persistent_menu":[
                    {
                      "locale":"default",
                      "composer_input_disabled":true,
                      "call_to_actions":[
                        {
                          "type":"web_url",
                          "title":"Cardápio",
                          "url":"https://pizzaloca-bot-newtonisaac.c9users.io/botview",
                          "webview_height_ratio": "tall",
                          "messenger_extensions": true
                        },
                        {
                          "type":"postback",
                          "title":"Promoções",
                          "payload":"PROMO"
                        },
                        {
                          "title":"Informações",
                          "type":"nested",
                          "call_to_actions":[
                            {
                              "title":"Conheça-nos - Video",
                              "type":"postback",
                              "payload":"VIDEO"
                            },
                            {
                              "title":"Ligar",
                              "type":"postback",
                              "payload":"LIGAR"
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "locale":"zh_CN",
                      "composer_input_disabled":false
                    }
                  ]
                }
 
    }, function (error, response, body) {
     
        console.log("\nPersistence menu configured: " + body.result);
    }); 
   
} 
 
 
 
    exports.receivedQuickReply = function(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfPostback = event.timestamp;
        var payload = event.message.quick_reply.payload;
        console.log(JSON.stringify(event))
        var item = event.message.text;
        
        if(payload == "PROMOITEM"){
          get_userInfo(senderID);
          api_messager.sendReceiptMessage(senderID,item,user.first_name);
          
          api_messager.sendQuickReply(senderID,"Para finalizar precisamos apenas da sua localização." ,
            [
              {
                "content_type":"location",
              }
            ]
          );
        }
        
    }
 
 
 
 exports.receivedLocation = function(event) {
    
    console.log(JSON.stringify(event))
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;
        
        
    get_userInfo(senderID);
        
    api_messager.sendTextMessage(senderID, "Muito bem "+ user.first_name + "! Obrigado por confiar em nós, o pedido ja foi enviado para sua casa.")
    api_messager.sendGifMessage(senderID,"/assets/entrega.gif");
    api_messager.sendGenericMessage(senderID,
          [
           {
            "title":"Teminamos",
            "image_url":SERVER_URL +"/assets/volte.jpg",
            "subtitle":"Você deseja realizar outro pedido?",
            "buttons":[
              {
                "type":"postback",
                "title":"Sim",
                "payload":"GET_STARTED_PAYLOAD"
              }              
            ]      
           }
        ]
      );    
    
 }
 
 
  exports.receivedPostback = function(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfPostback = event.timestamp;
        var payload = event.postback.payload;
        
        console.log(JSON.stringify(event));
        
        
        if(payload == "GET_STARTED_PAYLOAD"){
            get_userInfo(senderID);
            
            api_messager.sendGenericMessage(senderID,
                        [
               {
                "title":"Hey " + user.first_name+ ", bem-vindo a PìzzaLoca Sobral",
                "image_url": SERVER_URL + "/assets/pizzacapa.jpg",
                "subtitle":"Sou o PizzaBot e vou ajudar você a fazer um pedido. O que deseja ver primeiro?",
                "buttons":[
                 {
                          "type":"web_url",
                          "title":"Cardápio",
                          "url":"https://pizzaloca-bot-newtonisaac.c9users.io/botview",
                          "webview_height_ratio": "tall",
                          "messenger_extensions": true
                        },
                  {
                    "type":"postback",
                    "title":"Promoções",
                    "payload":"PROMO"
                  }
                ]      
              }
            ]);
        }
        
        if(payload == "VIDEO"){
            api_messager.sendVideoMessage(senderID,"/assets/pizzavideo.mp4")
        }
        if(payload == "LIGAR"){
            api_messager.sendButtonMessage(senderID,"Deseja ligar para conhecer a pizzaria ou fazer um pedido?",[
                {
                  "type":"phone_number",
                  "title":"Ligar para pizzaria",
                  "payload":"88999290280"
                }
                ])
        }
        
        if(payload == "PROMO"){
            api_messager.sendList(senderID,[
                    {
                        "title": "Promoção 1",
                        "image_url": SERVER_URL+"/assets/pizzapromo.jpg",
                        "subtitle": "Pizza grande calabresa + coca cola - RS 25.00"
                    },
                    {
                        "title": "Promoção 2",
                        "image_url": SERVER_URL+"/assets/pizzapromo.jpg",
                        "subtitle": "Pizza grande 4 queijos + refrigerante 2l - RS 30.00"
                    },
                    {
                        "title": "Promoção 3",
                        "image_url": SERVER_URL+"/assets/pizzapromo.jpg",
                        "subtitle": "Pizza grande portuguesa + refrigerante 2l - RS 35.00"
                    },
                    {
                        "title": "Promoção 4",
                        "image_url": SERVER_URL+"/assets/pizzapromo.jpg",
                        "subtitle": "Pizza grande mista + refrigerante 2l - RS 25.00"
                    }
                ],
                 [ 
                    {
                          "type":"web_url",
                          "title":"Cardápio",
                          "url":"https://pizzaloca-bot-newtonisaac.c9users.io/botview",
                          "webview_height_ratio": "tall",
                          "messenger_extensions": true
                    }
                ]
            );
          
          api_messager.sendQuickReply(senderID,"Você deseja qual promoção?" ,[
        {
          "content_type":"text",
          "title":"Promo 1",
          "payload":"PROMOITEM"
        },
        {
          "content_type":"text",
          "title":"Promo 2",
          "payload":"PROMOITEM"
        },
        {
          "content_type":"text",
          "title":"Promo 3",
          "payload":"PROMOITEM"
        },
        {
          "content_type":"text",
          "title":"Promo 4",
          "payload":"PROMOITEM"
        }
      ]);
    }
      
      if(payload.slice(0,3) == "BUY"){
        var pizzaID =payload.slice(3,4);
        var tam = payload.slice(4,payload.length);
        get_userInfo(senderID);
        api_messager.sendReceiptMessage(senderID,"pizza" + pizzaID + " "+tam,user.first_name);
          
        api_messager.sendQuickReply(senderID,"Para finalizar precisamos apenas da sua localização." ,
            [
              {
                "content_type":"location",
              }
            ]
          );
          
      }
        
      if(payload == "CARDAPIO"){
            var tam = event.value;
            
            var list_pizza = [];
            
            for (var i = 10;  i--; ) {
              var item = {
                "title":"Sabor "+i+" "+tam,
                "image_url": SERVER_URL + "/assets/pizzacapa.jpg",
                "subtitle":"presunto, queijo, massa, bacon, molho especial",
                "buttons":[
                 {
                    "type":"postback",
                    "title":"Comprar Pizza"+i,
                    "payload": "BUY"+i+tam
                  }
                ]      
              }
              list_pizza.push( item );
              
            }
            
            api_messager.sendGenericMessage(senderID,list_pizza);
        }
    }
    
   function get_userInfo(userId){
       var response = sync_request('GET', "https://graph.facebook.com/v2.6/" + userId+ "?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token="+PAGE_ACCESS_TOKEN); 
       console.log(JSON.parse(response.getBody('utf8')));
       user = JSON.parse(response.getBody('utf8'));
     
   }
   
  