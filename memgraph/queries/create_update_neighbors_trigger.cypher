CREATE TRIGGER update_neighbors ON () UPDATE
AFTER COMMIT EXECUTE
UNWIND updatedVertices AS context
WITH context.vertex AS start_node
MATCH (start_node)-->(end_node)
WITH DISTINCT start_node, end_node
SET end_node.neighbors = end_node.neighbors + 1
WITH start_node, degree(start_node) AS neighbors
SET start_node.neighbors = neighbors;
