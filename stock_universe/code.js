'use strict';
  const driver = neo4j.v1.driver("bolt://localhost", 
				   neo4j.v1.auth.basic("readonly", "geheim"));
  const session = driver.session();
  var graph_elem;
  var Graph = ForceGraph3D();
  var graphData;
	  
  window.onload = function start(){
	  graph_elem = document.getElementById('3d-graph');
	  createMenue();
	  createGraph();

  }

  function createMenue(){
	var sel_coloring = document.getElementById("coloring");
	sel_coloring.options[sel_coloring.options.length] = new Option('sector');
	sel_coloring.options[sel_coloring.options.length] = new Option('industry');
	  
  }

  
  function createGraph(){
	  
	
	const start = new Date();

	session
	.run('MATCH (n)-[r]-(m)' +
		//` WHERE (n.sector in ['Technology', 'Healthcare', 'Energy'])` +
		//` AND (m.sector in ['Technology', 'Healthcare', 'Energy'])` +
		' WHERE r.correlation > 0.95' +
		' RETURN { id: id(n), sector:n.sector, symbol:n.symbol, industry:n.industry } as source, { id: id(m), sector:m.sector, symbol:m.symbol, industry:m.industry } as target')
	.then(function (result) {
	  const nodes = {}
	  
	  // turn records into list of link-objects
	  const links = result.records.map(r => 
		  { var source = r.get('source');source.id = source.id.toNumber();
           nodes[source.id] = source;
	       var target = r.get('target');target.id = target.id.toNumber();
           nodes[target.id] = target;
	       return {source:source.id,target:target.id}
					});
					
	  session.close();
	  
	  // convert nodes object to array
	  const nodes_array = Object.values(nodes);  
	  console.log(links.length + ' links and ' + nodes_array.length + ' nodes loaded in '  + (new Date()-start) + ' ms.');
	  
	  // combine nodes and links to graph
	  graphData = { nodes: nodes_array, links: links};
	  
	  //draw graph
	  Graph(graph_elem)
	    .enableNodeDrag(false)
        .onNodeHover(node => graph_elem.style.cursor = node ? 'pointer' : null)
		.d3AlphaDecay(0.01)
		.graphData(graphData)
		.nodeAutoColorBy('sector')
		.nodeLabel(node => `${node.symbol} (${node.sector})`);
	 
	})
	.catch(function (error) {
	  console.log(error);
	});

  }
  
  function onSelectColoring(){
	  
	  var color_by = document.getElementById("coloring").value;
	  console.log('changing coloring to ' + color_by);
	  Graph(graph_elem)
		.nodeAutoColorBy(color_by)
		.graphData(graphData);
	  
	  
	  
	  
  }
	

	



   
      


   
      