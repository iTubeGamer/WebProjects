'use strict';
	  

	  
  window.onload = function start(){
	  
	  createGraph();

  }

  'use strict';
  
  function createGraph(){
	  
	const driver = neo4j.v1.driver("bolt://localhost", 
				   neo4j.v1.auth.basic("readonly", "geheim"));
	const session = driver.session();
	const start = new Date();

	session
	.run('MATCH (n)-[r]-(m)' +
		//` WHERE (n.sector in ['Technology', 'Healthcar', 'Energy'])` +
		//` AND (m.sector in ['Technology', 'Healthcar', 'Energy'])` +
		' WHERE r.correlation > 0.9' +
		' RETURN id(n) as source, id(m) as target')
	.then(function (result) {
	  
	  // turn records into list of link-objects
	  const links = result.records.map(r => 
		  { return {source:r.get('source').toNumber(), 
					target:r.get('target').toNumber()}});
					
	  session.close();
	  console.log(links.length+" links loaded in "+(new Date()-start)+" ms.")
	  
	  // gather node-ids from both sides
	  const ids = new Set();
	  links.forEach(l => {ids.add(l.source);ids.add(l.target);});
	  const nodes = Array.from(ids).map(id => {return {id:id}})
	  
	  // combine nodes and links to graph
	  const graphData = { nodes: nodes, links: links};
	  
	  //draw graph
	  const elem = document.getElementById('3d-graph');
	  var myGraph = ForceGraph3D();
	  myGraph(elem).graphData(graphData); 
	 
	  console.log('graph has been drawn');
	})
	.catch(function (error) {
	  console.log(error);
	});

  }
	

	



   
      


   
      