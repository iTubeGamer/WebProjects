"use strict";

const htmlparser = require("htmlparser2");
const fs = require('fs');
const Client = require('node-rest-client').Client;
const querystring = require('querystring');
const config = require('./config');
const retry=30000;
const pause=1000;
const base_uri_ft_article = 'https://www.ft.com';
const base_uri_ft_search = 'https://www.ft.com/search?q=';
const suffix_ft_search = '&sort=date';

var client = new Client();
var link_incoming = false;
var article_id;
var current_searchterm;
var values = loadValues();
var new_last_checked = 0;

setInterval(checkArticles, retry);

var parser = new htmlparser.Parser({
	onopentag: function(name, attribs){
        if(name === "time" 
			&& attribs.class === "o-teaser__timestamp-date"){
			let article_time = Date.parse(attribs.datetime);
			if( values.last_checked[current_searchterm] === -1){
				values.last_checked[current_searchterm] = article_time;
				parser.parseComplete();
			} else if( article_time > values.last_checked[current_searchterm]){
				client.get(config.base_uri_telegram + querystring.escape('neuer Artikel zu' + current_searchterm + ': ' + base_uri_ft_article + article_id), (data) => {});
				console.log('neuer FT-Artikel zu ' + current_searchterm + ': ' + base_uri_ft_article + article_id);
				if(article_time > new_last_checked){
					new_last_checked = article_time;
					};
			} else {
				console.log('Article already checked, finished: ' + current_searchterm);
				parser.parseComplete();
			}
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
			parser.parseComplete();
		}
	},
	onend: function(){
		if(new_last_checked > 0){
			values.last_checked[current_searchterm] = new_last_checked;
			new_last_checked = 0;
		}
		console.log('Done with: ' + current_searchterm);
    }
}, {decodeEntities: true});


function checkArticles(){
	var start = Date.now();
	console.log('<---Updating searchterms--->');
	client.get(config.uri_telegram_update, async function(response, data){	
		console.log('Starting article-check');
		parseTelegramUpdates(response);
		for(let i=0; i < values.searchterms.length; i++){
			current_searchterm = values.searchterms[i];
			await checkBySearchterm(values.searchterms[i]);	
		}
		saveValues();
		console.log('Finished article-check. Time: ' + ((Date.now() - start) / 1000) + 'sec');
	});
}

function checkBySearchterm(searchterm){
	return new Promise(function(resolve, reject){	
		console.log('Starting check for: ' + searchterm);
			client.get(base_uri_ft_search + querystring.escape(searchterm) + suffix_ft_search, (response, data) => {
				console.log('parsing...');
				parser.write(response);
				resolve();
			});	
	});
}

function parseTelegramUpdates(response){
	let i = response.result.length - 1;
	let updated = [];
	let removed = [];
	while(i >= 0 && response.result[i].update_id !== values.updateId){
		if(response.result[i].message.text.startsWith('/add') && response.result[i].message.text.length >= 8){
			let new_searchterm = response.result[i].message.text.substring(5);
			values.searchterms.push(new_searchterm);
			values.last_checked[new_searchterm] = -1;
			console.log('added new searchterm: ' + new_searchterm);
			updated.push(new_searchterm);
		}
		if(response.result[i].message.text.startsWith('/remove') && response.result[i].message.text.length >= 11){
			let delete_searchterm = response.result[i].message.text.substring(8);
			if(removeSearchterm(delete_searchterm)){
				console.log('removed searchterm: ' + delete_searchterm);
				removed.push(delete_searchterm);
			}
		}
		i--;
	}
	values.updateId = response.result[response.result.length - 1].update_id;
	if(updated.length > 0){
		client.get(config.base_uri_telegram + querystring.escape('Hinzugefügt: ' + updated.join(', ')), (data) => {});
	}
	if(removed.length > 0){
		client.get(config.base_uri_telegram + querystring.escape('Gelöscht: ' + removed.join(', ')), (data) => {});
	}
	if(removed.length > 0 || updated.length > 0){
		client.get(config.base_uri_telegram + querystring.escape('Neue Suchanfragen: ' + values.searchterms.join(', ')), data => {});
	}
}

function removeSearchterm(searchterm){
	var index = values.searchterms.indexOf(searchterm);
	if (index > -1){
		values.searchterms.splice(index, 1);
		delete values.last_checked[searchterm];
		return true;
	}
	return false;
}


function saveValues(){	
	fs.writeFile('values.json', JSON.stringify(values), 'utf8', (err) => {
		if (err){
			console.log(err);
		} else {
			console.log('Saved values');
		}
	});
}

function loadValues(){
	fs.readFile('values.json', 'utf8', function readFileCallback(err, data){
		if (err){
			console.log(err);
		} else {
			values = JSON.parse(data);
			console.log('Values loaded');
		}
	});
}





