from utils.mock_di_api import api

from datetime import datetime
import math
import sys
import io
import logging

import pandas as pd

def log(log_str) :
    api.logger.info(log_str)
    api.send('log',log_str)

def on_input(msg):
    
    log('Process: {}'.format(msg.attributes['table_name'] ))
    
    header = [c["name"] for c in msg.attributes['table']['columns']]
    df = pd.DataFrame(msg.body, columns=header)

    
    try : 
        if msg.attributes['table_name'] in ['CYCLING_OUTDOOR', 'CYCLING_INDOOR']:
            power_type = 'POWER'
            width = api.config.w_powerzone
            width_dec = len(str(width).split('.')[1]) if '.' in str(width) else 0 
            log('Width: {}  decimals: {}'.format(width,width_dec))
            df['POWER'] = df[power_type].apply(lambda x : round(math.floor(x/width) * width,width_dec))
            log('POWER values: {}'.format(list(df['POWER'].unique())))
        elif msg.attributes['table_name'] == 'RUNNING' :
            power_type = 'SPEED'
            width = api.config.w_speed_running 
            width_dec = len(str(width).split('.')[1]) if '.' in str(width) else 0 
            log('Width: {}  decimals: {}'.format(width,width_dec))
            df['POWER'] = df[power_type].apply(lambda x : round(math.floor(x/width) * width,width_dec))
            log('POWER values: {}'.format(list(df['POWER'].unique())))
        elif msg.attributes['table_name'] in ['SWIMMING_POOL','SWIMMING_OPEN_WATER'] :
            power_type = 'SPEED'
            width = api.config.w_speed_swimming
            width_dec = len(str(width).split('.')[1]) if '.' in str(width) else 0 
            log('Width: {}  decimals: {}'.format(width,width_dec))
            df['POWER'] = df[power_type].apply(lambda x : round(math.floor(x/width) * width,width_dec))
            log('POWER values: {}'.format(list(df['POWER'].unique())))
        else :
            api.logger.warning('Unsupported table (=sport): {}'.format( msg.attributes['table_name']))
            return 0
            
            
    except AttributeError as ae : 
        api.logger.error('Columns: {} - AttributeError: {}'.format(df.columns,ae))
        log('Columns: {} - AttributeError: {}'.format(df.columns,ae))
        return 0 
        
    #log('colums: {}'.format(df.columns))


    # GROUPBY and reset index
    df = df.groupby(['TRAINING_ID','POWER']).agg({'MINUTE':'count','DATE':'first','HEART_RATE':'mean','CADENCE':'mean'}).reset_index()

    #log('group colums: {}'.format(df.columns))

    df['POWER_TYPE'] = power_type
    df['BIN_WIDTH'] = width
    df['SPORT_TYPE'] = msg.attributes['table_name']
    
    # Cast data types according to target table
    df.CADENCE = df.CADENCE.astype('float32')
    df.HEART_RATE = df.HEART_RATE.astype('float32')
    df.TRAINING_ID = df.TRAINING_ID.astype('int64')
    df.POWER = df.POWER.astype('float32')
    df.BIN_WIDTH = df.BIN_WIDTH.astype('float32')

    # sort dataframe according to target table
    df = df[['TRAINING_ID','SPORT_TYPE','DATE','POWER_TYPE','BIN_WIDTH','POWER','MINUTE','HEART_RATE','CADENCE']]
    
    att = msg.attributes
    att["table"] = {"columns":[
        {"class":str(df[df.columns[0]].dtype),"name":"TRAINING_ID","nullable":False,"type":{"hana":"BIGINT"}},
        {"class":str(df[df.columns[1]].dtype),"name":"SPORT_TYPE","nullable":True,"size":25,"type":{"hana":"NVARCHAR"}},
        {"class":str(df[df.columns[2]].dtype),"name":"DATE","nullable":True,"type":{"hana":"DAYDATE"}},
        {"class":str(df[df.columns[3]].dtype),"name":"POWER_TYPE","nullable":True,"size":10,"type":{"hana":"NVARCHAR"}},
        {"class":str(df[df.columns[4]].dtype),"name":"BIN_WIDTH","nullable":True,"type":{"hana":"FLOAT"}},
        {"class":str(df[df.columns[5]].dtype),"name":"POWER_ZONE","nullable":False,"type":{"hana":"FLOAT"}},
        {"class":str(df[df.columns[6]].dtype),"name":"MINUTES","nullable":True,"type":{"hana":"INTEGER"}},
        {"class":str(df[df.columns[7]].dtype),"name":"HEART_RATE","nullable":True,"type":{"hana":"FLOAT"}},
        {"class":str(df[df.columns[8]].dtype),"name":"CADENCE","nullable":True,"type":{"hana":"FLOAT"}}],"name":"POWERZONES","version":1}

    data = df.values.tolist()
        
    api.send("output", api.Message(attributes = att,body = data))


#api.set_port_callback("input", on_input)


if __name__ == '__main__':
	# inports:
	# name: input   type: message.table

	# config parameter 
	api.config.w_powerzone = 5# datatype : number
	api.config.w_speed_running = 0.1# datatype : number
	api.config.w_speed_swimming = 0.1# datatype : number
