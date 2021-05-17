var Generator = require('yeoman-generator');
var memFs = require("mem-fs");
var editor = require("mem-fs-editor");
var path = require("path");
var mkdirp = require('mkdirp')


// GLOBAL Variables
const operators_path = '/files/vflow/subengines/com/sap/python36/operators/';
const exclude_list = ['.git','.gitignore','LICENSE','README.md'];

//VCTL LOGIN
function _vctl_login(gen,di_url,tenant,user,pwd) {
  const vctl_login = ['login',di_url,tenant,user,'-p',pwd];
  gen.spawnCommandSync('vctl',vctl_login);
};
    //VCTL LS
    function _vctl_ls(gen,op_package) {
      let package_path = ''
      if (op_package == '.') {
        package_path = path.join(operators_path)
      }
      else {
        let operator_path = op_package.replace('.','/')
        package_path = path.join(operators_path,operator_path)
      };
      // call vctl
      const vctl_ls = ['vrep','user','ls',package_path];
      const vctl_ls_out = gen.spawnCommandSync('vctl',vctl_ls,{ stdio: [process.stdout] });
      let file_list = vctl_ls_out.stdout.split("\n");

      // extract list without exclusions
      let files = []
      file_list.forEach(function(item){
        let f = item.trim()
        if (exclude_list.includes(f) == false) {
          files.push(f);
        };
      });
      return files;
    };  

// Read VCTL file
function vctl_read(gen,operator_path) {
  const vctl_cat = ['vrep','user','cat',operator_path];
  const vctl_cat_out = gen.spawnCommandSync('vctl',vctl_cat,{stdio: [process.stdout] });
  return vctl_cat_out.stdout
};

