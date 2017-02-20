<?php
# REPLACE servername, username, password, and tablename for your setup
$dbc = mysql_connect('servername', 'username', 'password'); 
mysql_select_db('tablename', $dbc);

?>
