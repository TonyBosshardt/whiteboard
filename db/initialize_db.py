import mysql.connector
from mysql.connector import errorcode

DB_NAME = "goalie"

TABLES = {}
TABLES[
    "user"
] = """
    CREATE TABLE `user` (
        `user_id` INT(11) NOT NULL AUTO_INCREMENT,
        `first_name` VARCHAR(45) NOT NULL,
        `last_name` VARCHAR(45) NOT NULL,
        `email_address` VARCHAR(255) DEFAULT NULL,
        `insert_datetime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`user_id`)
    );
"""

TABLES[
    "tag"
] = """
    CREATE TABLE `tag` (
        `tag_id` INT(11) NOT NULL AUTO_INCREMENT,
        `title` VARCHAR(45) NOT NULL,
        `description` VARCHAR(255) DEFAULT NULL,
        `display_color` VARCHAR(45) NOT NULL,
        `insert_datetime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`tag_id`),
        UNIQUE KEY udx_tag_title (`title`)
    );
"""


TABLES[
    "project"
] = """
    CREATE TABLE `project` (
        `project_id` INT(11) NOT NULL AUTO_INCREMENT,
        `title` VARCHAR(45) NOT NULL,
        `description` VARCHAR(255) DEFAULT NULL,
        `insert_datetime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`project_id`),
        UNIQUE KEY udx_project_title (`title`)
    );

"""

TABLES[
    "task"
] = """
    CREATE TABLE `task` (
        `task_id` INT(11) NOT NULL AUTO_INCREMENT,
        `user_id` INT(11) NOT NULL,
        `title` VARCHAR(255) NOT NULL,
        `description` VARCHAR(255) DEFAULT NULL,
        `tag_id` INT(11) DEFAULT NULL,
        `project_id` INT(11) DEFAULT NULL,
        `status` ENUM('complete', 'incomplete', 'in-progress') NOT NULL DEFAULT 'incomplete',
        `estimated_completion_time_minutes` INT(11) DEFAULT NULL,
        `due_datetime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `original_due_datetime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `days_put_off` INT AS (DATEDIFF(due_datetime, original_due_datetime)) VIRTUAL,
        `complete_datetime` DATETIME DEFAULT NULL,
        `is_deleted` INT(1) NOT NULL DEFAULT 0,
        `insert_datetime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`task_id`),
        FOREIGN KEY fk_task_user_id (user_id) REFERENCES user (user_id),
        FOREIGN KEY fk_task_tag_id (tag_id) REFERENCES tag (tag_id),
        FOREIGN KEY fk_task_project_id (project_id) REFERENCES project (project_id)
    );
"""


# TODO: get these vars from ENV
init_vars = {"password": "Ca96642we", "host": "127.0.0.1", "user": "anthony"}

cnx = mysql.connector.connect(**init_vars)

cursor = cnx.cursor()

cursor.execute(f"DROP DATABASE IF EXISTS {DB_NAME};")
cursor.execute(f"CREATE DATABASE {DB_NAME};")
cnx.database = DB_NAME

for table_name in TABLES:
    table_description = TABLES[table_name]
    try:
        print("Creating table {}: ".format(table_name), end="")
        cursor.execute(table_description)
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_TABLE_EXISTS_ERROR:
            print("already exists.")

        else:
            print(err.msg)
    else:
        print("OK")

cursor.close()
cnx.close()
