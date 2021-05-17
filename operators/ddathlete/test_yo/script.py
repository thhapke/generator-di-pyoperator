# script framework created by 'di-pyoperator'

from utils.mock_di_api import api

def on_input(msg) :

	out_msg = None
	api.send('output',out_msg)

api.set_port_callback('input',on_input)

if __name__ == '__main__':

	# config parameter 
	api.config.pstring = None   # datatype : undefined
	api.config.pnumber = None   # datatype : undefined
	msg = api.Message(attributes={'operator':'ddathlete.test_yo'},body=None)
	on_input(msg)	