/*
 * Generator
*/
module.exports = class extends Generator {

  constructor(args,opts) {
    super(args,opts);
    this.files_content = {};
    this.operator_dir = '';
    this.script_count = 0; 
  }
  
  async prompting() {
    this.answers = await this.prompt([
      {
        type: "input",
        name: "di_url",
        message: "SAP Data Intelligence URL",
        store: true // Default to current folder name
      },
      {
        type: "input",
        name: "tenant",
        message: "Tenant",
        default: "default",
        store: true
      },
      {
        type: "input",
        name: "user",
        message: "User",
        store: true
      },
      {
        type: "input",
        name: "pwd",
        message: "Password",
        store: true
      },
      /*{
        type: "input",
        name: "package",
        message: "Package",
        default: 'root',
        store: true
      },*/
      {
        type: "input",
        name: "operator",
        message: "Operator",
        store: true
      }
    ]);

    //login
    _vctl_login(this,this.answers.di_url,this.answers.tenant,this.answers.user,this.answers.pwd);

    // List all files in operator folder
    let files = _vctl_ls(this,this.answers.operator);

    // copy files 
    this.operator_dir = this.answers.operator.replace('.','/');
    for (let f = 0; f < files.length; f++ ) {
      // Download file and add to files_content dict
      let operator_path = path.join(operators_path,this.operator_dir,files[f]);
      //let rel_path = path.join(this.operator_dir,files[f]);
      this.files_content[files[f]] = vctl_read(this,operator_path);
      // Test if script-file and count and store reference
      let found = files[f].match('\.py$');
      if (found !== null) {
        this.script_count +=1;
      };
    };
  
    this.log('Number of scripts found: ' + this.script_count)
  };

  
  writing() {
    //this.log('Root: ' + this.destinationRoot())
    this.log('Destination: ' + this.destinationPath());
    let dest_path = path.join(this.destinationRoot(),'operators',this.operator_dir)
    mkdirp(dest_path);

    let config_att = JSON.parse(this.files_content['configSchema.json']);
    let op_att = JSON.parse(this.files_content['operator.json']);
    let script_file = op_att['config']['script'].slice(7);

    // Test empty script -> no script
    if (this.files_content[script_file].length < 20) {
      this.log('Script exist but has not content. Will be overwritten!')
      delete this.files_content[script_file]
    }

    // New python script
    if ((script_file in this.files_content) == false)   {
      this.log('Script file not found: ' + script_file + '  -> New scriptfile created! ');

      // import mock-di-api
      let script_content = '# script framework created by \'di-pyoperator\'\n\n';
      script_content += 'from utils.mock_di_api import api\n\n'
      // generator or callback
      let call_func = ''
      if (('inports' in op_att) ==false || op_att['inports'].length == 0) {
        call_func = 'gen()';
        script_content += 'def '+call_func+' :\n\tpass\n\napi.add_generator(gen)';
      } else {
        for (let ip = 0; ip < op_att['inports'].length; ip++) {
          //this.log('Inport: ' + op_att['inports'][ip]['name']);
          call_func = 'on_'+op_att['inports'][ip]['name']+'(msg)'
          script_content += 'def ' + call_func+' :\n\n';
          for (let op = 0; op < op_att['outports'].length; op++) {
            //this.log('Outport: ' + op_att['outports'][op]['name']);
            script_content += '\tout_msg = None\n';
            script_content += '\tapi.send(\''+op_att['outports'][op]['name']+'\',out_msg)\n\n';
          }
          script_content += 'api.set_port_callback(\''+op_att['inports'][ip]['name']+'\',on_'+op_att['inports'][ip]['name']+')\n\n';
        }
        //this.log('Main');
        script_content += "if __name__ == \'__main__\':\n";
        // config values
        script_content += '\n\t# config parameter \n' ;
        for (let [key, value] of Object.entries(config_att['properties'])) {
          if (key !== 'codelanguage' && key !== 'script' ) {
              //this.log('Config param -  key: ' + key);
              let param_type = '   # datatype : ' + key['type'] + '\n';
              if (key in op_att['config']) {
                value = op_att['config'][key];
                if (value == null) {value = 'None'};
              }
              else { 
                value = 'None';
              };
              script_content +=  '\tapi.config.' + key + ' = ' + value + param_type; 
          };
        };
        script_content += '\n\tmsg = api.Message(attributes={\'operator\':\''+this.answers.operator+'\'},body=None)\n';
        script_content += '\t'+call_func+'\t'
      };
      this.files_content[script_file] = script_content;

    // Adjust python script
    }
    else  {
      this.log('Script file adjusted: '+ script_file);
      //  MOCK_DI_API
      let import_pattern = '^#*\s*from utils.mock_di_api import api'
      if (this.files_content[script_file].match(import_pattern)){
        this.files_content[script_file].replace(import_pattern,'from utils.mock_di_api import api');
      } else {
        this.files_content[script_file] = 'from utils.mock_di_api import api\n\n' +  this.files_content[script_file];
      }

      // CALLBACK
      this.files_content[script_file] = this.files_content[script_file].replace('api.set_port_callback','#api.set_port_callback');
      this.files_content[script_file] = this.files_content[script_file].replace('api.add_generator','#api.add_generator');
      this.files_content[script_file] = this.files_content[script_file].replace('api.add_timer','#api.add_timer');
      this.files_content[script_file] = this.files_content[script_file].replace('api.add_shutdown_handler','#api.add_shutdown_handler');

      // MAIN
      let ifmain_pattern = 'if\s+__name__\s+==\s+[\'\"]__main__[\'\"]\s*:'
      if (this.files_content[script_file].match(ifmain_pattern) == null) {
        let main_str = "if __name__ == \'__main__\':\n";

        // config values
        main_str += '\n\t# config parameter \n' 
        for (const [key, value] of Object.entries(op_att['config'])) {
          if (key !== '$type' && key !== 'script' ) {
              let param_type = '   # datatype : ' + config_att['properties'][key]['type'] + '\n';
              if (value == null) value = 'None'
              main_str = main_str + '\tapi.config.' + key + ' = ' + value + param_type; 
          };
        };
        this.files_content[script_file] += main_str;
      };
    };

    for (const [filename, content] of Object.entries(this.files_content)) {
      this.fs.write(path.join(this.destinationRoot(),'operators',this.operator_dir,filename), content);
    };
  };
};