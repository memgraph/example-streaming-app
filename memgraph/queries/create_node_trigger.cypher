CREATE TRIGGER create_node ON () CREATE
AFTER COMMIT EXECUTE
UNWIND createdVertices AS node
SET node += { neighbours: 0 };
