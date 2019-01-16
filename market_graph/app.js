"use strict";

const Spearman = require('spearman-rho');
var express = require("express");
const fetch = require("node-fetch");
var DEFAULT_UNIVERSE = ['GS', 'MS', 'JPM', 'WFC', 'C', 'BAC', 'BCS', 'DB', 'CS', 'RBS', 'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'FB', 'TWTR', 'NFLX', 'SNAP', 'SPOT', 'DBX', 'SQ', 'SFIX', 'BABA', 'INTC', 'AMD', 'NVDA', 'ORCL'];
const BATCH_SIZE = 100;
const BASE_URL = 'https://api.iextrading.com/1.0/stock/market/batch';


var app = express();

app.get("/matrix", (req, res, next) => {
	var stock_universe = DEFAULT_UNIVERSE;
	
	//get symbols from params
	 if (req.query.symbols){
			stock_universe = req.query.symbols.split(',');
	 } 
	 
	 //load stock Data, calculateMatrix
	 loadAndFormatData(stock_universe).then(function(result){
		 
		 //create stock nodes
		 createStockNodesInDb(result['companyData']);
		 
		 //create relationships
		 
		 //json response with matrix
	 res.json(result['correlationMatrix']);
	 })
	 .catch(err => console.error(err));

});
app.listen(3000, () => {
 console.log("Server running on port 3000");
});


function loadAndFormatData(stock_universe) {
	
	return new Promise(function(resolve, reject) {
		var chartData = {};
		var result = {};
		
		//get stock data in batches
		console.log('loading data for stock universe: ' + stock_universe.join(','));
		let numberOfBatches = Math.ceil(stock_universe.length / BATCH_SIZE);
		for (let i = 0; i < numberOfBatches; i++) {
		  let symbolsBatch = stock_universe.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
		  let filters = ['companyName', 'industry', 'sector', 'tags', 'date', 'close', 'changePercent'];
		  let url = `${BASE_URL}?types=company,chart&range=5y&symbols=${symbolsBatch.join(',')}&filter=${filters.join(',')}`;
	  
		  fetch(url).then(response => response.json()).then(json => {
				//merge json-data in one object: chartData
				Object.assign(chartData, json);
				
				if(i + 1 === numberOfBatches){
					//when all batches are merged: extract company data, calculate correlation matrix
					result['companyData'] = extractCompanyData(stock_universe, chartData);
					calculateMatrix(stock_universe, chartData).then(matrix => {
						//when matrix is calculated: resolve promise
						result['correlationMatrix'] = matrix;
						resolve(result);
					}).catch(err => reject(err));		
				}
		  }).catch(err => reject(err));   	
		  
		}	  
	  });
}

																						   
function calculateMatrix(stock_universe, chartData){  
	
	return new Promise(function(resolve, reject) {
	    var corrMatrix = [];
		console.log('Creating matrix');		

		for (let i = 0; i < stock_universe.length - 1; i++){
			for (let j = i+1; j < stock_universe.length; j++){
				let symbol1=stock_universe[i];
				let symbol2=stock_universe[j];
				let corrPromise = spearmanCoefficient(chartData[symbol1].chart, chartData[symbol2].chart);
				corrPromise.then(function result(corr){
					  corrMatrix.push([symbol1, symbol2, corr]);
					  if((i === stock_universe.length - 2) && (j === stock_universe.length - 1)){
						  resolve(corrMatrix);
					  }
				}).catch(err => reject(err));
			}
		}
	});
}

function extractCompanyData(stock_universe, chartData){
	var companyData = {};
	
	console.log('Formatting company data');	
	
	stock_universe.forEach(symbol => {
		companyData[symbol] = chartData[symbol].company;
	});
	
	return companyData;
}

function spearmanCoefficient(chart_x, chart_y){
	let x = [];
	let y = [];
	
	let i = 0;
	let j = 0;
	
	//cleaning stock data, so that only days are used, where prices for both stocks are available
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
	
	//if less th 200 days are used for the calculation
	if(x.length > 200){
		const spearman = new Spearman(x, y);
		return spearman.calc(); 
	} else {
		return new Promise(function(resolve, reject){
			resolve(0);
		};
		
	}
	
	
	
	  
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