CREATE TRIGGER update_neighbours ON () UPDATE
AFTER COMMIT EXECUTE
UNWIND updatedVertices AS start_node
MATCH (start_node)-[*bfs..2]->(end_node)
SET end_node.neighbours = end_node.neighbours + 1
WITH start_node, count(end_node) AS neighbours
SET start_node.neighbours = neighbours;
