# script framework created by 'di-pyoperator'

from utils.mock_di_api import api

def on_input(msg) :

	out_msg = None
	api.send('output',out_msg)

# Function called within Data Intelligence pipeline
# Commented out for standalone-development and testing
#api.set_port_callback('input',on_input)

# Main function used for standalone testing only
if __name__ == '__main__':

	# config parameter 
	api.config.pstring = None   # datatype : string
	api.config.pnumber = None   # datatype : number

	msg = api.Message(attributes={'operator':'ddathlete.test_yo'},body=None)
	on_input(msg)	