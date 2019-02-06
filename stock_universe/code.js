'use strict';
  const driver = neo4j.v1.driver("bolt://81.169.223.244:7687/", 
				   neo4j.v1.auth.basic("neo4j", "***"));
  const session = driver.session();
  var graph_elem;
  var tradingview;
  var Graph = ForceGraph3D();
  var graphData;
  var marketcap_median;
  const lie_factor = 2;
	  
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
		
	session.run('MATCH (n)-[r]-(m)' +
		' WHERE r.correlation > 0.97' +
		' RETURN { id: id(n), marketcap:n.marketcap, sector:n.sector, symbol:n.symbol, industry:n.industry, company:n.company } as source, { id: id(m), marketcap:m.marketcap, sector:m.sector, symbol:m.symbol, industry:m.industry, company:m.company } as target')
	.then(function (result) {
	  
	  // turn records into list of link-objects
	  const links = result.records.map(r => 
		  { var source = r.get('source');
		   source.id = source.id.toNumber();
		   nodes[source.id] = source;
		   var target = r.get('target');
		   target.id = target.id.toNumber();
		   nodes[target.id] = target;
		   return {source:source.id,target:target.id}
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
		.d3AlphaDecay(0.001)
		.graphData(graphData)
		.nodeAutoColorBy('sector')
		.nodeLabel(node => `${node.company} (${node.sector})`)
		.nodeRelSize(4)
		.nodeVal(node => getVolume(node))
		.onNodeClick(node => {
			window.open(`https://iextrading.com/apps/stocks/${node.symbol}`);
		 });
	 
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
  


function getVolume(node){
	let volume = node.marketcap / marketcap_median;
	
	return 1 + ((volume - 1) / lie_factor);
}
  
  

  
  
  

	



   
      


   
      