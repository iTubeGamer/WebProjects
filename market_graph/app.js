"use strict";

const Spearman = require('spearman-rho');
const StringBuilder = require("string-builder");
var express = require("express");
const fetch = require("node-fetch");
var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "geheim"));
const DEFAULT_UNIVERSE = ['GS', 'MS', 'JPM', 'WFC', 'C', 'BAC', 'BCS', 'DB', 'CS', 'RBS', 'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'FB', 'TWTR', 'NFLX', 'SNAP', 'SPOT', 'DBX', 'SQ', 'SFIX', 'BABA', 'INTC', 'AMD', 'NVDA', 'ORCL'];
const SP500 = 'MMM,ABT,ABBV,ABMD,ACN,ATVI,ADBE,AMD,AAP,AES,AMG,AFL,A,APD,AKAM,ALK,ALB,ARE,ALXN,ALGN,ALLE,AGN,ADS,LNT,ALL,GOOGL,GOOG,MO,AMZN,AEE,AAL,AEP,AXP,AIG,AMT,AWK,AMP,ABC,AME,AMGN,APH,APC,ADI,ANSS,ANTM,AON,AOS,APA,AIV,AAPL,AMAT,APTV,ADM,ARNC,ANET,AJG,AIZ,T,ADSK,ADP,AZO,AVB,AVY,BHGE,BLL,BAC,BK,BAX,BBT,BDX,BRK.B,BBY,BIIB,BLK,HRB,BA,BKNG,BWA,BXP,BSX,BHF,BMY,AVGO,BR,BF.B,CHRW,COG,CDNS,CPB,COF,CPRI,CAH,KMX,CCL,CAT,CBOE,CBRE,CBS,CE,CELG,CNC,CNP,CTL,CERN,CF,SCHW,CHTR,CVX,CMG,CB,CHD,CI,XEC,CINF,CTAS,CSCO,C,CFG,CTXS,CLX,CME,CMS,KO,CTSH,CL,CMCSA,CMA,CAG,CXO,COP,ED,STZ,COO,CPRT,GLW,COST,COTY,CCI,CSX,CMI,CVS,DHI,DHR,DRI,DVA,DE,DAL,XRAY,DVN,FANG,DLR,DFS,DISCA,DISCK,DISH,DG,DLTR,D,DOV,DWDP,DTE,DRE,DUK,DXC,ETFC,EMN,ETN,EBAY,ECL,EIX,EW,EA,EMR,ETR,EOG,EFX,EQIX,EQR,ESS,EL,EVRG,ES,RE,EXC,EXPE,EXPD,EXR,XOM,FFIV,FB,FAST,FRT,FDX,FIS,FITB,FE,FRC,FISV,FLT,FLIR,FLS,FLR,FMC,FL,F,FTNT,FTV,FBHS,BEN,FCX,GPS,GRMN,IT,GD,GE,GIS,GM,GPC,GILD,GPN,GS,GT,GWW,HAL,HBI,HOG,HRS,HIG,HAS,HCA,HCP,HP,HSIC,HSY,HES,HPE,HLT,HFC,HOLX,HD,HON,HRL,HST,HPQ,HUM,HBAN,HII,IDXX,INFO,ITW,ILMN,IR,INTC,ICE,IBM,INCY,IP,IPG,IFF,INTU,ISRG,IVZ,IPGP,IQV,IRM,JKHY,JEC,JBHT,JEF,SJM,JNJ,JCI,JPM,JNPR,KSU,K,KEY,KEYS,KMB,KIM,KMI,KLAC,KSS,KHC,KR,LB,LLL,LH,LRCX,LW,LEG,LEN,LLY,LNC,LIN,LKQ,LMT,L,LOW,LYB,MTB,MAC,M,MRO,MPC,MAR,MMC,MLM,MAS,MA,MAT,MKC,MXIM,MCD,MCK,MDT,MRK,MET,MTD,MGM,MCHP,MU,MSFT,MAA,MHK,TAP,MDLZ,MNST,MCO,MS,MOS,MSI,MSCI,MYL,NDAQ,NOV,NKTR,NTAP,NFLX,NWL,NFX,NEM,NWSA,NWS,NEE,NLSN,NKE,NI,NBL,JWN,NSC,NTRS,NOC,NCLH,NRG,NUE,NVDA,ORLY,OXY,OMC,OKE,ORCL,PCAR,PKG,PH,PAYX,PYPL,PNR,PBCT,PEP,PKI,PRGO,PFE,PCG,PM,PSX,PNW,PXD,PNC,RL,PPG,PPL,PFG,PG,PGR,PLD,PRU,PEG,PSA,PHM,PVH,QRVO,PWR,QCOM,DGX,RJF,RTN,O,RHT,REG,REGN,RF,RSG,RMD,RHI,ROK,ROL,ROP,ROST,RCL,CRM,SBAC,SLB,STX,SEE,SRE,SHW,SPG,SWKS,SLG,SNA,SO,LUV,SPGI,SWK,SBUX,STT,SYK,STI,SIVB,SYMC,SYF,SNPS,SYY,TROW,TTWO,TPR,TGT,TEL,FTI,TXN,TXT,TMO,TIF,TWTR,TJX,TMK,TSS,TSCO,TDG,TRV,TRIP,FOXA,FOX,TSN,UDR,ULTA,USB,UAA,UA,UNP,UAL,UNH,UPS,URI,UTX,UHS,UNM,VFC,VLO,VAR,VTR,VRSN,VRSK,VZ,VRTX,VIAB,V,VNO,VMC,WMT,WBA,DIS,WM,WAT,WEC,WCG,WFC,WELL,WDC,WU,WRK,WY,WHR,WMB,WLTW,WYNN,XEL,XRX,XLNX,XYL,YUM,ZBH,ZION,ZTS';
const BATCH_SIZE = 100;
const BASE_URL = 'https://api.iextrading.com/1.0/stock/market/batch';
var timestamp = new Date();
const LOG_INTERVAL = 1000;
const BATCH_SIZE_COR = 1000;


var app = express();

app.get("/matrix", (req, res, next) => {
	 console.log('processing /matrix request...');
	 loadSymbols()
	 .then(stock_universe => createGraphForUniverseInDb(stock_universe))
	 .then(messages => {res.json(messages); console.log('anwered /matrix request')})
	 .catch(function(err){
		 console.error(err);
		 res.json('An internal error occured.');
	 });
	
});

app.listen(3000, () => {
 console.log("Server running on port 3000");
});

function loadSymbols(){
	//return new Promise(function(resolve, reject){resolve(DEFAULT_UNIVERSE)});
	
	return new Promise(function(resolve, reject) {
		var regex = '^[A-Z,-,.]*$';
		let url = 'https://api.iextrading.com/1.0/ref-data/symbols';
		fetch(url).then(response => response.json()).then(json => {
			
			var symbols = [];
			var prefixes = [];
			json.forEach(security => {
				if(security.type === 'cs' && security.symbol.match(regex)){
					if(security.symbol.includes('-')){
						let prefix = security.symbol.substr(0, security.symbol.indexOf('-'));
						if(!prefixes.includes(prefix) && !symbols.includes(prefix)){
							symbols.push(security.symbol);
							prefixes.push(prefix);
						}
					} else if(security.symbol.includes('.')){
						let prefix = security.symbol.substr(0, security.symbol.indexOf('.'));
						if(!prefixes.includes(prefix) && !symbols.includes(prefix)){
							symbols.push(security.symbol);
							prefixes.push(prefix);
						}
					} else {
						symbols.push(security.symbol);
					}
						
					
				}
			});
			
			resolve(symbols);
			
		}).catch(err => reject(err));
		
	});	
	
}

function createGraphForUniverseInDb(stock_universe) {
	return new Promise(function(resolve, reject){	
		loadDataFromIEX(stock_universe)
		.then(result => cleanStockUniverse(result))
		.then(result => createStockNodesInDb(result))
		.then(result => createCorrelatoinRelationshipsInDb2(result))
		.then(result => resolve(result.messages))
		.then(driver.close())
		.catch(err => reject(err));
	});
}

function loadDataFromIEX(stock_universe){
	return new Promise(function(resolve, reject) {
		var chartData = {};
		var messages = [];
		var result = {};
		result.stockUniverse = stock_universe;
		result.chartData = chartData;
		result.messages = messages;
		var batchCounter = 0;
		
		//get stock data in batches
		console.log('loading data for stock universe of size: ' + stock_universe.length);
		let numberOfBatches = Math.ceil(stock_universe.length / BATCH_SIZE);
		for (let i = 0; i < numberOfBatches; i++) {
		  let symbolsBatch = stock_universe.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
		  let filters = ['companyName', 'industry', 'sector', 'tags', 'marketcap', 'date', 'close', 'changePercent'];
		  let url = `${BASE_URL}?types=company,stats,chart&range=2y&symbols=${symbolsBatch.join(',')}&filter=${filters.join(',')}`;
	  
		  fetch(url)
		  .then(response => response.json())
		  .then(json => {
			//merge json-data in one object: chartData
			Object.assign(chartData, json);
			batchCounter++;	
			if (batchCounter === numberOfBatches) resolve(result);					
		  })	
		  
		}	  
	 });
}

function cleanStockUniverse(result){
	//remove symbols from universe which are not accepted by IEX or have less then 200 prices
	let stock_universe = result.stockUniverse;
	let chartData = result.chartData;
	return new Promise(function(resolve, reject){
		for(var k = stock_universe.length -1; k >= 0; k--){
			if (!chartData[stock_universe[k]]) {
				console.log('Removing symbol ' + stock_universe[k] + ', it is not supported by IEX');
				stock_universe.splice(k, 1);
			} else if (chartData[stock_universe[k]].chart.length < 200){
				console.log('Removing symbol ' + stock_universe[k] + ', the stock price is available for less than 200 days');
				stock_universe.splice(k, 1);
			}
		}
		console.log('cleaning done. New stock universe size: ' + stock_universe.length);
		resolve(result);	
	});
}

function createStockNodesInDb(stockResult){	
	
	return new Promise(function(resolve, reject){
		let messages = stockResult.messages;
		
		//remove all nodes
		clearDb(messages)
		//create new nodes
		.then(result => insertNodes(stockResult))
		//createIndex
		.then(result => createStockSymbolIndex())
		//resolve
		.then(result => resolve(stockResult))
		.catch(err => reject(err));	 
	});		
}

function insertNodes(stockResult){
	let stock_universe = stockResult.stockUniverse;
	let chartData = stockResult.chartData;
	let messages = stockResult.messages;
	
	let err_occured = false;
	let errors = [];
	let session = driver.session();
	let finished_nodes_db = 0;	
	
	return new Promise(function(resolve, reject){	
		console.log('Creating stock nodes in db');
		stock_universe.forEach(function(symbol, i){
			insertSymbolNode(symbol, chartData, session)
			.then(result => {
				finished_nodes_db++;
				//when all nodes are inserted: resolve
				if(finished_nodes_db === stock_universe.length){
					session.close();
					console.log('created stock nodes');
					messages.push('Created ' + finished_nodes_db + ' nodes.');
					if(err_occured){
						reject(errors);
					} else {
						resolve();
					}	
				}	
			}).catch(err => {err_occured = true; errors.push(err);});
		});	
	});
}

function insertSymbolNode(symbol, chartData, session){
	let symbol_db = symbol.replace('.','_').replace('-','_');
	let company = chartData[symbol].company.companyName;
	let marketcap = chartData[symbol].stats.marketcap;
	let industry = chartData[symbol].company.industry;
	let sector = chartData[symbol].company.sector;
	let tags = chartData[symbol].company.tags;
				
	return executeDbQueryWithSession(`CREATE (${symbol_db}:stock {symbol: $symbolParam, company: $companyParam, marketcap: $marketcapParam, industry: $industryParam, sector: $sectorParam, tags: $tagsParam})`,
										{symbolParam: symbol, companyParam: company, marketcapParam: marketcap, industryParam: industry, sectorParam: sector, tagsParam: tags}, session)	
}
																					   
function createCorrelatoinRelationshipsInDb(result){
	let stock_universe = result.stockUniverse;
	let chartData = result.chartData;
	let messages = result.messages;
	return new Promise(function(resolve, reject) {
		var start = 0;
		var end = 0;
		var batch_size_correlation = stock_universe.length - 1;
		//calculate how many loops can be done without exceeding the batch limit
		while((end < (stock_universe.length - 1)) && (batch_size_correlation < BATCH_SIZE_COR)){
			end++;
			batch_size_correlation = batch_size_correlation + (stock_universe.length - end - 1);	
		}
		console.log('Creating correlation relationships');
		createRelationshipBatch(stock_universe, chartData, start, end, batch_size_correlation, 1, messages)
		.then(function(){
			console.log('Finished inserting correlation relationships');
			resolve(result);
		}).catch(err => reject(err));
	});
	

}

function createCorrelatoinRelationshipsInDb2(result){
	let stock_universe = result.stockUniverse;
	let chartData = result.chartData;
	let messages = result.messages;
	
	return new Promise(function(resolve, reject) {
		console.log('Creating correlation relationships');
		var session = driver.session();
		
		(async function loop() {
		for (let i = 0; i < stock_universe.length; i++) {
			console.log('starting loop ' + (i+1) + ' from ' + stock_universe.length);
			for (let j = i+1; j < stock_universe.length; j++){
				
				let symbol1=stock_universe[i];
				let symbol2=stock_universe[j];
				
				//calculate correlation
				let corr = await spearmanCoefficient(chartData[symbol1].chart, chartData[symbol2].chart, symbol1, symbol2)
				//insert into db
				.then(corr => executeDbQueryWithSession('MATCH (a:stock),(b:stock)' +
										' WHERE a.symbol = $symbolAParam AND b.symbol = $symbolBParam' +
										' CREATE (a)-[r:RELTYPE { correlation: $corrParam }]->(b)', {symbolAParam: symbol1, symbolBParam: symbol2, corrParam: corr}, session))
				.catch(err => reject(err));
			}
			console.log('finished loop ' + (i+1) + ' from ' + stock_universe.length);
			
		}
		
		session.close();
		console.log('Finished inserting correlation relationships');
		resolve(result);
		
		})();

	});
	

}

function createRelationshipBatch(stock_universe, chartData, start, end, batch_size_correlation, batch_no, messages){
		return new Promise(function(resolve, reject) {
		var timestamp = Date.now();
		var finished_cor = 0;
		var finished_db = 0;
		var session = driver.session();
		console.log('Starting Batch ' + batch_no + ' (' + (start + 1) + '-' + (end + 1) + '/' + stock_universe.length + '). Batch Size: ' + batch_size_correlation);

		for (let i = start; i <= end; i++){	
			for (let j = i+1; j < stock_universe.length; j++){
				let symbol1=stock_universe[i];
				let symbol2=stock_universe[j];
				
				//1: calculate spearman correlation
				spearmanCoefficient(chartData[symbol1].chart, chartData[symbol2].chart, symbol1, symbol2)
				//2: insert into db
				.then(function result(corr){
					  finished_cor++; 
					  return executeDbQueryWithSession(`MATCH (a:stock),(b:stock)` +
										`WHERE a.symbol = '${symbol1}' AND b.symbol = '${symbol2}'` +
										`CREATE (a)-[r:RELTYPE { correlation: ${corr} }]->(b)`, {}, session);
					 
				})
				//3: check if it was last promise
				.then(function(result){
					  finished_db++;
					//all db insertion for this batch finished
					  if(finished_db === batch_size_correlation){
						  console.log('Finished Batch ' + batch_no + ' (' + (start + 1) + '-' + (end + 1) + '/' + stock_universe.length + '). Inserted ' + finished_db + ' relationship(s).');
						  messages.push('Executed Batch: ' + batch_no + '. Inserted ' + finished_db + ' relationship(s).');
						  session.close();
						  //if this isn't the last batch: start next one
						  if(end < stock_universe.length - 1){
								let start_new = end + 1;
								let end_new = start_new;
								let batch_size_new = stock_universe.length - end_new - 1;
								//calculate how many loops can be done without exceeding the batch limit
								while((end_new < stock_universe.length - 1) && (batch_size_new < BATCH_SIZE_COR)){
									end_new++;
									batch_size_new = batch_size_new + (stock_universe.length - end_new - 1);	
								}
							  createRelationshipBatch(stock_universe, chartData, start_new, end_new, batch_size_new, ++batch_no, messages).then(function(){
								 resolve(); 
							  }).catch(err => reject(err));
							  
						  } else {
							 console.log('Resolving batches...');
							 resolve();	  
						  }
						  
					  }
				 }).catch(err => reject(err)); 
			}
		}
	});
	
}
	
function timedLog(string){
	let now = Date.now();
	if( now - timestamp > LOG_INTERVAL){
			console.log(string);
			timestamp = now;
	}
}

function spearmanCoefficient(chart_x, chart_y, symbol_x, symbol_y){
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
		console.warn('Not enough overlap between ' + symbol_x + ' and ' + symbol_y + '. No correlation calculated.');
		return new Promise(function(resolve, reject){
			resolve(0);
		});
		
	}
}

function clearDb(messages){
	var promise = executeDbQuery('MATCH (n) DETACH DELETE n', {})
					.then(result => messages.push('Deleted ' + result.summary.counters._stats.nodesDeleted 
											+ ' node(s) and ' + result.summary.counters._stats.relationshipsDeleted + ' relationship(s).'));
	console.log('Deleting all entries from db');
	return promise;
}

function createStockSymbolIndex(){
	return executeDbQuery('CREATE INDEX ON :stock(symbol)', {});
}

function executeDbQuery(query, parameters){
	return new Promise(function(resolve, reject){
		var session = driver.session();
		
		session
		  .run(query, parameters)
		  .then(function (result) {
			 session.close();
			 resolve(result);
		  }).catch(function (err) {
			session.close();
			reject(err);
		  });
	});
}

function executeDbQueryWithSession(query, parameters, session){
	return session.run(query, parameters);		  
}

function executeDbQueryWithTransaction(query, parameters, tx){
	
}
	
	