"use strict";

const Spearman = require('spearman-rho');
var express = require("express");
const fetch = require("node-fetch");
var UNIVERSE = ['GS', 'MS', 'JPM', 'WFC', 'C', 'BAC', 'BCS', 'DB', 'CS', 'RBS', 'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'FB', 'TWTR', 'NFLX', 'SNAP', 'SPOT', 'DBX', 'SQ', 'SFIX', 'BABA', 'INTC', 'AMD', 'NVDA', 'ORCL'];
const BATCH_SIZE = 100;
const BASE_URL = 'https://api.iextrading.com/1.0/stock/market/batch';


var app = express();

app.get("/matrix", (req, res, next) => {
	
	//get symbols from params
	 if (req.query.symbols){
			UNIVERSE = req.query.symbols.split(',');
			console.log('aha');
	 }
	 
	 console.log('Creating matrix for universe: ' + UNIVERSE.join(','));
	 
	 let promise = createMatrix();
	 console.log(promise); 
	 
	 promise.then(function response(result) {
		 console.log('finished matrix: ' + result);
		 res.json(result);
	 }).catch(function(err){
		 console.error('waduuu häck: ' + err);
	 });
	 
	 
	 
	 
});
app.listen(3000, () => {
 console.log("Server running on port 3000");
});


function createMatrix() {
	
	return new Promise(function(resolve, reject) {
		var chartData = {};
		let numberOfBatches = Math.ceil(UNIVERSE.length / BATCH_SIZE);

		for (let i = 0; i < numberOfBatches; i++) {
		  let symbolsBatch = UNIVERSE.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
		  let filters = ['date', 'close', 'changePercent'];
		  let url = `${BASE_URL}?types=chart&range=5y&symbols=${symbolsBatch.join(',')}&filter=${filters.join(',')}`;
	  
	  
		  fetch(url).then(response => response.json()).then(json => {
				Object.assign(chartData, json);
				
				if(i + 1 === numberOfBatches){
					resolve(calculateMatrix(chartData));
				}
		  }).catch(err => reject(err));   	
		  
		}	  
	  });
}

																						   
function calculateMatrix(chartData){  

	return new Promise(function(resolve, reject) {
	    var corrMatrix = [];      

		for (let i = 0; i < UNIVERSE.length - 1; i++){
			for (let j = i+1; j < UNIVERSE.length; j++){
				let symbol1=UNIVERSE[i];
				let symbol2=UNIVERSE[j];
				let corrPromise = spearmanCoefficient(chartData[symbol1].chart, chartData[symbol2].chart);
				corrPromise.then(function result(corr){
					  console.log(symbol1 + ", " + symbol2 + ", " + corr);
					  corrMatrix.push([symbol1, symbol2, corr]);
					  if((i === UNIVERSE.length - 2) && (j === UNIVERSE.length - 1)){
						  resolve(corrMatrix);
					  }
				}).catch(err => reject(err));
			}
		}
	});
}


function spearmanCoefficient(chart_x, chart_y){
	let x = [];
	let y = [];
	
	let i = 0;
	let j = 0;
	
	while ((i < chart_x.length) && (j < chart_y.length)){
		let date_x = Date.parse(chart_x[i].date);
		let date_y = Date.parse(chart_y[j].date);
		
		if(date_x === date_y){
			x.push(chart_x[i].close);
			y.push(chart_y[j].close);
			i++;
			j++;
		} else if (date_x > date_y) {
			j++;
		} else {
			i++;
		}		
	}	
	
	
	const spearman = new Spearman(x, y);
	
	return spearman.calc();
	  
}
	  	  
/*	
var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "geheim"));
var session = driver.session();

session
  .run('MERGE (james:Person {name : {nameParam} }) RETURN james.name AS name', {nameParam: 'James'})
  .then(function (result) {
    result.records.forEach(function (record) {
      console.log(record.get('name'));
    });
    session.close();
  })
  .catch(function (error) {
    console.log(error);
  });

driver.close();
*/