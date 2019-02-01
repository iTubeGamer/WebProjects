"use strict";

const htmlparser = require("htmlparser2");
const Client = require('node-rest-client').Client;
const express = require("express");
const querystring = require('querystring');
const config = require('./config');
const retry=60000;
const pause=1000;
const base_uri_ft_article = 'https://www.ft.com';
const base_uri_ft_search = 'https://www.ft.com/search?q=';
const suffix_ft_search = '&sort=date';

var last_article = Date.now();
var client = new Client();
//var app = express();
var link_incoming = false;
var article_id;
var current_searchterm;

var parser = new htmlparser.Parser({
	onopentag: function(name, attribs){
        if(name === "time" 
			&& attribs.class === "o-teaser__timestamp-date"
			&& Date.parse(attribs.datetime) > last_article){
            client.get(config.base_uri_telegram + querystring.escape('neuer Artikel zu Wirecard: ' + base_uri_ft_article + article_id), (data) => {});
			console.log('neuer FT-Artikel zu Wirecard: ' + base_uri_ft_article + article_id);
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
			console.log('Done with: ' + current_searchterm);
		}
    }
}, {decodeEntities: true});


function checkArticles(){	
	let start = Date.now();
	console.log('Starting article-check');
	for(let i=0; i < config.searchterms.length; i++){
		current_searchterm = config.searchterms[i];
		checkBySearchterm(config.searchterms[i]);	
	}
	console.log('Finished article-check. Time: ' + ((Date.now() - start) / 1000) + 'sec');
}

function checkBySearchterm(searchterm){
	console.log('Starting check for: ' + searchterm);
	client.get(base_uri_ft_search + querystring.escape(searchterm) + suffix_ft_search, (data, response) => {
		parser.write(data);
	});
}

setInterval(checkArticles, retry);		
