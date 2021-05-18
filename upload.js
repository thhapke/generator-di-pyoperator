const fs = require("fs");

let raw_file = fs.readFileSync('operators/ddathlete/TrainingData/trainingdata.py');
script_content = raw_file.toString(); 

script_content = script_content.replace(/from utils.mock_di_api import api/,'#from utils.mock_di_api import api');
script_content = script_content.replace(/#\s*api.set_port_callback/g,'api.set_port_callback');
script_content = script_content.replace(/#\s*api.add_generator/g,'api.add_generator');
script_content = script_content.replace(/#\s*api.add_timer/g,'api.add_timer');
script_content = script_content.replace(/#\s*api.add_shutdown_handler/g,'api.add_shutdown_handler');

//console.log(script_content);
let found = script_content.match(/#\s*api.add_generator/g);
console.log(script_content);
