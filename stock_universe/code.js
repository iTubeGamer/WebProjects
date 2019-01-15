'use strict';
	  
	  const DEFAULT_SYMBOLS = ['GS', 'MS', 'JPM', 'WFC', 'C', 'BAC', 'BCS', 'DB', 'CS', 'RBS', 'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'FB', 'TWTR', 'NFLX', 'SNAP', 'SPOT', 'DBX', 'SQ', 'SFIX', 'BABA', 'INTC', 'AMD', 'NVDA', 'ORCL'];
	  const UNIVERSE = symbolsFromQueryParams() || DEFAULT_SYMBOLS;
      const BATCH_SIZE = 100;
      const BASE_URL = 'https://api.iextrading.com/1.0/stock/market/batch';
	  var numberOfBatches = 0;
	  var batchReadyCounter = 0;
	  var chartData = {};
	  var corrMatrix = [];
	  var containerDiv;
	  var updatedDiv;
	  
	  window.onload = function start(){
		  
		  containerDiv = document.querySelector('.stocks-container');

		  loadChartData();
	  }

      function loadChartData() {
		batchReadyCounter = 0;
        numberOfBatches = Math.ceil(UNIVERSE.length / BATCH_SIZE);

        for (let i = 0; i < numberOfBatches; i++) {
          let symbolsBatch = UNIVERSE.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
          loadBatch(symbolsBatch);
        }

      }
	  
	  function loadBatch(symbols){
		  let filters = ['date', 'close', 'changePercent'];
		  let url = `${BASE_URL}?types=chart&range=5y&symbols=${symbols.join(',')}&filter=${filters.join(',')}`;
		  
		  fetch(url).then(response => response.json()).then(json => {
				Object.assign(chartData, json);
				
				if(++batchReadyCounter === numberOfBatches){
					createMatrix();
				}
		  })
	  }
	                                                                                                   {}
	  function createMatrix(){                                                                         {}
		  
		console.log(chartData);
		
        UNIVERSE.forEach((symbol1, i) => {
			UNIVERSE.forEach((symbol2, j) => {
					if(j >i){
						let corr = spearmanCorrelation(chartData[symbol1].chart, chartData[symbol2].chart);
						corrMatrix.push([symbol1, symbol2, corr]);
					}
					if(j===i){
						corrMatrix.push([symbol1, symbol2, 0]);
						
					}
				
			});
		});
		
		console.log(corrMatrix);
	  }
	  
	  
	  function spearmanCorrelation(data1, data2){
		  return data1[0].close;
	  }

      function symbolsFromQueryParams() {
        if (!window.location.search) return;

        let params = new URLSearchParams(window.location.search);
        let symbols_param = params.get('symbols');
		
		if (symbols_param){
			return symbols_param.split(',')
		}

        return [];
      }

      function symbolUrl(symbol) {
        return `https://iextrading.com/apps/stocks/${symbol}`;
      }


   
      