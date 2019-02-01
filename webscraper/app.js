"use strict";

const htmlparser = require("htmlparser2");
const Client = require('node-rest-client').Client;
const querystring = require('querystring');
const config = require('./config');
const retry=1000;
const base_uri_ft = 'https://www.ft.com';

var last_article = Date.now() - 36400000;
var client = new Client();
var link_incoming = false;
var article_id;

var parser = new htmlparser.Parser({
	onopentag: function(name, attribs){
        if(name === "time" 
			&& attribs.class === "o-teaser__timestamp-date"
			&& Date.parse(attribs.datetime) > last_article){
            client.get(config.base_uri_telegram + querystring.escape('neuer FT-Artikel zu Wirecard: ' + base_uri_ft + article_id), function(data,response){console.log(data)});
			console.log('neuer FT-Artikel zu Wirecard: ' + base_uri_ft + article_id);
        }
		if(name === "div" && attribs.class ==="o-teaser__heading"){
			link_incoming = true;
		}
		if(link_incoming === true && name === "a"){
			link_incoming = false;
			article_id = attribs.href;
		}
	},
	onclosetag: function(name, attribs){
		if(name === "main"){
			last_article = Date.now();
			console.log('Done');
		}
    }
	}, {decodeEntities: true});


function checkArticles(){	
	console.log('Starting check');
	client.get('https://www.ft.com/search?q=Wirecard%20AG&sort=date', function (data, response) {
		console.log('parsing');
		parser.write(data);
	})

}

setInterval(checkArticles, 30000);		
