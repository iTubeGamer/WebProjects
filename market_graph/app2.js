"use strict";

var neo4j = require('neo4j-driver').v1;

var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "geheim"));

var session = driver.session();

session
  .run('CREATE (james:Person {name : {nameParam} }) RETURN james.name AS name', {nameParam: 'James'})
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