"use strict";

const Spearman = require('spearman-rho');
var express = require("express");
const fetch = require("node-fetch");
var DEFAULT_UNIVERSE = ['GS', 'MS', 'JPM', 'WFC', 'C', 'BAC', 'BCS', 'DB', 'CS', 'RBS', 'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'FB', 'TWTR', 'NFLX', 'SNAP', 'SPOT', 'DBX', 'SQ', 'SFIX', 'BABA', 'INTC', 'AMD', 'NVDA', 'ORCL'];
var SP500 = 'MMM,ABT,ABBV,ABMD,ACN,ATVI,ADBE,AMD,AAP,AES,AMG,AFL,A,APD,AKAM,ALK,ALB,ARE,ALXN,ALGN,ALLE,AGN,ADS,LNT,ALL,GOOGL,GOOG,MO,AMZN,AEE,AAL,AEP,AXP,AIG,AMT,AWK,AMP,ABC,AME,AMGN,APH,APC,ADI,ANSS,ANTM,AON,AOS,APA,AIV,AAPL,AMAT,APTV,ADM,ARNC,ANET,AJG,AIZ,T,ADSK,ADP,AZO,AVB,AVY,BHGE,BLL,BAC,BK,BAX,BBT,BDX,BRK.B,BBY,BIIB,BLK,HRB,BA,BKNG,BWA,BXP,BSX,BHF,BMY,AVGO,BR,BF.B,CHRW,COG,CDNS,CPB,COF,CPRI,CAH,KMX,CCL,CAT,CBOE,CBRE,CBS,CE,CELG,CNC,CNP,CTL,CERN,CF,SCHW,CHTR,CVX,CMG,CB,CHD,CI,XEC,CINF,CTAS,CSCO,C,CFG,CTXS,CLX,CME,CMS,KO,CTSH,CL,CMCSA,CMA,CAG,CXO,COP,ED,STZ,COO,CPRT,GLW,COST,COTY,CCI,CSX,CMI,CVS,DHI,DHR,DRI,DVA,DE,DAL,XRAY,DVN,FANG,DLR,DFS,DISCA,DISCK,DISH,DG,DLTR,D,DOV,DWDP,DTE,DRE,DUK,DXC,ETFC,EMN,ETN,EBAY,ECL,EIX,EW,EA,EMR,ETR,EOG,EFX,EQIX,EQR,ESS,EL,EVRG,ES,RE,EXC,EXPE,EXPD,EXR,XOM,FFIV,FB,FAST,FRT,FDX,FIS,FITB,FE,FRC,FISV,FLT,FLIR,FLS,FLR,FMC,FL,F,FTNT,FTV,FBHS,BEN,FCX,GPS,GRMN,IT,GD,GE,GIS,GM,GPC,GILD,GPN,GS,GT,GWW,HAL,HBI,HOG,HRS,HIG,HAS,HCA,HCP,HP,HSIC,HSY,HES,HPE,HLT,HFC,HOLX,HD,HON,HRL,HST,HPQ,HUM,HBAN,HII,IDXX,INFO,ITW,ILMN,IR,INTC,ICE,IBM,INCY,IP,IPG,IFF,INTU,ISRG,IVZ,IPGP,IQV,IRM,JKHY,JEC,JBHT,JEF,SJM,JNJ,JCI,JPM,JNPR,KSU,K,KEY,KEYS,KMB,KIM,KMI,KLAC,KSS,KHC,KR,LB,LLL,LH,LRCX,LW,LEG,LEN,LLY,LNC,LIN,LKQ,LMT,L,LOW,LYB,MTB,MAC,M,MRO,MPC,MAR,MMC,MLM,MAS,MA,MAT,MKC,MXIM,MCD,MCK,MDT,MRK,MET,MTD,MGM,MCHP,MU,MSFT,MAA,MHK,TAP,MDLZ,MNST,MCO,MS,MOS,MSI,MSCI,MYL,NDAQ,NOV,NKTR,NTAP,NFLX,NWL,NFX,NEM,NWSA,NWS,NEE,NLSN,NKE,NI,NBL,JWN,NSC,NTRS,NOC,NCLH,NRG,NUE,NVDA,ORLY,OXY,OMC,OKE,ORCL,PCAR,PKG,PH,PAYX,PYPL,PNR,PBCT,PEP,PKI,PRGO,PFE,PCG,PM,PSX,PNW,PXD,PNC,RL,PPG,PPL,PFG,PG,PGR,PLD,PRU,PEG,PSA,PHM,PVH,QRVO,PWR,QCOM,DGX,RJF,RTN,O,RHT,REG,REGN,RF,RSG,RMD,RHI,ROK,ROL,ROP,ROST,RCL,CRM,SBAC,SLB,STX,SEE,SRE,SHW,SPG,SWKS,SLG,SNA,SO,LUV,SPGI,SWK,SBUX,STT,SYK,STI,SIVB,SYMC,SYF,SNPS,SYY,TROW,TTWO,TPR,TGT,TEL,FTI,TXN,TXT,TMO,TIF,TWTR,TJX,TMK,TSS,TSCO,TDG,TRV,TRIP,FOXA,FOX,TSN,UDR,ULTA,USB,UAA,UA,UNP,UAL,UNH,UPS,URI,UTX,UHS,UNM,VFC,VLO,VAR,VTR,VRSN,VRSK,VZ,VRTX,VIAB,V,VNO,VMC,WMT,WBA,DIS,WM,WAT,WEC,WCG,WFC,WELL,WDC,WU,WRK,WY,WHR,WMB,WLTW,WYNN,XEL,XRX,XLNX,XYL,YUM,ZBH,ZION,ZTS';
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
		  console.log('batch url: ' + url);
	  
		  fetch(url).then(response => response.json()).then(json => {
				//merge json-data in one object: chartData
				Object.assign(chartData, json);
				
				if(i + 1 === numberOfBatches){
					//when all batches are merged: remove symbols not accepted by IEX from universe, calculate correlation matrix
					
					for(var k = stock_universe.length -1; k >= 0; k--){
						if (!chartData[stock_universe[k]]) {
							console.log('Removing symbol ' + stock_universe[k] + ', it is not supported by IEX');
							stock_universe.splice(k, 1);
							
						}
						if (k=== 0){
							console.log('cleaning done');
						};
						
					}
					
					console.log('starting to calculate matrix');
					calculateMatrix(stock_universe, chartData).then(matrix => {
						//when matrix is calculated: format company data
						result['correlationMatrix'] = matrix;
						result['companyData'] = extractCompanyData(stock_universe, chartData);
						//when company data is formatted, resolve promise
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
		var timestamp = Date.now();
		var counter = 0;
		console.log('Creating matrix');

		for (let i = 0; i < stock_universe.length - 1; i++){	
			for (let j = i+1; j < stock_universe.length; j++){
				let symbol1=stock_universe[i];
				let symbol2=stock_universe[j];
				let corrPromise = spearmanCoefficient(chartData[symbol1].chart, chartData[symbol2].chart, symbol1, symbol2);
				corrPromise.then(function result(corr){
					  corrMatrix.push([symbol1, symbol2, corr]);
					  
					  //--logging--//
					  counter++;
					  if(Date.now() - timestamp > 1000){
							console.log('matrix calculation: ' + counter + '/' + stock_universe.length * (stock_universe.length - 1) / 2);
							timestamp = Date.now();
						}
					 //--logging--//
						
					  if((i === stock_universe.length - 2) && (j === stock_universe.length - 1)){
						  console.log('matrix complete. universe size: ' + stock_universe.length + ', matrix size: ' + corrMatrix.length);
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

function createStockNodesInDb(companyData){
	console.log('Creating stock nodes in db');	
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