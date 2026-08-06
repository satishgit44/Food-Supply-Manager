import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from run_db_init import split_sql_statements


class SplitSqlStatementsTests(unittest.TestCase):
    def test_split_sql_statements_keeps_delimited_procedures(self):
        sql = """
        CREATE TABLE demo(id INT);

        DELIMITER //
        CREATE PROCEDURE sample_proc()
        BEGIN
            SELECT 1;
        END //
        DELIMITER ;

        CREATE TRIGGER sample_trigger
        AFTER INSERT ON demo
        FOR EACH ROW
        BEGIN
            SELECT NEW.id;
        END;
        """

        statements = split_sql_statements(sql)

        self.assertGreaterEqual(len(statements), 3)
        self.assertTrue(any("CREATE PROCEDURE" in stmt for stmt in statements))
        self.assertTrue(any("CREATE TRIGGER" in stmt for stmt in statements))
        self.assertTrue(all("DELIMITER" not in stmt for stmt in statements))


if __name__ == "__main__":
    unittest.main()
