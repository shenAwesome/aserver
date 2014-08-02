This is a application container (http server) based on express.

The idea is developers should not directly manipulate the server in the server.js. Just like tomcat or other enterprise application server, you will modify static files(html/css/js etc.) and dynamic parts (services) and never need to worry about the container.

below will start the server:
 
    require('aserver')(8000);

'html' and 'service' will be created and contain static file(s) and controller(s) respectively
