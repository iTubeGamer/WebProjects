'use strict';
  const driver = neo4j.v1.driver("bolt://81.169.223.244:7687/", 
				   neo4j.v1.auth.basic("readonly", "#p1A417dzOtJ"));
  //const portfolio = ["FB", "BABA", "TM", "AABA", "HSBC", "BLK", "MS", "MSFT", "CSCO", "V", "MA", "ISRG", "PYPL", "ADBE"];
  const portfolio_array = [['FB', 1000], ['BABA', 350], ['TM', 30000], ['AABA', 100], ['HSBC', 2000], ['BLK', 3000], ['MS', 800], ['MSFT', 9960], ['CSCO', 1700], ['V', 1300], ['MA', 1050], ['ISRG', 2300], ['PYPL', 1440], ['ADBE', 700]];
  const portfolio_avg = 1000;
  var portfolio = new Map(portfolio_array);
  const colors = ["#e31a1c", "#a6cee3", "#b2df8a", "#1f78b4", "#33a02c", "#fb9a99", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928"];
  var color_map = new Map();
  var color_index = 0;
  const min_corr = 0.90;	
  const max_nodes = 300;  
  const session = driver.session();
  var graph_elem;
  var tradingview;
  var Graph = ForceGraph3D();
  var graphData;
  var marketcap_median;
  var portfolio_mode = false;
 
 
	  
  window.onload = function start(){
	  graph_elem = document.getElementById('3d-graph');
	  tradingview = document.getElementById('tradingview');
	  //createMenue();
	 createGraph();

  }

  function createMenue(){
	var sel_coloring = document.getElementById("coloring");
	sel_coloring.options[sel_coloring.options.length] = new Option('sector');
	sel_coloring.options[sel_coloring.options.length] = new Option('industry');
	  
  }

  
  function createGraph(){
	  
	
	const start = new Date();
	const nodes = {};
		
	session.run(`MATCH (n) WITH n ORDER BY n.marketcap DESC WITH collect(n)[${max_nodes}].marketcap as min MATCH (n)-[r]-(m) WHERE r.correlation > ${min_corr} AND n.marketcap > min AND m.marketcap > min` +
		' RETURN r.correlation as correlation, { id: id(n), marketcap:n.marketcap, sector:n.sector, symbol:n.symbol, industry:n.industry, company:n.company } as source, { id: id(m), marketcap:m.marketcap, sector:m.sector, symbol:m.symbol, industry:m.industry, company:m.company } as target')
	.then(function (result) {
	  
	  // turn records into list of link-objects
	  const links = result.records.map(r => 
		  { var source = r.get('source');
		   source.id = source.id.toNumber();
		   nodes[source.id] = source;
		   var target = r.get('target');
		   target.id = target.id.toNumber();
		   nodes[target.id] = target;
		   var corr = r.get('correlation');
		   return {source:source.id,target:target.id, correlation: corr}
					});
					
	  session.close();
	  
	  // convert nodes object to array
	  const nodes_array = Object.values(nodes);
	  marketcap_median = calculateMarketcapMedian(nodes_array);
	  console.log(links.length + ' links and ' + nodes_array.length + ' nodes loaded in '  + (new Date()-start) + ' ms.');
	  
	  // combine nodes and links to graph
	  graphData = { nodes: nodes_array, links: links};
	  
	  //draw graph
	  Graph(graph_elem)
		.enableNodeDrag(false)
		.onNodeHover(node => graph_elem.style.cursor = node ? 'pointer' : null)
		.d3AlphaDecay(0)	
		.graphData(graphData)
		.nodeLabel(node => getLabel(node))
		.nodeRelSize(4)
		.nodeVal(node => getVolume(node))
		.nodeThreeObject(node => modNode(node))
		.onNodeClick(node => {
			window.open(`https://iextrading.com/apps/stocks/${node.symbol}`)
		 })
		.d3Force('link')
		.distance(link => getDistanceByLink(link));
		
	 
	 
	})
	.catch(function (error) {
	  console.log(error);
	});

  }
  
  function calculateMarketcapMedian(nodes){
	  nodes.sort(function(a,b){
		return a.marketcap-b.marketcap;
	  });
	  
	  if(nodes.length ===0) return 0
  
	  var half = Math.floor(nodes.length / 2);

	  return nodes[half].marketcap;  
  }

function getRadius(node){
	if(portfolio_mode){
		if(portfolio.has(node.symbol)){ return Math.pow((portfolio.get(node.symbol) / portfolio_avg), 1/3);}
		else {return 1};
	} else {
		return Math.pow((node.marketcap / marketcap_median), 1/3);
	}
}

function getColor(node){
	if(portfolio_mode){
		if(portfolio.has(node.symbol)){ return colors[0]}
		else {return colors[1]};
	} else {
		if(!color_map.has(node.sector)){
			color_map.set(node.sector, colors[color_index]);
			color_index++;
			if (color_index === colors.length) color_index = 0;
		}
		return color_map.get(node.sector);
	}
	
}

function onChangeMode(mode){
	if(mode === "portfolio"){
		portfolio_mode = true;
	} else {
		portfolio_mode = false;
	}
	
	Graph.nodeThreeObject(node => {
		return modNode(node);
	});  
	
}

function modNode(n) {
  var radius = getRadius(n) * 4;
  var sphere = new THREE.SphereGeometry(radius);
  var lambert = new THREE.MeshLambertMaterial({ color: getColor(n), transparent: true, opacity: 0.75 });
  
  var mesh = new THREE.Mesh(sphere, lambert);

  var group = new THREE.Group();
  group.add(mesh);

  
  return group;
}

function getDistanceByLink(link){
	var distance = ((link.correlation - min_corr) * -1 + (1 - min_corr)) * 400;
	
	return distance;
}

function getLabel(node){
	if(portfolio_mode){
		return `${node.company} (Position: ${portfolio.get(node.symbol)})`;
	} else {
		return `${node.company} (${node.sector})`;
	}
}
  
  

  
  
  

	



   
      


   
      